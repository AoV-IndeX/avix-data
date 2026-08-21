import type { ZodType } from "zod";
import { ArcanaSchema } from "./domain/arcana.js";
import { ArcanaStatsSchema } from "./domain/arcana-stats.js";
import { EnchantmentSchema } from "./domain/enchantment.js";
import { EquipmentSchema } from "./domain/equipment.js";
import { HeroSchema } from "./domain/hero.js";
import { TalentSchema } from "./domain/talent.js";
import { TranslationRowSchema } from "./i18n/translation.js";

export const TABLE_SCHEMAS: Record<string, ZodType | null> = {
  "1_heroes": HeroSchema,
  "2_hero-stats": null,
  "3_hero-stats-growth": null,
  "4_skills": null,
  "5_hero-skills": null,

  "1_equipments": EquipmentSchema,
  "2_equipment-stats": null,
  "3_equipment-passives": null,

  "1_arcanas": ArcanaSchema,
  "2_arcana-stats": ArcanaStatsSchema,

  "1_enchantments": EnchantmentSchema,

  "1_talents": TalentSchema,

  "11_i18n-heroes": TranslationRowSchema,
  "21_i18n-equipments": TranslationRowSchema,
  "31_i18n-arcanas": TranslationRowSchema,
  "41_i18n-enchantments": TranslationRowSchema,
  "51_i18n-talents": TranslationRowSchema,
};
