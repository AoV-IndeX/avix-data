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
import { TABLE_DEFINITIONS } from "../schemas/schema-registry.js";
import { TranslationRowSchema } from "../schemas/i18n/translation.js";

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

interface I18nParent {
  readonly data: TableData;
  readonly target: string | null;
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
     *   parent:    1_heroes
     *   relations: nameKey
     *
     * They may have gid = null in a domain workbook because
     * the physical i18n table lives in the separate i18n workbook.
     */
    if (entry.type === "i18n" && entry.parent !== null) {
      store.i18nLinks.push({
        i18nTable: entry.table,
        parentTable: entry.parent,
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

  const schema =
    manifest.type === "i18n" ? TranslationRowSchema : TABLE_DEFINITIONS[manifest.table]?.schema;

  if (schema === undefined) {
    throw new CompileError(`No table definition mapped for table "${manifest.table}".`, {
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
 * The relation declared by the manifest identifies the corresponding
 * parent record.
 */
function mergeExtensions(store: PipelineStore, compiled: Map<string, TableData>): void {
  for (const manifest of store.manifests) {
    if (!manifest.isEnabled || manifest.type !== "extension") {
      continue;
    }

    const extensionData = compiled.get(manifest.table);

    if (extensionData === undefined) {
      throw new CompileError(`No data found for extension table "${manifest.table}".`, {
        table: manifest.table,
      });
    }

    if (manifest.parent === null) {
      throw new CompileError(`Extension table "${manifest.table}" has no parent.`, {
        table: manifest.table,
      });
    }

    if (manifest.relations.length !== 1) {
      throw new CompileError(
        `Extension table "${manifest.table}" must have exactly one relation for merging.`,
        {
          table: manifest.table,
          val: {
            relations: manifest.relations,
          },
        },
      );
    }

    if (manifest.cardinality === null) {
      throw new CompileError(`Extension table "${manifest.table}" has no cardinality.`, {
        table: manifest.table,
      });
    }

    const definition = TABLE_DEFINITIONS[manifest.table];

    if (definition === undefined) {
      throw new CompileError(`No table definition mapped for extension "${manifest.table}".`, {
        table: manifest.table,
      });
    }

    if (definition.target === undefined) {
      throw new CompileError(`Extension table "${manifest.table}" has no assembly target.`, {
        table: manifest.table,
      });
    }

    const [relation] = manifest.relations;

    if (relation === undefined) {
      throw new CompileError(`Invalid relation definition for extension "${manifest.table}".`, {
        table: manifest.table,
      });
    }

    const parentManifest = store.manifests.find((entry) => entry.table === manifest.parent);

    if (parentManifest === undefined) {
      throw new CompileError(
        `Parent table "${manifest.parent}" not found for extension "${manifest.table}".`,
        {
          table: manifest.table,
        },
      );
    }

    if (parentManifest.primaryKey.length !== 1) {
      throw new CompileError(
        `Parent table "${manifest.parent}" must have exactly one primary key for extension "${manifest.table}".`,
        {
          table: manifest.table,
          val: {
            primaryKey: parentManifest.primaryKey,
          },
        },
      );
    }

    const [parentKey] = parentManifest.primaryKey;

    if (parentKey === undefined) {
      throw new CompileError(
        `Parent table "${manifest.parent}" has an invalid primary key definition.`,
        {
          table: manifest.table,
        },
      );
    }

    const parentData = compiled.get(manifest.parent);

    if (parentData === undefined) {
      throw new CompileError(
        `Parent table "${manifest.parent}" not found for extension "${manifest.table}".`,
        {
          table: manifest.table,
        },
      );
    }

    const parentIndex = new Map<string, TableRecord>();

    for (const parentRecord of parentData) {
      const parentKeyValue = parentRecord[parentKey];

      if (typeof parentKeyValue !== "string") {
        throw new CompileError(
          `Parent table "${manifest.parent}" has an invalid primary key value.`,
          {
            table: manifest.parent,
            val: {
              field: parentKey,
              value: parentKeyValue,
            },
          },
        );
      }

      parentIndex.set(parentKeyValue, parentRecord);
    }

    for (const extensionRecord of extensionData) {
      const relationValue = extensionRecord[relation];

      if (typeof relationValue !== "string") {
        throw new CompileError(
          `Extension table "${manifest.table}" has an invalid relation value.`,
          {
            table: manifest.table,
            val: {
              field: relation,
              value: relationValue,
            },
          },
        );
      }

      const parentRecord = parentIndex.get(relationValue);

      if (parentRecord === undefined) {
        throw new CompileError(`Could not find parent record for extension "${manifest.table}".`, {
          table: manifest.table,
          val: {
            field: relation,
            value: relationValue,
          },
        });
      }

      const nestedRecord = { ...extensionRecord };
      delete nestedRecord[relation];

      if (manifest.cardinality === "one") {
        parentRecord[definition.target] = nestedRecord;
        continue;
      }

      const existing = parentRecord[definition.target];

      if (existing === undefined) {
        parentRecord[definition.target] = [nestedRecord];
        continue;
      }

      if (!Array.isArray(existing)) {
        throw new CompileError(
          `Assembly target "${definition.target}" on parent table "${manifest.parent}" is not an array.`,
          {
            table: manifest.table,
            val: {
              field: definition.target,
              value: existing,
            },
          },
        );
      }

      existing.push(nestedRecord);
    }

    compiled.delete(manifest.table);
  }
}

/**
 * Resolves all i18n relationships for one locale.
 *
 * An i18n relationship's parent may refer to either:
 *
 *   1. a main/domain table that still exists directly in `compiled`, or
 *   2. an extension table that has already been assembled into its
 *      parent's `target` field.
 *
 * Example:
 *
 *   11_i18n-heroes
 *     parent = 1_heroes
 *
 * resolves directly on hero records.
 *
 * Whereas:
 *
 *   23_i18n-equipment-passives
 *     parent = 3_equipment-passives
 *
 * resolves inside:
 *
 *   1_equipments[].passives[]
 *
 * because `3_equipment-passives` has already been assembled into
 * `1_equipments.passives`.
 */
function resolveI18n(store: PipelineStore, compiled: Map<string, TableData>, locale: Locale): void {
  for (const link of store.i18nLinks) {
    const parent = resolveI18nParent(store, compiled, link.parentTable);
    const i18nData = store.tables.get(link.i18nTable);

    if (parent === undefined || i18nData === undefined) {
      continue;
    }

    const dictionary = buildI18nDictionary(i18nData);

    for (const index of parent.data.keys()) {
      const record = parent.data[index];

      if (!record) {
        continue;
      }

      if (parent.target === null) {
        parent.data[index] = resolveI18nRecord(
          record,
          link.relations,
          dictionary,
          locale,
        ) as TableRecord;

        continue;
      }

      const nestedValue = record[parent.target];

      if (nestedValue === undefined) {
        continue;
      }
      record[parent.target] = resolveI18nValue(nestedValue, link.relations, dictionary, locale);
    }
  }
}

/**
 * Resolves the compiled location represented by an i18n relationship.
 *
 * Direct parent:
 *
 *   parentTable = 1_equipments
 *   -> compiled["1_equipments"]
 *   -> target = null
 *
 * Extension parent:
 *
 *   parentTable = 3_equipment-passives
 *   -> extension.parent = 1_equipments
 *   -> extension target = passives
 *   -> compiled["1_equipments"].passives
 */
function resolveI18nParent(
  store: PipelineStore,
  compiled: Map<string, TableData>,
  parentTable: string,
): I18nParent | undefined {
  const directData = compiled.get(parentTable);

  if (directData !== undefined) {
    return {
      data: directData,
      target: null,
    };
  }

  const extension = store.manifests.find(
    (manifest) => manifest.table === parentTable && manifest.type === "extension",
  );

  if (extension === undefined || extension.parent === null) {
    return undefined;
  }

  const parentData = compiled.get(extension.parent);

  if (parentData === undefined) {
    return undefined;
  }

  const definition = TABLE_DEFINITIONS[extension.table];

  if (definition === undefined || definition.target === undefined) {
    return undefined;
  }

  return {
    data: parentData,
    target: definition.target,
  };
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
 * Recursively resolves i18n fields throughout an assembled record.
 *
 * This allows an i18n relationship declared for an extension table
 * to resolve fields inside nested objects and arrays.
 *
 * Example:
 *
 *   {
 *     equipmentId,
 *     passives: [
 *       {
 *         nameKey,
 *         descriptionKey
 *       }
 *     ]
 *   }
 *
 * becomes:
 *
 *   {
 *     equipmentId,
 *     passives: [
 *       {
 *         name,
 *         description
 *       }
 *     ]
 *   }
 */
function resolveI18nValue(
  value: unknown,
  relations: readonly string[],
  dictionary: Map<string, TableRecord>,
  locale: Locale,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => resolveI18nValue(item, relations, dictionary, locale));
  }

  if (!isTableRecord(value)) {
    return value;
  }

  return resolveI18nRecord(value, relations, dictionary, locale);
}

function resolveI18nRecord(
  record: TableRecord,
  relations: readonly string[],
  dictionary: Map<string, TableRecord>,
  locale: Locale,
): TableRecord {
  const resolved: TableRecord = {};

  for (const [key, value] of Object.entries(record)) {
    if (!relations.includes(key) || typeof value !== "string") {
      resolved[key] = value;
      continue;
    }

    const translation = dictionary.get(value);

    if (translation === undefined) {
      resolved[key] = value;
      continue;
    }

    const target = key.replace(/Key$/, "");
    resolved[target] = translation[locale] ?? translation.en;
  }

  return resolved;
}
/**
 * Removes null-valued properties recursively from all final records.
 */
function omitNullsFromTables(compiled: Map<string, TableData>): void {
  for (const [tableName, records] of compiled) {
    compiled.set(tableName, records.map(omitNulls));
  }
}

function omitNulls(record: TableRecord): TableRecord {
  return Object.fromEntries(
    Object.entries(record)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => [key, omitNullsValue(value)]),
  );
}

function omitNullsValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(omitNullsValue);
  }

  if (!isTableRecord(value)) {
    return value;
  }

  return omitNulls(value);
}

function isTableRecord(value: unknown): value is TableRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
