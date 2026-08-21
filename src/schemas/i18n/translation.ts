import { z } from "zod";

export const TranslationRowSchema = z
  .object({
    key: z.string().min(1),

    en: z.string().min(1),

    // Optional locales
    vi: z.string().nullable().optional(),
    zh: z.string().nullable().optional(),
  })
  .catchall(z.string().nullable());
