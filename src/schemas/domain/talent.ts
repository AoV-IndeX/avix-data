import { z } from "zod";

export const TalentSchema = z.object({
  talentId: z.string().min(1, "Talent ID must not be empty."),
  number: z.number(),
  name: z.string(),
  cooldown: z.string(),
  description: z.string(),
  asset: z.string(),
});

export type Talent = z.infer<typeof TalentSchema>;
