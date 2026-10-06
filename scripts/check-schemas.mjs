import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data");
const SCHEMA_DIR = path.join(DATA_DIR, "schema");

const SCHEMA_FILES = [
  "stats.schema.json",
  "arcanas.schema.json",
  "equipments.schema.json",
  "enchantments.schema.json",
  "talents.schema.json",
  "heroes.schema.json",
];

const ajv = new Ajv({
  allErrors: true,
  strict: true,
});

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function main() {
  const schemas = new Map();

  for (const filename of SCHEMA_FILES) {
    const schema = await readJson(path.join(SCHEMA_DIR, filename));

    // Use the filename as the local schema identifier so relative
    // references such as "./stats.schema.json" resolve correctly.
    ajv.addSchema(schema, filename);
    schemas.set(filename, schema);
  }

  const locales = (await readdir(DATA_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .filter((entry) => path.join(DATA_DIR, entry.name) !== SCHEMA_DIR)
    .map((entry) => entry.name);

  if (locales.length === 0) {
    throw new Error("No locale directories found under data/.");
  }

  let checked = 0;

  for (const locale of locales) {
    const localeDir = path.join(DATA_DIR, locale);
    const files = await readdir(localeDir);

    for (const filename of files) {
      if (!filename.endsWith(".json")) {
        continue;
      }

      const schemaFilename = `${filename.replace(/\.json$/, "")}.schema.json`;
      const schema = schemas.get(schemaFilename);

      if (!schema) {
        throw new Error(
          `No schema found for ${path.relative(ROOT, path.join(localeDir, filename))}.`,
        );
      }

      const data = await readJson(path.join(localeDir, filename));
      const validate = ajv.getSchema(schemaFilename);

      if (!validate) {
        throw new Error(`Could not compile schema "${schemaFilename}".`);
      }

      if (!validate(data)) {
        console.error(validate.errors);
        throw new Error(`Schema validation failed for ${locale}/${filename}.`);
      }

      checked += 1;
      console.log(`  ✓ ${locale}/${filename}`);
    }
  }

  console.log(`\nValidated ${checked} JSON artifact(s).`);
}

await main();
