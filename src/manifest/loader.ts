import { buildPublishedTsvUrl, type WorkbookConfig } from "../config/workbooks.js";
import { fetchTsv } from "../fetch/fetcher.js";
import { parseTsv } from "../parse/tsv-parser.js";
import { parseManifest } from "./parser.js";
import type { ManifestEntry } from "./types.js";

export async function loadManifest(workbook: WorkbookConfig): Promise<ManifestEntry[]> {
  const url = buildPublishedTsvUrl(workbook.baseUrl);
  const raw = await fetchTsv(url, workbook.name, "Manifest");
  const rows = parseTsv(raw);

  return parseManifest(rows);
}
