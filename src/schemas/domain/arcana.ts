import { z } from "zod";

export const ArcanaSchema = z.object({
  arcanaId: z.string().min(1, "Arcana ID must not be empty."),
  colorId: z.string().min(1, "Color ID must not be empty."),
  abilityPower: z.number().nullable(),
  attackDamage: z.number().nullable(),
  armorPierce: z.number().nullable(),
  criticalRate: z.number().nullable(),
  criticalDamage: z.number().nullable(),
  magicPierce: z.number().nullable(),
  maxHp: z.number().nullable(),
  armor: z.number().nullable(),
  magicArmor: z.number().nullable(),
  lifesteal: z.number().nullable(),
  magicLifesteal: z.number().nullable(),
  attackSpeed: z.number().nullable(),
  movementSpeed: z.number().nullable(),
  cooldownReduction: z.number().nullable(),
  heal: z.number().nullable(),
  asset: z.string(),
});

export type Arcana = z.infer<typeof ArcanaSchema>;
