import type { Arcana, AvixData, Enchantment, Equipment, Hero, Talent } from "./types.js";

export interface AvixDataSet extends AvixData {
  readonly equipmentById: ReadonlyMap<string, Equipment>;
  readonly heroById: ReadonlyMap<string, Hero>;
  readonly arcanaById: ReadonlyMap<string, Arcana>;
  readonly enchantmentById: ReadonlyMap<string, Enchantment>;
  readonly talentById: ReadonlyMap<string, Talent>;
}

export function createDataSet(data: AvixData): AvixDataSet {
  return {
    ...data,
    equipmentById: new Map(data.equipments.map((item) => [item.equipmentId, item])),
    heroById: new Map(data.heroes.map((hero) => [hero.heroId, hero])),
    arcanaById: new Map(data.arcanas.map((arcana) => [arcana.arcanaId, arcana])),
    enchantmentById: new Map(data.enchantments.map((item) => [item.enchantmentId, item])),
    talentById: new Map(data.talents.map((talent) => [talent.talentId, talent])),
  };
}
