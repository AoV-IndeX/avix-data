import { z } from "zod";
import { StatsFieldsSchema } from "./stats.js";

export const ArcanaStatsSchema = StatsFieldsSchema.extend({
  arcanaId: z.string().min(1, "Arcana ID must not be empty."),
});

export type ArcanaStats = z.infer<typeof ArcanaStatsSchema>;
