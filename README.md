# AVIX Data

Structured data source for [AVIX](https://github.com/AoV-IndeX/avix), compiled from Google Sheets into validated JSON.

> Google Sheets → TSV → TypeScript compiler → JSON

---

## Data

Compiled data is available under [`data/`](./data/).

Each file contains validated domain data. Clients can consume these JSON files directly.

Asset fields contain relative paths, while [`data/config.json`](./data/config.json) provides the asset base URL:

```json
{
  "assetBaseUrl": "..."
}
```

Clients can resolve an asset path against this base URL.

Assets are maintained separately in [`avix-assets`](https://github.com/AoV-IndeX/avix-assets).

---

## Sources

The canonical editable source is maintained in Google Sheets.

Each workbook contains an `__index` tab describing the available tables:

| key            | gid | headers       | enabled |
| -------------- | --- | ------------- | ------- |
| `1_heroes`     | ... | `heroId\|...` | `TRUE`  |
| `2_hero-stats` | ... | `heroId`      | `FALSE` |

The `enabled` field acts as the production-readiness flag.
This allows tables to be documented before their schemas and data are ready for production.

---

## Compiler

The compiler is a custom TypeScript pipeline designed specifically for this data source.

> Sheets -> Fetch -> Parse -> Normalize -> Zod validation -> JSON

Zod schemas define the expected structure and types of compiled records.

An enabled table must have a corresponding schema.

---

## Development

Requirements: Node.js 26+, pnpm

Create a `.env` file containing the published workbook URLs:

```env
HERO_WORKBOOK_URL=
EQUIPMENT_WORKBOOK_URL=
ARCANA_WORKBOOK_URL=
ENCHANTMENT_WORKBOOK_URL=
TALENT_WORKBOOK_URL=
```

See [`.env.example`](./.env.example) for the required variables.

---

## License

This repository contains seprate categories of material:

- Source code - licensed under [LICENSE](./LICENSE)
- Game assets - maintained in [avix-assets](https://github.com/AoV-IndeX/avix-assets) and subject to their own terms.

The data consists primarily of structured facts, identifiers, statistics, classifications, and descriptions compiled from the project's sources.

Third-party intellectual property remains with its respective rights holders.
