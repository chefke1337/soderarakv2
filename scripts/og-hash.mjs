/**
 * OG-vizuális regressziós védelem — minden exportált közösségi kártyát
 * sha256-dal hashel, és elbukik, ha egy kártya váratlanul megváltozik.
 *
 * Futtatás:
 *   node scripts/og-hash.mjs            → ellenőrzés a scripts/og-baseline.json alapján
 *   node scripts/og-hash.mjs --update   → a mostani képek lesznek az új bázis
 *
 * A build (`npm run build`) automatikusan lefuttatja az ellenőrzést. Ha egy
 * kártya szándékosan változott, nézd át a galériában (npm run og:gallery),
 * majd fogadd el az új bázist: `npm run og:hash:update`.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const OUT = join(process.cwd(), "out");
const BASELINE = join(process.cwd(), "scripts", "og-baseline.json");
const UPDATE = process.argv.includes("--update");

const pngFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry === "opengraph-image.png") pngFiles.push(full);
  }
})(OUT);

if (pngFiles.length === 0) {
  console.error("Nincs egyetlen opengraph-image.png sem az out/ alatt — előbb futtasd: npm run build");
  process.exit(1);
}

const routeOf = (file) => {
  const rel = relative(OUT, file).split("\\").join("/");
  const route = rel.replace(/\/?opengraph-image\.png$/, "");
  return route === "" ? "/" : `/${route}/`;
};

pngFiles.sort();
const hashes = {};
for (const file of pngFiles) {
  hashes[routeOf(file)] = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 16);
}

const writeBaseline = () => {
  writeFileSync(BASELINE, `${JSON.stringify({ images: hashes }, null, 2)}\n`);
};

if (UPDATE) {
  writeBaseline();
  console.log(`OG-bázis frissítve: ${pngFiles.length} kártya hash-e mentve a scripts/og-baseline.json fájlba.`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  writeBaseline();
  console.log(`OG-regressziós bázis létrehozva: ${pngFiles.length} kártya hash-e mentve a scripts/og-baseline.json fájlba.`);
  console.log("A továbbiakban minden build ellenőrzi a kártyákat. Szándékos vizuális változtatás után: npm run og:hash:update");
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE, "utf8")).images ?? {};
const changed = [];
const added = [];
const removed = [];
for (const [route, hash] of Object.entries(hashes)) {
  if (!(route in baseline)) added.push(route);
  else if (baseline[route] !== hash) changed.push(route);
}
for (const route of Object.keys(baseline)) {
  if (!(route in hashes)) removed.push(route);
}

if (changed.length > 0 || added.length > 0 || removed.length > 0) {
  console.error("OG-vizuális regresszió: a kártyák eltérnek a rögzített bázistól.");
  for (const route of changed) console.error(`  MÓDOSULT   ${route}`);
  for (const route of added) console.error(`  ÚJ         ${route}`);
  for (const route of removed) console.error(`  ELTŰNT     ${route}`);
  console.error("Ha a változás szándékos: npm run og:hash:update (utána nézd át: npm run og:gallery)");
  process.exit(1);
}

console.log(`OG-regresszió: ${pngFiles.length} kártya hash-e egyezik a bázissal ✓`);
