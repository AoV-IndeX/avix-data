export const STAT_KEYS = [
  "attackDamage",
  "abilityPower",
  "attackSpeed",
  "criticalRate",
  "criticalDamage",
  "physicalPierce",
  "physicalPiercePct",
  "magicPierce",
  "magicPiercePct",
  "physicalLifesteal",
  "magicLifesteal",
  "physicalArmor",
  "magicArmor",
  "maxHp",
  "hpRegen",
  "maxMana",
  "manaRegen",
  "movementSpeed",
  "cooldownReduction",
  "resistance",
  "damageDealt",
  "damageReduction",
  "healingEfficiency",
  "slowEfficiency",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export type Stats = Partial<Record<StatKey, number>>;

export interface Arcana {
  readonly arcanaId: string;
  readonly colorId: string;
  readonly name?: string;
  readonly asset: string;
  readonly stats?: Stats;
}

export interface EquipmentPassive {
  readonly passiveId: string;
  readonly index: number;
  readonly name?: string;
  readonly description?: string;
  readonly uniqueGroup?: string;
  readonly cooldown?: number;
}

export interface Equipment {
  readonly equipmentId: string;
  readonly categoryId: string;
  readonly level: number;
  readonly number: number;
  readonly price: number;
  readonly isActive: boolean;
  readonly recipe?: readonly string[];
  readonly name?: string;
  readonly asset: string;
  readonly stats?: Stats;
  readonly passives?: readonly EquipmentPassive[];
}

export interface Enchantment {
  readonly enchantmentId: string;
  readonly categoryId: string;
  readonly level: number;
  readonly number: number;
  readonly usage?: string;
  readonly name?: string;
  readonly description?: string;
  readonly asset: string;
}

export interface Hero {
  readonly heroId: string;
  readonly roleId_1: string;
  readonly roleId_2?: string;
  readonly laneId_1: string;
  readonly laneId_2?: string;
  readonly laneId_3?: string;
  readonly name?: string;
  readonly assetAvatar: string;
  readonly assetSplash: string;
}

export interface Talent {
  readonly talentId: string;
  readonly number: number;
  readonly cooldown: string;
  readonly name?: string;
  readonly description?: string;
  readonly asset: string;
}

export interface AvixData {
  readonly arcanas: readonly Arcana[];
  readonly equipments: readonly Equipment[];
  readonly enchantments: readonly Enchantment[];
  readonly heroes: readonly Hero[];
  readonly talents: readonly Talent[];
}
