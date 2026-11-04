/**
 * A PHP rendelési végpont (server/php/api/rendeles.php) árazási adatai — a
 * központi TS-forrásból (catalog.ts, freight.ts, site.ts) generálva, hogy a
 * szerveroldali újraszámolás ugyanazokból az árakból dolgozzon.
 *
 * Futtatás:  node --experimental-strip-types scripts/build-order-data.mjs
 * Ellenőrzés: ... scripts/build-order-data.mjs --check  (eltérésnél exit 1)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { allMaterials, itemWash, PRICING_VERSION } from "../src/content/catalog.ts";
import {
  bandLabel,
  CASTLE_DISTRICT_ID,
  CASTLE_QUESTION,
  FREIGHT_VAT_RATE,
  freightProfiles,
  MIN_ORDER_M3,
  municipalities,
  PERMIT_NOTICE,
  ROMAN,
  SINGLE_TRIP_MAX_M3,
  UNSUPPORTED_NOTICE,
} from "../src/content/freight.ts";
import { ORDER_INTENT_NOTICE } from "../src/content/site.ts";

// PHP-fájlként (nem .json), hogy a díjtábla ne legyen közvetlenül letölthető
// szövegként a webtárhelyről (ügyfél, 2026-11-02: nincs nyilvános díjtábla).
const OUT = resolve("server/php/api/rendeles-adatok.php");

const data = {
  _figyelem: "GENERÁLT FÁJL — ne szerkeszd kézzel. Forrás: src/content/*.ts, generátor: scripts/build-order-data.mjs",
  pricingVersion: PRICING_VERSION,
  vatRate: FREIGHT_VAT_RATE,
  minM3: MIN_ORDER_M3,
  maxM3: SINGLE_TRIP_MAX_M3,
  castleDistrictId: CASTLE_DISTRICT_ID,
  roman: ROMAN,
  municipalities: municipalities.map((m) => ({ id: m.id, name: m.name, requiresDistrict: m.requiresDistrict })),
  materials: Object.fromEntries(
    allMaterials.map((m) => [
      m.slug,
      {
        name: `${m.groupName} — ${m.name}${m.fraction ? ` (${m.fraction})` : ""}`,
        priceGross: m.priceGross,
        wash: itemWash(m)?.label ?? null,
        unclassified: m.unclassified === true,
      },
    ]),
  ),
  profiles: freightProfiles.map((p) => ({
    id: p.id,
    label: p.label,
    municipalityId: p.municipalityId,
    districtId: p.districtId ?? null,
    postalCodes: [...p.postalCodes],
    bands: p.bands.map((b) => ({ upTo: b.upTo, netFee: b.netFee, label: bandLabel(p, b) })),
  })),
  texts: {
    orderIntent: ORDER_INTENT_NOTICE,
    permit: PERMIT_NOTICE,
    unsupported: UNSUPPORTED_NOTICE,
    castleQuestion: CASTLE_QUESTION,
  },
};

const encoded = JSON.stringify(data);
if (encoded.includes("ADATOK_VEGE")) throw new Error("A nowdoc-lezáró a tartalomban szerepel");
const json = `<?php\n// GENERÁLT FÁJL — ne szerkeszd kézzel (scripts/build-order-data.mjs).\nif (!defined('SODERARAK_RENDELES')) { http_response_code(404); exit; }\nreturn json_decode(<<<'ADATOK_VEGE'\n${encoded}\nADATOK_VEGE, true, 32, JSON_THROW_ON_ERROR);\n`;
if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(OUT, "utf8");
  } catch {
    /* hiányzik */
  }
  if (current !== json) {
    console.error("server/php/api/rendeles-adatok.php elavult — futtasd: node --experimental-strip-types scripts/build-order-data.mjs");
    process.exit(1);
  }
  console.log("rendeles-adatok.php naprakész ✓");
} else {
  writeFileSync(OUT, json);
  console.log(`rendeles-adatok.php frissítve (${allMaterials.length} anyag, ${freightProfiles.length} díjprofil)`);
}
