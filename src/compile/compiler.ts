import * as fs from "node:fs/promises";
import * as path from "node:path";

import {
  buildPublishedTsvUrl,
  validateEnvironment,
  WORKBOOKS,
  type WorkbookConfig,
} from "../config/sheets.js";
import { fetchTsv } from "../fetch/fetcher.js";
import { normalizeRecord } from "../normalize/normalizer.js";
import { parseTsv } from "../parse/tsv-parser.js";
import { TABLE_SCHEMAS } from "../schemas/schema-registry.js";
import { SheetManifestSchema } from "../schemas/source/sheet-manifest.js";

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

export async function runCompiler(): Promise<void> {
  validateEnvironment();

  const outputDir = path.join(process.cwd(), "data");
  await fs.mkdir(outputDir, { recursive: true });

  console.log("⚙️ Starting avix-data compile pipeline...\n");

  for (const config of Object.values(WORKBOOKS)) {
    await compileWorkbook(config, outputDir);
  }

  console.log("\n✅ Finished avix-data compile pipeline.");
}

async function compileWorkbook(config: WorkbookConfig, outputDir: string): Promise<void> {
  console.log(`\n📦 ${config.name}`);

  const manifest = await fetchManifest(config);

  for (const table of manifest) {
    if (!table.enabled) {
      continue;
    }

    await compileTable(config, table, outputDir);
  }
}

async function fetchManifest(config: WorkbookConfig) {
  const url = buildPublishedTsvUrl(config.baseUrl);

  const rawTsv = await fetchTsv(url, config.name, "Info");

  console.log(`${`[fetch]·${config.name}·Info`.padEnd(35)}☑`);

  const rows = parseTsv(rawTsv);

  return rows.map((row, index) => {
    const result = SheetManifestSchema.safeParse(normalizeRecord(row));

    if (!result.success) {
      throw new CompileError(`Invalid sheet manifest on row ${index + 2}`, {
        workbook: config.name,
        table: "Info",
        row: index + 2,
        val: row,
      });
    }

    return result.data;
  });
}

async function compileTable(
  config: WorkbookConfig,
  manifest: {
    key: string;
    gid: string;
    headers: string[];
    enabled: boolean;
  },
  outputDir: string,
): Promise<void> {
  const schema = TABLE_SCHEMAS[manifest.key as keyof typeof TABLE_SCHEMAS];

  if (!schema) {
    throw new CompileError(`No schema registered for enabled table "${manifest.key}"`, {
      workbook: config.name,
      table: manifest.key,
    });
  }

  const url = buildPublishedTsvUrl(config.baseUrl, manifest.gid);
  const rawTsv = await fetchTsv(url, config.name, manifest.key);

  console.log(`${`[fetch]·${config.name}·${manifest.key}`.padEnd(35)}☑`);

  const rows = parseTsv(rawTsv);

  if (rows.length === 0) {
    throw new CompileError(`Empty table "${manifest.key}"`, {
      workbook: config.name,
      table: manifest.key,
    });
  }

  validateHeaders(rows[0], manifest.headers, config.name, manifest.key);

  const entities: unknown[] = [];

  for (const [index, row] of rows.entries()) {
    const normalized = normalizeRecord(row);

    const result = schema.safeParse(normalized);

    if (!result.success) {
      throw new CompileError(`Invalid record on row ${index + 2}`, {
        workbook: config.name,
        table: manifest.key,
        row: index + 2,
        val: row,
      });
    }

    entities.push(result.data);
  }

  const outputName = manifest.key.replace(/^\d+_/, "");
  const outputPath = path.join(outputDir, `${outputName}.json`);

  await fs.writeFile(outputPath, `${JSON.stringify(entities, null, 2)}\n`, "utf8");

  console.log(`${`[write]·${outputPath}`.padEnd(35)}☑`);
}

function validateHeaders(
  firstRow: Record<string, string> | undefined,
  expectedHeaders: string[],
  workbookName: string,
  tableName: string,
): void {
  if (!firstRow) {
    throw new CompileError(`Cannot inspect headers of empty table`, {
      workbook: workbookName,
      table: tableName,
    });
  }

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
