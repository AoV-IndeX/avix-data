# AVIX Data Contract

This document describes the public JSON data contract produces by `avix-data`

It is intended for downstream consumers to consume the data in a consistent way.

## Arcana

| Field | Type | Required | Description |
| :---- | :---: | :-----: | :---------- |
| arcanaId | string | &check; | |
| colorId | string | &check; | Red / Purple / Teal |
| name | string | &check; | Localized name |
| asset | string | | Asset path |
| attackDamage | number | | |
| abilityPower | number | | |
| attackSpeed | number | | |
| criticalRate | number | | |
| criticalDamage | number | | |
| physicalPierce | number | | |
| physicalPiercePct | number | | |
| magicPierce | number | | |
| magicPiercePct | number | | |
| physicalLifesteal | number | | |
| magicLifesteal | number | | |
| physicalArmor | number | | |
| magicArmor | number | | |
| maxHp | number | | |
| hpRegen | number | | |
| maxMana | number | | |
| manaRegen | number | | |
| movementSpeed | number | | |
| cooldownReduction | number | | |
| resistance | number | | |
| damageDealt | number | | |
| damageReduction | number | | |
| healingEfficiency | number | | |
| slowEfficiency | number | | |

---

## Enchantment

| Field | Type | Required | Description |
| :---- | :---: | :-----: | :---------- |
| enchantmentId | string | &check; | |
| categoryId | string | &check; | Veda / Lokheim / Afata / League of Humans |
| level | number | | 1, 2, 3 |
| number | number | | Cardinal number, mostly used for ordering |
| usage | string | | Typically cooldown, "N/A" if works as a passive, or others |
| name | string | | Localized name |
| description | string | | Localized description |
| asset | string | | Asset path |

---

## Equipment

| Field | Type | Required | Description |
| :---- | :---: | :-----: | :---------- |
| equipmentId | string | &check; | |
| categoryId | string | &check; | Attack / Magic / Defense / Movement / Jungling / Support |
| level | number | | 1, 2, 3 |
| number | number | | Cardinal number, mostly used for ordering |
| name | string | | Localized name |
| asset | string | | Asset path |

---

## Hero

| Field | Type | Required | Description |
| :---- | :---: | :-----: | :---------- |
| heroId | string | &check; | |
| roleId_1 | string | &check; | Warrior / Assassin / Support / Tank / Marksman / Mage |
| roleId_2 | string | | Note: This isn't official system notations, but rather "community" opinionated |
| laneId_1 | string | &check; | Mid / Roam / Slayer / Jungle / Dragon |
| laneId_2 | string | | |
| laneId_3 | string | | |
| name | string | | Localized name |
| assetAvatar | string | | Asset path |
| assetSplash | string | | Asset path |

---

## Talent

| Field | Type | Required | Description |
| :---- | :---: | :-----: | :---------- |
| talentId | string | &check; | |
| number | number | | Cardinal number, mostly used for ordering |
| cooldown | number | | |
| name | string | | Localized name |
| description | string | | Localized description |
| asset | string | | Asset path |
