# @avix/data

Typed domain utilities for AVIX data.

The package provides convenient access and algorithms for working with AVIX's
consumer-facing data model.

## Data

The canonical AVIX data artifacts are distributed separately as JSON.

This package does not redefine the data contract.

See the AVIX data release for:

- JSON data
- JSON Schemas
- localization
- release metadata

## Usage

```ts
import {
  createDataSet,
  searchEquipment,
  getEquipmentRecipeTree,
} from "@avix/data";

const data = createDataSet({
  heroes,
  equipments,
  arcanas,
  enchantments,
  talents,
});

const results = searchEquipment(data, "spear");

const recipe = getEquipmentRecipeTree(
  data.equipments,
  "longinus-spear",
);
