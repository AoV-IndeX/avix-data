export const LOCALES = ["en"] as const; // "vi", "zh"

export type Locale = (typeof LOCALES)[number];
