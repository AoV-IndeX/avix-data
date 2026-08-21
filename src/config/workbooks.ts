export interface WorkbookConfig {
  readonly name: string;
  readonly baseUrl: string;
}

const ENV_KEYS = [
  "HERO_WORKBOOK_URL",
  "EQUIPMENT_WORKBOOK_URL",
  "ARCANA_WORKBOOK_URL",
  "ENCHANTMENT_WORKBOOK_URL",
  "TALENT_WORKBOOK_URL",
  "I18N_WORKBOOK_URL",
] as const;

export function validateEnvironment(): void {
  const missing = ENV_KEYS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing configuration environment variables:\n${missing
        .map((key) => ` - ${key}`)
        .join("\n")}`,
    );
  }
}

export const WORKBOOKS: Record<string, WorkbookConfig> = Object.freeze({
  HERO: {
    name: "Hero",
    baseUrl: process.env.HERO_WORKBOOK_URL ?? "",
  },
  EQUIPMENT: {
    name: "Equipment",
    baseUrl: process.env.EQUIPMENT_WORKBOOK_URL ?? "",
  },
  ARCANA: {
    name: "Arcana",
    baseUrl: process.env.ARCANA_WORKBOOK_URL ?? "",
  },
  ENCHANTMENT: {
    name: "Enchantment",
    baseUrl: process.env.ENCHANTMENT_WORKBOOK_URL ?? "",
  },
  TALENT: {
    name: "Talent",
    baseUrl: process.env.TALENT_WORKBOOK_URL ?? "",
  },
  I18N: {
    name: "I18N",
    baseUrl: process.env.I18N_WORKBOOK_URL ?? "",
  },
});

export function buildPublishedTsvUrl(baseUrl: string, gid?: string): string {
  try {
    const url = new URL(baseUrl);

    url.searchParams.set("output", "tsv");

    if (gid !== undefined) {
      url.searchParams.set("gid", gid);
    }

    return url.toString();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to build published TSV URL for "${baseUrl}": ${message}`);
  }
}
