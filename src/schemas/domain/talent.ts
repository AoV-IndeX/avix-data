import { z } from "zod";

export const TalentSchema = z.object({
  talentId: z.string().min(1, "Talent ID must not be empty."),
  number: z.number(),
  cooldown: z.string(),
  nameKey: z.string(),
  descriptionKey: z.string(),
  asset: z.string(),
});

export type Talent = z.infer<typeof TalentSchema>;
