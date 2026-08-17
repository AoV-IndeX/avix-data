import { z } from "zod";

export const HeroSchema = z.object({
  heroId: z.string().min(1, "Hero ID must not be empty."),
  roleId_1: z.string().min(1, "Role ID 1 must not be empty."),
  roleId_2: z.string().nullable(),
  laneId_1: z.string().min(1, "Lane ID 1 must not be empty."),
  laneId_2: z.string().nullable(),
  laneId_3: z.string().nullable(),
  nameKey: z.string(),
  assetAvatar: z.string(),
  assetSplash: z.string(),
});

export type Hero = z.infer<typeof HeroSchema>;
