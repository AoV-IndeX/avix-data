export function normalizeValue(key: string, value: string): unknown {
  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  const upper = trimmed.toUpperCase();

  if (upper === "TRUE") return true;
  if (upper === "FALSE") return false;

  if (trimmed.includes("|")) {
    return trimmed
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const isIdKey = /id(?:_|$)/i.test(key);

  if (!isIdKey && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

export function normalizeRecord(record: Record<string, string>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(record)) {
    normalized[key] = normalizeValue(key, val);
  }
  return normalized;
}
