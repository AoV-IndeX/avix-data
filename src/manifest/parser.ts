import { type ManifestEntry, ManifestEntrySchema } from "./types.js";

type RawRow = Record<string, string>;

function requiredField(row: RawRow, field: string): string {
  const value = row[field];
  if (value === undefined) {
    throw new Error(`[manifest] Missing column "${field}".`);
  }
  return value;
}

function parseList(value: string): string[] {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseManifestRow(row: RawRow, index: number): ManifestEntry {
  const isEnabledRaw = requiredField(row, "isEnabled").trim().toUpperCase();
  if (isEnabledRaw !== "TRUE" && isEnabledRaw !== "FALSE") {
    throw new Error(
      `[manifest] Row ${index + 2}: "isEnabled" must be TRUE or FALSE, got "${isEnabledRaw}".`,
    );
  }

  const gidStr = requiredField(row, "gid").trim();

  return ManifestEntrySchema.parse({
    table: requiredField(row, "table").trim(),
    gid: gidStr === "" ? null : gidStr,
    type: requiredField(row, "type").trim(),
    primaryKey: parseList(requiredField(row, "primaryKey")),
    parents: parseList(requiredField(row, "parents")),
    relations: parseList(requiredField(row, "relations")),
    headers: parseList(requiredField(row, "headers")),
    isEnabled: isEnabledRaw === "TRUE",
  });
}

export function parseManifest(rows: RawRow[]): ManifestEntry[] {
  return rows.map((row, idx) => parseManifestRow(row, idx));
}
