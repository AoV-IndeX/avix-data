export const LOCALES = ["en", "vi", "zh", "th"] as const; // "vi", "zh"

export type Locale = (typeof LOCALES)[number];
