import { z } from "zod";

import { StatsFieldsSchema } from "./stats.js";

export const EquipmentStatsSchema = StatsFieldsSchema.extend({
  equipmentId: z.string().min(1, "Equipment ID must not be empty."),
});
