export const LOCALES = ["en", "vi"] as const; // "vi", "zh"

export type Locale = (typeof LOCALES)[number];
