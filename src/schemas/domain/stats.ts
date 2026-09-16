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

export const StatsFieldsSchema = z.object({
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
  resistance: z.number().nullable(),

  maxHp: z.number().nullable(),
  hpRegen: z.number().nullable(),
  maxMana: z.number().nullable(),
  manaRegen: z.number().nullable(),

  movementSpeed: z.number().nullable(),
  cooldownReduction: z.number().nullable(),

  damageDealt: z.number().nullable(),
  damageReduction: z.number().nullable(),
  healingEfficiency: z.number().nullable(),
  slowEfficiency: z.number().nullable(),
});
