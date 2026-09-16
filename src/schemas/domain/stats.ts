import { z } from "zod";

export const StatsSchema = z.object({
  attackDamage: z.number().optional(),
  abilityPower: z.number().optional(),
  attackSpeed: z.number().optional(),
  criticalRate: z.number().optional(),
  criticalDamage: z.number().optional(),

  physicalPierce: z.number().optional(),
  physicalPiercePct: z.number().optional(),
  magicPierce: z.number().optional(),
  magicPiercePct: z.number().optional(),

  physicalLifesteal: z.number().optional(),
  magicLifesteal: z.number().optional(),

  physicalArmor: z.number().optional(),
  magicArmor: z.number().optional(),
  resistance: z.number().optional(),

  maxHp: z.number().optional(),
  hpRegen: z.number().optional(),
  maxMana: z.number().optional(),
  manaRegen: z.number().optional(),

  movementSpeed: z.number().optional(),
  cooldownReduction: z.number().optional(),

  damageDealt: z.number().optional(),
  damageReduction: z.number().optional(),
  healingEfficiency: z.number().optional(),
  slowEfficiency: z.number().optional(),
});
