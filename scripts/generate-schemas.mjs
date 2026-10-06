import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(ROOT, "data", "data-contract.md");
const SCHEMA_DIR = path.join(ROOT, "data", "schema");

const ENTITIES = [
  { heading: "Arcana", file: "arcanas.schema.json" },
  { heading: "Enchantment", file: "enchantments.schema.json" },
  { heading: "Equipment", file: "equipments.schema.json" },
  { heading: "Hero", file: "heroes.schema.json" },
  { heading: "Talent", file: "talents.schema.json" },
];

const SHARED_TYPES = {
  Stats: {
    heading: "Stats",
    file: "stats.schema.json",
  },
};

function normalizeCell(cell) {
  return cell.trim().replace(/^`|`$/g, "");
}

function parseTables(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = new Map();

  let currentHeading = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      currentHeading = heading[2].trim();
      continue;
    }

    if (!currentHeading || !line.startsWith("|")) {
      continue;
    }

    const headerCells = line.split("|").slice(1, -1).map(normalizeCell);

    const separator = lines[index + 1];
    if (!separator?.startsWith("|")) {
      continue;
    }

    const rows = [];
    let rowIndex = index + 2;

    while (rowIndex < lines.length && lines[rowIndex].startsWith("|")) {
      const cells = lines[rowIndex].split("|").slice(1, -1).map(normalizeCell);

      if (cells.length !== headerCells.length) {
        throw new Error(`Malformed table under "${currentHeading}" at line ${rowIndex + 1}.`);
      }

      rows.push(Object.fromEntries(headerCells.map((key, i) => [key, cells[i]])));
      rowIndex += 1;
    }

    sections.set(currentHeading, rows);
    index = rowIndex - 1;
  }

  return sections;
}

function schemaType(type, context) {
  const arrayMatch = type.match(/^(.+)\[\]$/);

  if (arrayMatch) {
    return {
      type: "array",
      items: schemaType(arrayMatch[1], context),
    };
  }

  switch (type) {
    case "string":
      return { type: "string" };

    case "number":
      return { type: "number" };

    case "boolean":
      return { type: "boolean" };

    case "Stats":
      return { $ref: "./stats.schema.json" };

    case "EquipmentPassive":
      return { $ref: "#/$defs/EquipmentPassive" };

    default:
      throw new Error(`Unknown contract type "${type}" in ${context}.`);
  }
}

function parseRequired(row) {
  const value = row.Guaranteed ?? "";

  return value === "✓" || value.toLowerCase() === "yes";
}

function tableToProperties(rows, context) {
  const properties = {};
  const required = [];

  for (const row of rows) {
    const field = row.Field;
    const type = row.Type;
    const description = row.Description ?? "";

    if (!field || !type) {
      throw new Error(`Invalid contract row in ${context}.`);
    }

    properties[field] = {
      ...schemaType(type, `${context}.${field}`),
      ...(description ? { description } : {}),
    };

    if (parseRequired(row)) {
      required.push(field);
    }
  }

  return {
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

function buildObjectSchema(title, rows, extra = {}) {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title,
    type: "object",
    ...tableToProperties(rows, title),
    additionalProperties: false,
    ...extra,
  };
}

function buildCollectionSchema(title, rows, extra = {}) {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: `${title}List`,
    type: "array",
    items: buildObjectSchema(title, rows),
    ...extra,
  };
}

async function main() {
  const markdown = await readFile(CONTRACT_PATH, "utf8");
  const sections = parseTables(markdown);

  await mkdir(SCHEMA_DIR, { recursive: true });

  const statsRows = sections.get("Stats");

  if (!statsRows) {
    throw new Error('Missing "Stats" contract table.');
  }

  await writeSchema("stats.schema.json", buildObjectSchema("Stats", statsRows));

  const passiveRows = sections.get("Equipment `passives`");

  if (!passiveRows) {
    throw new Error('Missing "Equipment `passives`" contract table.');
  }

  const passiveDefinition = {
    type: "object",
    ...tableToProperties(passiveRows, "EquipmentPassive"),
    additionalProperties: false,
  };

  for (const entity of ENTITIES) {
    const rows = sections.get(entity.heading);

    if (!rows) {
      const available = [...sections.keys()].join(", ");
      throw new Error(`Missing "${entity.heading}" contract table. Parsed headings: ${available}`);
    }

    const extra =
      entity.heading === "Equipment"
        ? {
          $defs: {
            EquipmentPassive: passiveDefinition,
          },
        }
        : {};

    await writeSchema(entity.file, buildCollectionSchema(entity.heading, rows, extra));
  }

  console.log("Generated JSON Schemas from data/data-contract.md.");
}

async function writeSchema(file, schema) {
  const outputPath = path.join(SCHEMA_DIR, file);

  await writeFile(outputPath, `${JSON.stringify(schema, null, 2)}\n`, "utf8");

  console.log(`  ✓ ${path.relative(ROOT, outputPath)}`);
}

await main();
