import { z } from "zod";

export const EquipmentPassiveSchema = z.object({
  passiveId: z.string().min(1),
  equipmentId: z.string().min(1),
  index: z.number(),
  nameKey: z.string(),
  descriptionKey: z.string(),
  cooldown: z.number().optional(),
  uniqueGroup: z.string().optional(),
});
