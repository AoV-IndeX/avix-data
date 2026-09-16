import { z } from "zod";
import { StatsSchema } from "./stats.js";

export const ArcanaStatsSchema = z.object({
  arcanaId: z.string().min(1, "Arcana ID must not be empty."),
  stats: StatsSchema.partial().optional(),
});

export type ArcanaStats = z.infer<typeof ArcanaStatsSchema>;
