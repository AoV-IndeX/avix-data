# AVIX Data Contract

This document defines the **consumer-facing JSON contract** produced by `avix-data`.

It describes the structure and semantics of released data. It does **not** describe the Google Sheets source format or the compiler's internal schemas.

## Release structure

Released data is organized by locale:

```text
data/
├── config.json
├── data-contract.md
├── schema/
│   ├── stats.schema.json
│   ├── arcanas.schema.json
│   ├── equipments.schema.json
│   ├── enchantments.schema.json
│   └── talents.schema.json
├── en/
│   ├── arcanas.json
│   ├── equipments.json
│   ├── enchantments.json
│   ├── heroes.json
│   └── talents.json
└── vi/
    └── ...
```

The exact locale set is determined by the compiler configuration.

Each locale contains the same domain structure. Localized text is resolved independently for each locale.

## General rules

### Null and missing values

Properties whose final value is `null` are omitted from released JSON.

Optional properties may therefore be absent rather than explicitly set to null.

Consumers should not assume that an optional property exists.

### Localization

Source localization keys are resolved before release.

For example:

```text
nameKey        → name
descriptionKey → description
usageKey       → usage
```

For each localized field:

1. The requested locale is used when a translation exists.
2. English is used as a fallback.
3. The field is omitted when neither the requested locale nor English provides a usable value.

The source i18n tables are compiler inputs and are not part of the public domain-data contract.

### Assets

Asset fields contain paths relative to the AVIX asset base URL.

The asset base URL is provided by `data/config.json`:

```json
{
  "assetBaseUrl": "..."
}
```

For example:

```text
equipments/A101_SS_Short-Sword.webp
```

can be resolved against the configured asset base URL.

### Guaranteed fields

The `Guaranteed` column describes the released JSON representation.

A `✓` means:

> The property is guaranteed to be present in every released record of this type.

An empty value means:

> The property may be omitted.

This is intentionally different from the internal compiler/source schema. A source field may be required while the corresponding released property remains optional because of localization, null omission, or compilation.

## Stats

`Stats` is a reusable object containing zero or more stat modifiers.

Every stat property is optional.

| Field             |  Type  | Guaranteed | Description                |
| :---------------- | :----: | :--------: | :------------------------- |
| attackDamage      | number |            | Attack damage              |
| abilityPower      | number |            | Ability power              |
| attackSpeed       | number |            | Attack speed               |
| criticalRate      | number |            | Critical rate              |
| criticalDamage    | number |            | Critical damage            |
| physicalPierce    | number |            | Flat physical pierce       |
| physicalPiercePct | number |            | Percentage physical pierce |
| magicPierce       | number |            | Flat magic pierce          |
| magicPiercePct    | number |            | Percentage magic pierce    |
| physicalLifesteal | number |            | Physical lifesteal         |
| magicLifesteal    | number |            | Magic lifesteal            |
| physicalArmor     | number |            | Physical armor             |
| magicArmor        | number |            | Magic armor                |
| maxHp             | number |            | Maximum HP                 |
| hpRegen           | number |            | HP regeneration            |
| maxMana           | number |            | Maximum mana               |
| manaRegen         | number |            | Mana regeneration          |
| movementSpeed     | number |            | Movement speed             |
| cooldownReduction | number |            | Cooldown reduction         |
| resistance        | number |            | Resistance                 |
| damageDealt       | number |            | Damage dealt               |
| damageReduction   | number |            | Damage reduction           |
| healingEfficiency | number |            | Healing efficiency         |
| slowEfficiency    | number |            | Slow efficiency            |

An empty `stats` object is valid.

## Arcana

Release as `arcanas.json`.

| Field    |  Type  | Guaranteed | Description              |
| :------- | :----: | :--------: | :----------------------- |
| arcanaId | string |      ✓     | Stable Arcana identifier |
| colorId  | string |      ✓     | Arcana color             |
| name     | string |            | Localized name           |
| asset    | string |            | Asset path               |
| stats    |  Stats |            | Stat modifiers           |

## Enchantment

Release as `enchantments.json`.

| Field         |  Type  | Guaranteed | Description                       |
| :------------ | :----: | :--------: | :-------------------------------- |
| enchantmentId | string |      ✓     | Stable enchantment identifier     |
| categoryId    | string |      ✓     | Enchantment category              |
| level         | number |      ✓     | Enchantment level                 |
| number        | number |      ✓     | Cardinal number used for ordering |
| usage         | string |            | Localized usage text              |
| name          | string |            | Localized name                    |
| description   | string |            | Localized description             |
| asset         | string |            | Asset path                        |

## Equipment

Release as `equipments.json`.

| Field       |        Type        | Guaranteed | Description                                                  |
| :---------- | :----------------: | :--------: | :----------------------------------------------------------- |
| equipmentId |       string       |      ✓     | Stable equipment identifier                                  |
| categoryId  |       string       |      ✓     | Equipment category                                           |
| level       |       number       |      ✓     | Equipment tier/level                                         |
| number      |       number       |      ✓     | Cardinal number used for ordering within the source category |
| price       |       number       |      ✓     | Purchase price                                               |
| isActive    |       boolean      |      ✓     | Whether the equipment has an active ability                  |
| recipe      |      string[]      |            | Component equipment identifiers                              |
| name        |       string       |            | Localized name                                               |
| asset       |       string       |            | Asset path                                                   |
| stats       |        Stats       |            | Stat modifiers                                               |
| passives    | EquipmentPassive[] |            | Passive effects                                              |

An equipment may have no recipe.

An equipment may have no stat modifiers, in which case stats may be omitted or may contain an empty object depending on the compiled record.

An equipment may contain multiple passive records.

## Equipment `passives`

| Field       |  Type  | Guaranteed | Description                                      |
| :---------- | :----: | :--------: | :----------------------------------------------- |
| passiveId   | string |      ✓     | Stable passive identifier                        |
| index       | number |      ✓     | Passive ordering within the equipment            |
| name        | string |            | Localized passive name                           |
| description | string |            | Localized passive description                    |
| uniqueGroup | string |            | Identifier for mutually exclusive unique effects |
| cooldown    | number |            | Cooldown, when applicable                        |

`equipmentId` is intentionally not included in the released passive object because the passive is already nested under its equipment.

## Hero

Release as `heroes.json`.

| Field       |  Type  | Guaranteed | Description            |
| :---------- | :----: | :--------: | :--------------------- |
| heroId      | string |      ✓     | Stable hero identifier |
| roleId_1    | string |      ✓     | Primary role           |
| roleId_2    | string |            | Secondary role         |
| laneId_1    | string |      ✓     | Primary lane           |
| laneId_2    | string |            | Secondary lane         |
| laneId_3    | string |            | Third lane             |
| name        | string |            | Localized name         |
| assetAvatar | string |            | Avatar asset path      |
| assetSplash | string |            | Splash asset path      |

Lane classifications are opinionated and do not necessarily reflect in-game default labels.

Credits: [AoV Tactics & Guides](https://www.facebook.com/aovtacticsguides)

## Talent

Release as `talents.json`.

| Field       |  Type  | Guaranteed | Description                       |
| :---------- | :----: | :--------: | :-------------------------------- |
| talentId    | string |      ✓     | Stable talent identifier          |
| number      | number |      ✓     | Cardinal number used for ordering |
| cooldown    | string |      ✓     | Display cooldown text             |
| name        | string |            | Localized name                    |
| description | string |            | Localized description             |
| asset       | string |            | Asset path                        |

`cooldown` is intentionally represented as a string because released data contains display values such as "120s".

## Source vs. release representation

The Google Sheets representation is an internal source format.

It is **not** the public data contract.

For example, source equipment stats are represented using extension-table columns:

```text
equipmentId | attackDamage | abilityPower | ...
```

The compiler assembles those values into:

```json
{
  "equipmentId": "short-sword",
  "stats": {
    "attackDamage": 20
  }
}
```

Likewise, source localization keys are resolved before release.

Consumers should depend only on the released JSON representation and its schema.

## JSON Schema

Machine-readable JSON Schemas are generated from this document.

They are located under:

```text
data/schema/
```

The schemas describe the released representation rather than the compiler's internal Zod schemas.

They are checked against the actual released JSON artifacts during development and CI.

## Versioning

The data contract version follows `dataVersion` in `manifest.yaml`.

Changes that alter the released JSON structure require a new data version.

Adding or changing compiler-internal source fields does not constitute a public contract change unless it changes released JSON.
