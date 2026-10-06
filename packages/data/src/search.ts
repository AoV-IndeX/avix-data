import type { Arcana, AvixData, Enchantment, Equipment, Hero, Talent } from "./types.js";

export interface SearchOptions {
  readonly limit?: number;
}

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .trim();
}

function matches(query: string, ...values: readonly (string | undefined)[]): boolean {
  const normalizedQuery = normalize(query);

  return values.some((value) => value !== undefined && normalize(value).includes(normalizedQuery));
}

function limitResults<T>(items: readonly T[], limit?: number): readonly T[] {
  return limit === undefined ? items : items.slice(0, limit);
}

export function searchEquipment(
  data: AvixData,
  query: string,
  options: SearchOptions = {},
): readonly Equipment[] {
  return limitResults(
    data.equipments.filter((equipment) => matches(query, equipment.equipmentId, equipment.name)),
    options.limit,
  );
}

export function searchHeroes(
  data: AvixData,
  query: string,
  options: SearchOptions = {},
): readonly Hero[] {
  return limitResults(
    data.heroes.filter((hero) =>
      matches(
        query,
        hero.heroId,
        hero.name,
        hero.roleId_1,
        hero.roleId_2,
        hero.laneId_1,
        hero.laneId_2,
        hero.laneId_3,
      ),
    ),
    options.limit,
  );
}

export function searchArcanas(
  data: AvixData,
  query: string,
  options: SearchOptions = {},
): readonly Arcana[] {
  return limitResults(
    data.arcanas.filter((arcana) => matches(query, arcana.arcanaId, arcana.name, arcana.colorId)),
    options.limit,
  );
}

export function searchEnchantments(
  data: AvixData,
  query: string,
  options: SearchOptions = {},
): readonly Enchantment[] {
  return limitResults(
    data.enchantments.filter((enchantment) =>
      matches(query, enchantment.enchantmentId, enchantment.name, enchantment.categoryId),
    ),
    options.limit,
  );
}

export function searchTalents(
  data: AvixData,
  query: string,
  options: SearchOptions = {},
): readonly Talent[] {
  return limitResults(
    data.talents.filter((talent) => matches(query, talent.talentId, talent.name)),
    options.limit,
  );
}

export function findEquipment(data: AvixData, equipmentId: string): Equipment | undefined {
  return data.equipments.find((equipment) => equipment.equipmentId === equipmentId);
}

export function findHero(data: AvixData, heroId: string): Hero | undefined {
  return data.heroes.find((hero) => hero.heroId === heroId);
}

export function findArcana(data: AvixData, arcanaId: string): Arcana | undefined {
  return data.arcanas.find((arcana) => arcana.arcanaId === arcanaId);
}

export function findEnchantment(data: AvixData, enchantmentId: string): Enchantment | undefined {
  return data.enchantments.find((enchantment) => enchantment.enchantmentId === enchantmentId);
}

export function findTalent(data: AvixData, talentId: string): Talent | undefined {
  return data.talents.find((talent) => talent.talentId === talentId);
}
