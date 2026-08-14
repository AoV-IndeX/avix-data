export function parseTsv(raw: string): Record<string, string>[] {
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);

  const [headerLine, ...dataLines] = lines;

  if (headerLine === undefined) {
    return [];
  }

  const headers = headerLine.split("\t").map((header) => header.trim());
  const records: Record<string, string>[] = [];

  for (const [index, line] of dataLines.entries()) {
    const cells = line.split("\t").map((cell) => cell.trim());

    if (cells.length > headers.length) {
      throw new Error(
        `[parse] Row ${index + 2} has ${cells.length} cells, expected ${headers.length}.`,
      );
    }

    const record: Record<string, string> = {};

    for (const [index, header] of headers.entries()) {
      record[header] = cells[index] ?? "";
    }

    records.push(record);
  }

  return records;
}
