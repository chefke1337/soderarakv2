/**
 * V3 ÁRAZÁS — anyagkatalógus és bruttó árazás.
 *
 * Ellenőrzi: minden új termék ára, kategóriánkénti induló ár, bruttó anyag
 * részösszeg, a Bazalt kategória megszűnése, a mosott-jelölés helyes
 * kiterjedése, és hogy nincs dupla ÁFA a bruttó anyagáron.
 *
 * Futtatás: npm run test:pricing
 */
import {
  allMaterials,
  findMaterial,
  findMaterialGroup,
  groupStartingPrice,
  LEGACY_GROUP_SLUGS,
  materialGroups,
  PRICING_VERSION,
  resolveItemSlug,
} from "../src/content/catalog.ts";
import { computeQuote } from "../src/lib/quote.ts";
import { check, eq, deepEq, section, finish } from "./_harness.mjs";

/* ─────────────── 1. A jóváhagyott árlista, tételenként ─────────────── */
section("Minden termék bruttó ára (Ft/m³)");

const EXPECTED_PRICES = {
  // Sóder
  "tolto-soder": 10500,
  "soder-0-4": 11500,
  "soder-0-8": 14000,
  "soder-0-16": 14000,
  "soder-0-24": 13500,
  // Homok
  banyahomok: 9500,
  "homok-0-1": 9500,
  // Kavics
  kule: 9500,
  "gyongykavics-4-8": 15000,
  "kavics-8-16": 15000,
  "kavics-16-32": 14500,
  "kavics-24-40": 14500,
  // Murva
  "murva-0-5": 17000,
  "murva-0-22": 14000,
  "murva-2-5": 19000,
  "murva-4-11": 17000,
  "murva-11-22": 17000,
  "murva-20-55": 15000,
  // Andezit (Nógrádkövesdi)
  "andezit-2-5": 27000,
  "andezit-4-11": 19000,
  "andezit-11-22": 19000,
  // Föld
  toltofold: 4000,
  termofold: 11500,
};

for (const [slug, expected] of Object.entries(EXPECTED_PRICES)) {
  const item = findMaterial(slug);
  check(`${slug} létezik`, Boolean(item));
  if (item) eq(`${slug} bruttó ára`, item.priceGross, expected);
}

eq(
  "a katalógus pontosan a jóváhagyott tételeket tartalmazza",
  allMaterials.length,
  Object.keys(EXPECTED_PRICES).length,
);

for (const m of allMaterials) {
  check(
    `${m.slug} szerepel a jóváhagyott árlistában`,
    Object.prototype.hasOwnProperty.call(EXPECTED_PRICES, m.slug),
  );
  check(
    `${m.slug} ára pozitív szám vagy explicit null`,
    m.priceGross === null || (typeof m.priceGross === "number" && m.priceGross > 0),
  );
}

/* ─────────────── 2. Kategóriák és induló árak ─────────────── */
section("Kategóriák és induló (legalacsonyabb bruttó) árak");

deepEq(
  "kategóriák sorrendje",
  materialGroups.map((g) => g.slug),
  ["soder", "homok", "kavics", "murva", "andezit", "fold"],
);

check("Bazalt kategória NEM aktív", !materialGroups.some((g) => g.slug === "bazalt"));
eq("a régi bazalt útvonal andezitre oldódik", LEGACY_GROUP_SLUGS.bazalt, "andezit");

const EXPECTED_START = {
  soder: 10500,
  homok: 9500,
  kavics: 9500,
  murva: 14000,
  andezit: 19000,
  fold: 4000,
};
for (const [slug, expected] of Object.entries(EXPECTED_START)) {
  eq(`${slug} induló ára`, groupStartingPrice(findMaterialGroup(slug)), expected);
}

/* ─────────────── 3. Föld: csak két változat ─────────────── */
section("Föld kategória");

deepEq(
  "a föld kategória pontosan két változatot tartalmaz",
  findMaterialGroup("fold").items.map((i) => i.slug),
  ["toltofold", "termofold"],
);
for (const removed of ["naturfold", "daraltfold", "tragyas-komposztos-fold"]) {
  check(`${removed} nincs az aktív kínálatban`, !findMaterial(removed));
}

/* ─────────────── 4. Mosott-jelölés kiterjedése ─────────────── */
section("Mosott-jelölés (strukturált terméktulajdonság)");

eq("Sóder csoportszintű jelölés", findMaterialGroup("soder").washed?.label, "Mosott sóder");
check(
  "minden sóder tételen ott a mosott jelölés",
  findMaterialGroup("soder").items.every((i) => i.washed?.label === "Mosott sóder"),
);
check(
  "a frakcionált kavicsokon ott az első osztályú, mosott jelölés",
  findMaterialGroup("kavics")
    .items.filter((i) => i.slug !== "kule")
    .every((i) => i.washed?.label === "Első osztályú, mosott kavics"),
);
check("a kulé osztályozatlanként jelölt", findMaterial("kule").unclassified === true);
check("a kulén NINCS mosott jelölés", !findMaterial("kule").washed);
for (const slug of ["murva", "andezit", "fold"]) {
  check(
    `${slug}: a mosottság-állítás nem terjed ki (csoport)`,
    findMaterialGroup(slug).washed === undefined,
  );
  check(
    `${slug}: a mosottság-állítás nem terjed ki (tételek)`,
    findMaterialGroup(slug).items.every((i) => !i.washed),
  );
}
check(
  "a homokon nincs külön mosott jelölés (az ügyfél csak sódert és kavicsot adott meg)",
  findMaterialGroup("homok").items.every((i) => !i.washed),
);

/* ─────────────── 5. Andezit megnevezés ─────────────── */
section("Andezit");

const andezit = findMaterialGroup("andezit");
check(
  "a megnevezés tartalmazza a nógrádkövesdi jelölést",
  /[Nn]ógrádkövesdi/.test(`${andezit.short} ${andezit.description}`),
);
check(
  "nincs ellenőrizetlen andezitfotó (stilizált illusztráció jelenik meg)",
  andezit.photo === null,
);

/* ─────────────── 6. Bruttó részösszeg — nincs dupla ÁFA ─────────────── */
section("Bruttó anyag részösszeg");

const NO_FREIGHT = {
  municipalityId: "budapest",
  districtId: 22,
  postalCode: "1221",
  m3: 1,
};

for (const [slug, qty, expected] of [
  ["soder-0-24", 8, 108000],
  ["tolto-soder", 1, 10500],
  ["toltofold", 10, 40000],
  ["andezit-2-5", 3, 81000],
  ["kule", 5, 47500],
]) {
  const q = computeQuote({
    item: findMaterial(slug),
    m3: qty,
    freight: { ...NO_FREIGHT, m3: qty },
  });
  eq(`${slug} × ${qty} m³ bruttó részösszeg`, q.material.subtotalGross, expected);
  eq(`${slug} bruttó egységár változatlan`, q.material.unitGross, findMaterial(slug).priceGross);
}

// A bruttó árra NEM kerül még egyszer ÁFA: a részösszeg pontosan egységár × m³.
for (const m of allMaterials) {
  if (m.priceGross === null) continue;
  const q = computeQuote({
    item: m,
    m3: 3,
    freight: { ...NO_FREIGHT, m3: 3 },
  });
  check(
    `${m.slug}: nincs dupla ÁFA (3 × ${m.priceGross} = ${q.material.subtotalGross})`,
    q.material.subtotalGross === m.priceGross * 3,
  );
}

/* ─────────────── 7. Régi azonosítók feloldása (nincs törött link) ─────────────── */
section("Örökölt azonosítók");

const LEGACY = {
  "homok-natur": "banyahomok",
  "kavics-4-8": "gyongykavics-4-8",
  "kulekavics-16-32": "kavics-16-32",
  "kulekavics-24-40": "kavics-24-40",
  "kulekavics-30-65": "kule",
  "kerti-murva-5-12": "murva-4-11",
  "kerti-murva-12-20": "murva-11-22",
  "murva-0-20": "murva-0-22",
  "bazalt-0-4": "andezit-2-5",
  "bazalt-2-4": "andezit-2-5",
  "bazalt-11-22": "andezit-11-22",
  naturfold: "toltofold",
  daraltfold: "termofold",
  "tragyas-komposztos-fold": "termofold",
};
for (const [oldSlug, newSlug] of Object.entries(LEGACY)) {
  eq(`${oldSlug} → ${newSlug}`, resolveItemSlug(oldSlug), newSlug);
}
eq("ismeretlen azonosító nem oldódik fel", resolveItemSlug("nincs-ilyen"), undefined);
eq("üres azonosító nem oldódik fel", resolveItemSlug(null), undefined);

/* ─────────────── 8. Árazási verzió ─────────────── */
section("Árazási verzió");
check("van árazási verzió", typeof PRICING_VERSION === "string" && PRICING_VERSION.length > 3);

finish("pricing.test.mjs");
