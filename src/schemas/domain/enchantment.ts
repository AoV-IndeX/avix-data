import { z } from "zod";

export const EnchantmentSchema = z.object({
  enchantmentId: z.string().min(1, "Enchantment ID must not be empty."),
  categoryId: z.string().min(1, "Category ID must not be empty."),
  level: z.number(),
  number: z.number(),
  cooldown: z.string(),
  description: z.string(),
  asset: z.string(),
});

export type Enchantment = z.infer<typeof EnchantmentSchema>;
