import { readFile, writeFile } from "node:fs/promises";

const versionArg = process.argv[2];

if (versionArg === undefined || process.argv.length !== 3) {
  console.error("Usage: pnpm prepare-release <version>");
  console.error("Example: pnpm prepare-release 0.2.2");
  process.exit(1);
}

const version = versionArg.replace(/^v/, "");

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Invalid version: ${versionArg}`);
  console.error("Expected a version like 0.2.2");
  process.exit(1);
}

const manifestPath = new URL("../manifest.yaml", import.meta.url);
const manifest = await readFile(manifestPath, "utf8");

const updated = manifest
  .replace(/^dataVersion:\s*.+$/m, `dataVersion: ${version}`)
  .replace(/^(\s*generatedAt:\s*).+$/m, `$1${new Date().toISOString()}`);

if (updated === manifest) {
  console.error("Could not update manifest.yaml.");
  console.error("Expected dataVersion and release.generatedAt fields.");
  process.exit(1);
}

await writeFile(manifestPath, updated);

console.log(`Prepared release v${version}`);
console.log(`Updated ${manifestPath.pathname.split("/").pop()}`);
