import { z } from "zod";

export const EquipmentSchema = z.object({
  equipmentId: z.string().min(1, "Equipment ID must not be empty."),
  categoryId: z.string().min(1, "Category ID must not be empty."),
  level: z.number(),
  number: z.number(),
  nameKey: z.string(),
  asset: z.string(),
});

export type Equipment = z.infer<typeof EquipmentSchema>;
