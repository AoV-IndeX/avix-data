import { z } from "zod";

export const ArcanaSchema = z.object({
  arcanaId: z.string().min(1, "Arcana ID must not be empty."),
  colorId: z.string().min(1, "Color ID must not be empty."),
  nameKey: z.string(),
  asset: z.string(),
});

export type Arcana = z.infer<typeof ArcanaSchema>;
