import { readFileSync, writeFileSync } from "node:fs";

const prototype = readFileSync(new URL("../freebase.html", import.meta.url), "utf8");
const catalog = /^const DATA = (\[.*\]);\r?$/m.exec(prototype);

if (!catalog) {
  throw new Error("Could not find the catalog in freebase.html");
}

const resources = JSON.parse(catalog[1]);
const output = resources.map((resource) => `  ${JSON.stringify(resource)}`).join(",\n");
writeFileSync(new URL("../data/legacy.json", import.meta.url), `[\n${output}\n]\n`);
console.log(`Extracted ${resources.length} prototype listings.`);
