# AVIX Data Contract

This document describes the public JSON data contract produced by `avix-data`.

It defines the structure consumed by downstream AVIX clients.

## General

* Release data is emitted as JSON under `data/<locale>/`.
* Each locale contains the same domain structure.
* Localized `*Key` fields are resolved into their corresponding fields:

  * `nameKey` → `name`
  * `descriptionKey` → `description`
  * `usageKey` → `usage`
* Missing translations fall back to English.
* Fields with `null` values are omitted from the released JSON.
* Asset fields contain relative paths. The asset base URL is provided separately through `data/config.json`.

## Stats

Stats are represented as a nested `stats` object.

Only stats that have a value are present in the released JSON.

| Field             |  Type  | Description                |
| :---------------- | :----: | :------------------------- |
| attackDamage      | number | Attack damage              |
| abilityPower      | number | Ability power              |
| attackSpeed       | number | Attack speed               |
| criticalRate      | number | Critical rate              |
| criticalDamage    | number | Critical damage            |
| physicalPierce    | number | Flat physical pierce       |
| physicalPiercePct | number | Percentage physical pierce |
| magicPierce       | number | Flat magic pierce          |
| magicPiercePct    | number | Percentage magic pierce    |
| physicalLifesteal | number | Physical lifesteal         |
| magicLifesteal    | number | Magic lifesteal            |
| physicalArmor     | number | Physical armor             |
| magicArmor        | number | Magic armor                |
| maxHp             | number | Maximum HP                 |
| hpRegen           | number | HP regeneration            |
| maxMana           | number | Maximum mana               |
| manaRegen         | number | Mana regeneration          |
| movementSpeed     | number | Movement speed             |
| cooldownReduction | number | Cooldown reduction         |
| resistance        | number | Resistance                 |
| damageDealt       | number | Damage dealt               |
| damageReduction   | number | Damage reduction           |
| healingEfficiency | number | Healing efficiency         |
| slowEfficiency    | number | Slow efficiency            |

## Arcana

| Field    |  Type  | Required | Description                       |
| :------- | :----: | :------: | :-------------------------------- |
| arcanaId | string |  &check; | Stable Arcana identifier          |
| colorId  | string |  &check; | Arcana color: Red / Purple / Teal |
| name     | string |  &check; | Localized name                    |
| asset    | string |          | Asset path                        |
| stats    | object |  &check; | Stat modifiers                    |

### Arcana `stats`

See [Stats](#stats).

## Enchantment

| Field         |  Type  | Required | Description                                  |
| :------------ | :----: | :------: | :------------------------------------------- |
| enchantmentId | string |  &check; | Stable enchantment identifier                |
| categoryId    | string |  &check; | Veda / Lokheim / Afata / League of Humans    |
| level         | number |          | Enchantment level                            |
| number        | number |          | Cardinal number, primarily used for ordering |
| usage         | string |          | Localized usage text                         |
| name          | string |          | Localized name                               |
| description   | string |          | Localized description                        |
| asset         | string |          | Asset path                                   |

## Equipment

| Field       |   Type   | Required | Description                                              |
| :---------- | :------: | :------: | :------------------------------------------------------- |
| equipmentId |  string  |  &check; | Stable equipment identifier                              |
| categoryId  |  string  |  &check; | Attack / Magic / Defense / Movement / Jungling / Support |
| level       |  number  |          | Equipment level                                          |
| number      |  number  |          | Cardinal number, primarily used for ordering             |
| price       |  number  |          | Purchase price                                           |
| isActive    |  boolean |          | Whether the equipment is active                          |
| recipe      | string[] |          | Component equipment identifiers                          |
| name        |  string  |          | Localized name                                           |
| asset       |  string  |          | Asset path                                               |
| stats       |  object  |  &check; | Stat modifiers                                           |
| passives    | object[] |          | Equipment passive effects                                |

### Equipment `stats`

See [Stats](#stats).

### Equipment `passives`

| Field       |  Type  | Required | Description                                      |
| :---------- | :----: | :------: | :----------------------------------------------- |
| passiveId   | string |  &check; | Stable passive identifier                        |
| index       | number |          | Passive ordering                                 |
| name        | string |          | Localized passive name                           |
| description | string |          | Localized passive description                    |
| uniqueGroup | string |          | Identifier for mutually exclusive unique effects |
| cooldown    | number |          | Cooldown, when applicable                        |

An equipment may contain multiple passive records.

## Hero

| Field        |   Type   | Required | Description            |
| :----------- | :------: | :------: | :----------------------|
| heroId       |  string  |  &check; | Stable hero identifier |
| roleId_1     |  string  |  &check; | Primary role           |
| roleId_2     |  string  |          | Secondary role         |
| laneId_1     |  string  |  &check; | First lane*            |
| laneId_2     |  string  |          | Second lane*           |
| laneId_3     |  string  |          | Third lane*            |
| name         |  string  |          | Localized name         |
| assetAvatar  |  string  |          | Avatar asset path      |
| assetSplash  |  string  |          | Splash asset path      |
| stats        |  object  |          | Base hero stats        |
| stats-growth |  object  |          | Per-level stat growth  |
| skills       | object[] |          | Hero skills            |

[!Note]
> (*) Lanes classifications are opinionated. Doesnt' reflect ingame default labels.
> Credits: [AoV Tactics & Guides](https://www.facebook.com/aovtacticsguides)

### Hero `stats`

Base hero statistics.

See [Stats](#stats).

### Hero `stats-growth`

Hero stat growth values use the same field names as `stats`, but represent growth rather than base values.

This is intentionally a separate field because identical stat field names do not imply identical semantics.

### Hero `skills`

Hero skills are associated with their parent hero through the `heroId` relationship.

The exact skill contract is defined by the enabled skill data source.

## Talent

| Field       |  Type  | Required | Description                                  |
| :---------- | :----: | :------: | :------------------------------------------- |
| talentId    | string |  &check; | Stable talent identifier                     |
| number      | number |          | Cardinal number, primarily used for ordering |
| cooldown    | number |          | Cooldown                                     |
| name        | string |          | Localized name                               |
| description | string |          | Localized description                        |
| asset       | string |          | Asset path                                   |

## Localization

Each released locale is emitted under its own directory:

```text
data/
├── en/
├── vi/
├── zh/
└── th/
```

The available release locales are determined by the compiler locale configuration.

For every translated field:

1. The requested locale is used when a translation exists.
2. English is used when the requested locale is missing.
3. The field is omitted only when neither a usable translation nor an English fallback exists.

The source i18n tables are compiler inputs and are not part of the public domain-data contract.

## Source vs. Release Representation

The Google Sheets representation is an internal source format and does not necessarily match the released JSON structure.

For example, stat extension tables store stat fields as flat columns:

```text
equipmentId | attackDamage | abilityPower | ...
```

The compiler assembles these into the public representation:

```json
{
  "equipmentId": "short-sword",
  "stats": {
    "attackDamage": 20
  }
}
```

Similarly, extension and i18n tables are assembled and resolved before release. Consumers should depend only on the released JSON contract, not on the internal workbook structure.

## Versioning

The data contract version follows the `dataVersion` recorded in the root `manifest.yaml`.

Changes that alter the released JSON structure require a new data version.
