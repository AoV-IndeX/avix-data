import { z } from "zod";

import { StatsSchema } from "./stats.js";

export const EquipmentStatsSchema = z.object({
  equipmentId: z.string().min(1, "Equipment ID must not be empty."),
  stats: StatsSchema.partial().optional(),
});
