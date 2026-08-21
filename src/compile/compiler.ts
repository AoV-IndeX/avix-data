import * as fs from "node:fs/promises";
import * as path from "node:path";

import { LOCALES, type Locale } from "../config/locales.js";
import {
  buildPublishedTsvUrl,
  validateEnvironment,
  WORKBOOKS,
  type WorkbookConfig,
} from "../config/workbooks.js";
import { fetchTsv } from "../fetch/fetcher.js";
import { loadManifest } from "../manifest/loader.js";
import type { ManifestEntry } from "../manifest/types.js";
import { normalizeRecord } from "../normalize/normalizer.js";
import { parseTsv } from "../parse/tsv-parser.js";
import { TABLE_SCHEMAS } from "../schemas/schema-registry.js";

export class CompileError extends Error {
  constructor(
    message: string,
    public details: {
      workbook?: string;
      table?: string;
      row?: number;
      column?: number;
      val?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "CompileError";
  }
}

type TableRecord = Record<string, unknown>;
type TableData = TableRecord[];

interface I18nRelationship {
  readonly i18nTable: string;
  readonly parentTable: string;
  readonly relations: readonly string[];
}

class PipelineStore {
  public manifests: ManifestEntry[] = [];
  public tables = new Map<string, TableData>();
  public i18nLinks: I18nRelationship[] = [];
}

export async function runCompiler(): Promise<void> {
  validateEnvironment();

  const outputDir = path.join(process.cwd(), "data");
  await fs.mkdir(outputDir, { recursive: true });

  const store = new PipelineStore();

  console.log("⚙️ Starting avix-data compile pipeline...\n");

  // Phase 1:
  // Load every enabled physical table from every workbook.
  for (const config of Object.values(WORKBOOKS)) {
    await compileWorkbookIntoMemory(config, store);
  }

  // Phase 2:
  // Produce a complete artifact set for every configured locale.
  console.log("\n💾 Emitting localized artifacts...");

  for (const locale of LOCALES) {
    console.log(`\n🌐 ${locale}`);

    const compiled = compileLocale(store, locale);

    for (const manifest of store.manifests) {
      // i18n tables and extension tables are compiler inputs.
      // Neither is emitted as an independent artifact.
      if (!manifest.isEnabled || manifest.type === "i18n" || manifest.type === "extension") {
        continue;
      }

      const data = compiled.get(manifest.table);

      if (!data) {
        throw new CompileError(`No compiled data found for table "${manifest.table}".`, {
          table: manifest.table,
        });
      }

      await emitArtifact(manifest, data, outputDir, locale);
    }
  }

  console.log("\n✅ Finished avix-data compile pipeline.");
}

/**
 * Loads manifests and physical table data into the pipeline store.
 *
 * This phase does not perform any transformations.
 */
async function compileWorkbookIntoMemory(
  config: WorkbookConfig,
  store: PipelineStore,
): Promise<void> {
  console.log(`\n📦 ${config.name}`);

  const manifest = await loadManifest(config);

  for (const entry of manifest) {
    if (!entry.isEnabled) {
      continue;
    }

    /*
     * i18n entries describe relationships to external/domain tables.
     *
     * Example:
     *
     *   table:     11_i18n-heroes
     *   type:      i18n
     *   parents:   1_heroes
     *   relations: nameKey
     *
     * They may have gid = null in a domain workbook because
     * the physical i18n table lives in the separate i18n workbook.
     */
    const [parentTable] = entry.parents;

    if (entry.type === "i18n" && entry.parents.length === 1 && parentTable !== undefined) {
      store.i18nLinks.push({
        i18nTable: entry.table,
        parentTable,
        relations: entry.relations,
      });
    }

    /*
     * No GID means this entry is only metadata / relationship
     * information and does not identify a physical sheet here.
     */
    if (entry.gid === null) {
      console.log(`${`[skip]·${config.name}·${entry.table}`.padEnd(35)} (No GID)`);
      continue;
    }

    const data = await fetchAndValidateTable(config, entry);

    store.manifests.push(entry);
    store.tables.set(entry.table, data);
  }
}

/**
 * Fetches, parses and validates one physical table.
 */
async function fetchAndValidateTable(
  config: WorkbookConfig,
  manifest: ManifestEntry,
): Promise<TableData> {
  if (manifest.gid === null) {
    throw new CompileError(`Cannot fetch table "${manifest.table}" without a GID.`, {
      workbook: config.name,
      table: manifest.table,
    });
  }

  const schema = TABLE_SCHEMAS[manifest.table];

  if (schema === undefined) {
    throw new CompileError(`No schema mapped for table "${manifest.table}".`, {
      workbook: config.name,
      table: manifest.table,
    });
  }

  if (schema === null) {
    throw new CompileError(`Schema for table "${manifest.table}" is not implemented.`, {
      workbook: config.name,
      table: manifest.table,
    });
  }

  const url = buildPublishedTsvUrl(config.baseUrl, manifest.gid);

  const rawTsv = await fetchTsv(url, config.name, manifest.table);

  console.log(`${`[fetch]·${config.name}·${manifest.table}`.padEnd(35)}☑`);

  const rows = parseTsv(rawTsv);

  const [firstRow] = rows;

  if (!firstRow) {
    throw new CompileError(`Empty table "${manifest.table}".`, {
      workbook: config.name,
      table: manifest.table,
    });
  }

  validateHeaders(firstRow, manifest.headers, config.name, manifest.table);

  const entities: TableData = [];

  for (const [index, row] of rows.entries()) {
    const normalized = normalizeRecord(row);

    const result = schema.safeParse(normalized);

    if (!result.success) {
      throw new CompileError(`Invalid record on row ${index + 2}.`, {
        workbook: config.name,
        table: manifest.table,
        row: index + 2,
        val: row,
      });
    }

    entities.push(result.data as TableRecord);
  }

  return entities;
}

/**
 * Compiles the source data into the consumer-facing representation
 * for one locale.
 *
 * Source data in PipelineStore is never mutated.
 */
function compileLocale(store: PipelineStore, locale: Locale): Map<string, TableData> {
  const compiled = cloneDomainTables(store);

  mergeExtensions(store, compiled);
  resolveI18n(store, compiled, locale);
  omitNullsFromTables(compiled);

  return compiled;
}

/**
 * Creates independent copies of all non-i18n tables.
 *
 * Extension tables are included here because they still need to be
 * merged into their parents.
 */
function cloneDomainTables(store: PipelineStore): Map<string, TableData> {
  const compiled = new Map<string, TableData>();

  for (const manifest of store.manifests) {
    if (!manifest.isEnabled || manifest.type === "i18n") {
      continue;
    }

    const source = store.tables.get(manifest.table);

    if (!source) {
      throw new CompileError(`No data found for table "${manifest.table}".`, {
        table: manifest.table,
      });
    }

    compiled.set(
      manifest.table,
      source.map((record) => ({ ...record })),
    );
  }

  return compiled;
}

/**
 * Merges extension tables into their parent tables.
 *
 * Example:
 *
 *   1_arcanas
 *   2_arcana-stats
 *
 * becomes one logical artifact:
 *
 *   arcanas.json
 *
 * The relation declared by the manifest tells us which field
 * identifies the corresponding parent record.
 */
function mergeExtensions(store: PipelineStore, compiled: Map<string, TableData>): void {
  for (const manifest of store.manifests) {
    if (!manifest.isEnabled || manifest.type !== "extension") {
      continue;
    }

    const extensionData = compiled.get(manifest.table);

    if (!extensionData) {
      throw new CompileError(`No data found for extension table "${manifest.table}".`, {
        table: manifest.table,
      });
    }

    /*
     * The current architecture allows multiple parents/relations
     * conceptually, but a normal extension merge needs a concrete
     * join strategy. For now, enforce one parent/relation.
     */
    if (manifest.parents.length !== 1 || manifest.relations.length !== 1) {
      throw new CompileError(
        `Extension table "${manifest.table}" must have exactly one parent and one relation for merging.`,
        {
          table: manifest.table,
          val: {
            parents: manifest.parents,
            relations: manifest.relations,
          },
        },
      );
    }

    const [parentTable] = manifest.parents;
    const [relation] = manifest.relations;

    if (parentTable === undefined || relation === undefined) {
      throw new CompileError(
        `Invalid parent/relation definition for extension "${manifest.table}".`,
        {
          table: manifest.table,
        },
      );
    }

    const parentData = compiled.get(parentTable);

    if (!parentData) {
      throw new CompileError(
        `Parent table "${parentTable}" not found for extension "${manifest.table}".`,
        {
          table: manifest.table,
        },
      );
    }

    const parentIndex = new Map<unknown, TableRecord>();

    for (const parentRecord of parentData) {
      parentIndex.set(parentRecord[relation], parentRecord);
    }

    for (const extensionRecord of extensionData) {
      const relationValue = extensionRecord[relation];

      const parentRecord = parentIndex.get(relationValue);

      if (!parentRecord) {
        throw new CompileError(`Could not find parent record for extension "${manifest.table}".`, {
          table: manifest.table,
          val: extensionRecord,
        });
      }

      /*
       * The relation field only identifies the parent.
       * It should not be duplicated into the merged entity.
       */
      const extensionFields = {
        ...extensionRecord,
      };

      delete extensionFields[relation];

      Object.assign(parentRecord, extensionFields);
    }

    /*
     * The extension has now become part of its parent.
     * It must not be emitted independently.
     */
    compiled.delete(manifest.table);
  }
}

/**
 * Resolves all i18n relationships for one locale.
 *
 * Example:
 *
 *   nameKey: "arcana.red_wise.name"
 *
 * becomes:
 *
 *   name: "Wise"
 *
 * The original nameKey is removed.
 */
function resolveI18n(store: PipelineStore, compiled: Map<string, TableData>, locale: Locale): void {
  for (const link of store.i18nLinks) {
    const parentData = compiled.get(link.parentTable);
    const i18nData = store.tables.get(link.i18nTable);

    if (!parentData || !i18nData) {
      continue;
    }

    const dictionary = buildI18nDictionary(i18nData);

    for (const index of parentData.keys()) {
      const record = parentData[index];

      if (!record) {
        continue;
      }

      parentData[index] = resolveI18nRecord(record, link.relations, dictionary, locale);
    }
  }
}

/**
 * Builds:
 *
 *   translation key → translation row
 */
function buildI18nDictionary(rows: TableData): Map<string, TableRecord> {
  const dictionary = new Map<string, TableRecord>();

  for (const row of rows) {
    const key = row.key;

    if (typeof key !== "string") {
      continue;
    }

    dictionary.set(key, row);
  }

  return dictionary;
}

/**
 * Resolves *Key fields while preserving their original property
 * position in the object.
 *
 * Example:
 *
 *   {
 *     arcanaId,
 *     colorId,
 *     nameKey,
 *     asset
 *   }
 *
 * becomes:
 *
 *   {
 *     arcanaId,
 *     colorId,
 *     name,
 *     asset
 *   }
 */
function resolveI18nRecord(
  record: TableRecord,
  relations: readonly string[],
  dictionary: Map<string, TableRecord>,
  locale: Locale,
): TableRecord {
  const relationSet = new Set(relations);
  const result: TableRecord = {};

  for (const [key, value] of Object.entries(record)) {
    if (!relationSet.has(key)) {
      result[key] = value;
      continue;
    }

    /*
     * A *Key field should contain the string identifying the
     * translation row.
     */
    if (typeof value !== "string") {
      continue;
    }

    const translation = dictionary.get(value);

    /*
     * Missing translations are simply omitted from the artifact.
     */
    if (!translation) {
      continue;
    }

    const translatedValue = translation[locale];

    /*
     * A locale can legitimately have no translation yet.
     * Do not emit null.
     */
    if (translatedValue === null || translatedValue === undefined) {
      continue;
    }

    /*
     * nameKey       -> name
     * descriptionKey -> description
     * usageKey       -> usage
     *
     * Because this assignment happens at the point where the
     * original *Key field occurred, its property order is preserved.
     */
    const outputKey = key.replace(/Key$/, "");

    result[outputKey] = translatedValue;
  }

  return result;
}

/**
 * Removes null-valued properties from all final records.
 */
function omitNullsFromTables(compiled: Map<string, TableData>): void {
  for (const [tableName, records] of compiled) {
    compiled.set(tableName, records.map(omitNulls));
  }
}

function omitNulls(record: TableRecord): TableRecord {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== null));
}

/**
 * Emits:
 *
 *   data/en/heroes.json
 *   data/en/arcanas.json
 *   data/vi/heroes.json
 *   data/vi/arcanas.json
 *   ...
 */
async function emitArtifact(
  manifest: ManifestEntry,
  data: TableData,
  outputDir: string,
  locale: Locale,
): Promise<void> {
  const outputName = manifest.table.replace(/^\d+_/, "");

  const localeDir = path.join(outputDir, locale);

  await fs.mkdir(localeDir, {
    recursive: true,
  });

  const outputPath = path.join(localeDir, `${outputName}.json`);

  await fs.writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  console.log(`${`[write]·${locale}·${outputName}`.padEnd(35)}☑`);
}

function validateHeaders(
  firstRow: Record<string, string>,
  expectedHeaders: readonly string[],
  workbookName: string,
  tableName: string,
): void {
  const actualHeaders = Object.keys(firstRow);

  const missing = expectedHeaders.filter((header) => !actualHeaders.includes(header));

  if (missing.length > 0) {
    throw new CompileError(`Missing expected headers: ${missing.join(", ")}`, {
      workbook: workbookName,
      table: tableName,
      val: {
        expected: expectedHeaders,
        received: actualHeaders,
      },
    });
  }
}
