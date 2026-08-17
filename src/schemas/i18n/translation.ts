import { z } from "zod";

export const TranslationRowSchema = z
  .object({
    key: z.string().min(1, "Translation key must not be empty."),
  })
  .catchall(z.string());

export type TranslationRow = z.infer<typeof TranslationRowSchema>;

export type TranslationMap = Record<string, Record<string, string>>;
