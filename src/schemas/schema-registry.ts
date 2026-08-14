import { ArcanaSchema } from "./domain/arcana.js";
import { EnchantmentSchema } from "./domain/enchantment.js";
import { EquipmentSchema } from "./domain/equipment.js";
import { HeroSchema } from "./domain/hero.js";
import { TalentSchema } from "./domain/talent.js";

export const TABLE_SCHEMAS = {
  "1_heroes": HeroSchema,
  "1_equipments": EquipmentSchema,
  "1_arcanas-stats": ArcanaSchema,
  "1_enchantments-desc": EnchantmentSchema,
  "1_talent-desc": TalentSchema,
} as const;
