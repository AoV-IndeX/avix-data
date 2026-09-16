import { z } from "zod";
import { StatsSchema } from "./stats.js";

export const EquipmentSchema = z.object({
  equipmentId: z.string().min(1, "Equipment ID must not be empty."),
  categoryId: z.string().min(1, "Category ID must not be empty."),
  level: z.number(),
  number: z.number(),
  price: z.number(),
  recipe: z.array(z.string()).optional(),
  isActive: z.boolean(),
  nameKey: z.string(),
  asset: z.string(),

  stats: StatsSchema.partial().optional(),
});

export type Equipment = z.infer<typeof EquipmentSchema>;
