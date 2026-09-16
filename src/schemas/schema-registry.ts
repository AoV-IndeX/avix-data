import type { ZodType } from "zod";
import { ArcanaStatsSchema } from "./domain/arcana-stats.js";
import { ArcanaSchema } from "./domain/arcana.js";
import { EnchantmentSchema } from "./domain/enchantment.js";
import { EquipmentPassiveSchema } from "./domain/equipment-passive.js";
import { EquipmentStatsSchema } from "./domain/equipment-stats.js";
import { EquipmentSchema } from "./domain/equipment.js";
import { HeroSchema } from "./domain/hero.js";
import { TalentSchema } from "./domain/talent.js";

type TableDefinition = {
  schema: ZodType | null;
  target?: string;
};

export const TABLE_DEFINITIONS: Record<string, TableDefinition> = {
  // HERO
  "1_heroes": {
    schema: HeroSchema,
  },
  "2_hero-stats": {
    schema: null,
  },
  "3_hero-stats-growth": {
    schema: null,
  },
  "4_skills": {
    schema: null,
  },
  "5_hero-skills": {
    schema: null,
  },

  // EQUIPMENT
  "1_equipments": {
    schema: EquipmentSchema,
  },
  "2_equipment-stats": {
    schema: EquipmentStatsSchema,
    target: "stats",
  },
  "3_equipment-passives": {
    schema: EquipmentPassiveSchema,
    target: "passives",
  },

  // ARCANA
  "1_arcanas": {
    schema: ArcanaSchema,
  },
  "2_arcana-stats": {
    schema: ArcanaStatsSchema,
    target: "stats",
  },

  // ENCHANTMENT
  "1_enchantments": {
    schema: EnchantmentSchema,
  },

  // TALENT
  "1_talents": {
    schema: TalentSchema,
  },
};
