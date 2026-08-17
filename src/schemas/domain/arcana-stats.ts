import { z } from "zod";

export const ArcanaStatsSchema = z.object({
  arcanaId: z.string().min(1, "Arcana ID must not be empty."),
  attackDamage: z.number().nullable(),
  abilityPower: z.number().nullable(),
  attackSpeed: z.number().nullable(),
  criticalRate: z.number().nullable(),
  criticalDamage: z.number().nullable(),
  physicalPierce: z.number().nullable(),
  physicalPiercePct: z.number().nullable(),
  magicPierce: z.number().nullable(),
  magicPiercePct: z.number().nullable(),
  physicalLifesteal: z.number().nullable(),
  magicLifesteal: z.number().nullable(),
  physicalArmor: z.number().nullable(),
  magicArmor: z.number().nullable(),
  maxHp: z.number().nullable(),
  hpRegen: z.number().nullable(),
  maxMana: z.number().nullable(),
  manaRegen: z.number().nullable(),
  movementSpeed: z.number().nullable(),
  cooldownReduction: z.number().nullable(),
  resistance: z.number().nullable(),
  damageDealt: z.number().nullable(),
  damageReduction: z.number().nullable(),
  healingEfficiency: z.number().nullable(),
  slowEfficiency: z.number().nullable(),
});

export type ArcanaStats = z.infer<typeof ArcanaStatsSchema>;
