/**
 * V3 NETTÓ/BRUTTÓ KALKULÁCIÓ.
 *
 * Ellenőrzi: bruttó anyag részösszeg, nettó fuvar + helyes fuvar-ÁFA + bruttó
 * fuvar, teljes bruttó összeg, nincs dupla ÁFA, nincs garantált végösszeg
 * ismeretlen engedélydíjnál, és hogy a nettó fuvart soha nem adjuk
 * közvetlenül a bruttó anyagárhoz.
 *
 * Futtatás: npm run test:quote
 */
import { findMaterial } from "../src/content/catalog.ts";
import {
  FREIGHT_VAT_RATE,
  freightProfiles,
  SINGLE_TRIP_MAX_M3,
} from "../src/content/freight.ts";
import { computeQuote, freightGross, freightVat } from "../src/lib/quote.ts";
import { check, eq, section, finish } from "./_harness.mjs";

const quote = ({ slug = "soder-0-24", m3 = 8, postalCode = "1221", districtId = 22, municipalityId = "budapest", castleAnswer = "" } = {}) =>
  computeQuote({
    item: findMaterial(slug),
    m3,
    freight: { municipalityId, districtId, postalCode, m3 },
    castleAnswer,
  });

/* ─────────── 1. A fuvar ÁFA-kulcsa központi konfiguráció ─────────── */
section("Fuvar ÁFA-kulcs");

eq("a fuvar ÁFA-kulcsa 27% (jóváhagyott, 2026-10-27)", FREIGHT_VAT_RATE, 0.27);
eq("freightVat(22000)", freightVat(22000), 5940);
eq("freightGross(22000)", freightGross(22000), 27940);
eq("freightVat(16000)", freightVat(16000), 4320);
eq("freightGross(16000)", freightGross(16000), 20320);

/* ─────────── 2. A hét kötelező sor ─────────── */
section("Árösszesítő sorai — 8 m³ 0–24 sóder, 1221");

const q = quote();
eq("1) anyag bruttó egységár", q.material.unitGross, 13500);
eq("2) mennyiség", q.material.m3, 8);
eq("3) anyag bruttó részösszeg", q.material.subtotalGross, 108000);
eq("4) fuvar nettó díj", q.freight?.net, 45000);
eq("5) fuvar ÁFA", q.freight?.vat, 12150);
eq("6) fuvar bruttó díj", q.freight?.gross, 57150);
eq("7) teljes bruttó tájékoztató összeg", q.totalGross, 165150);
eq("a sáv felirata", q.freight?.bandLabel, "7–10 m³");
eq("az alkalmazott ÁFA-kulcs szerepel a soron", q.freight?.vatRate, 0.27);

/* ─────────── 3. Nincs dupla ÁFA, és nincs nettó+bruttó összeadás ─────────── */
section("Nincs dupla ÁFA, nincs nettó/bruttó keverés");

eq(
  "a bruttó anyag részösszeg pontosan egységár × m³",
  q.material.subtotalGross,
  13500 * 8,
);
check(
  "a teljes összeg NEM az anyag + nettó fuvar",
  q.totalGross !== q.material.subtotalGross + q.freight.net,
);
eq(
  "a teljes összeg = anyag bruttó + fuvar bruttó",
  q.totalGross,
  q.material.subtotalGross + q.freight.gross,
);
check(
  "az anyagárra nem került ÁFA (a bruttó ár nem nőtt)",
  q.material.unitGross === findMaterial("soder-0-24").priceGross,
);

// Minden profil, minden sáv: a bontás konzisztens.
for (const profile of freightProfiles) {
  for (const band of profile.bands) {
    const code = profile.postalCodes[0];
    const r = quote({
      m3: band.upTo,
      postalCode: code,
      districtId: profile.districtId ?? null,
      municipalityId: profile.municipalityId,
      // Az I. kerületnél a Vár-kérdésre válasz kell, különben a végösszeg
      // szándékosan blokkolt (ismeretlen engedélydíj) — azt a 6. szakasz fedi.
      castleAnswer: profile.districtId === 1 ? "nem" : "",
    });
    if (r.freight === null) {
      check(`${profile.id} @ ${band.upTo} m³ — váratlanul nincs fuvarsor`, false);
      continue;
    }
    eq(`${profile.id} @ ${band.upTo} m³ nettó`, r.freight.net, band.netFee);
    eq(`${profile.id} @ ${band.upTo} m³ ÁFA`, r.freight.vat, Math.round(band.netFee * 0.27));
    eq(
      `${profile.id} @ ${band.upTo} m³ bruttó = nettó + ÁFA`,
      r.freight.gross,
      r.freight.net + r.freight.vat,
    );
    eq(
      `${profile.id} @ ${band.upTo} m³ teljes = anyag bruttó + fuvar bruttó`,
      r.totalGross,
      r.material.subtotalGross + r.freight.gross,
    );
  }
}

/* ─────────── 4. Hiányos bemenet: nincs találgatás ─────────── */
section("Hiányos bemenet");

const noPostal = quote({ postalCode: "" });
eq("irányítószám nélkül nincs fuvarsor", noPostal.freight, null);
eq("irányítószám nélkül nincs teljes összeg", noPostal.totalGross, null);
eq("a blokkolás oka: hiányos", noPostal.totalBlockedReason, "incomplete");
eq("de az anyag bruttó részösszeg már látszik", noPostal.material.subtotalGross, 108000);

const noDistrict = quote({ districtId: null });
eq("kerület nélkül nincs teljes összeg", noDistrict.totalGross, null);

/* ─────────── 5. Egyedi egyeztetés: nincs kitalált ár ─────────── */
section("Egyedi egyeztetés");

const overLimit = quote({ m3: SINGLE_TRIP_MAX_M3 + 1 });
eq("10 m³ felett nincs fuvarsor", overLimit.freight, null);
eq("10 m³ felett nincs teljes összeg", overLimit.totalGross, null);
eq("a blokkolás oka: fuvar-egyeztetés", overLimit.totalBlockedReason, "freight-quote");

const vMissing = quote({ postalCode: "1051", districtId: 5, m3: 7 });
eq("V. kerület @ 7 m³ nincs fuvarsor", vMissing.freight, null);
eq("V. kerület @ 7 m³ nincs teljes összeg", vMissing.totalGross, null);

const unknown = quote({ postalCode: "9999", districtId: 22 });
eq("ismeretlen cím: nincs fuvarsor", unknown.freight, null);
eq("ismeretlen cím: nincs teljes összeg", unknown.totalGross, null);

const mismatchQ = quote({ postalCode: "1111", districtId: 22 });
eq("eltérő kerület/ISZ: nincs fuvarsor", mismatchQ.freight, null);
eq("eltérő kerület/ISZ: nincs teljes összeg", mismatchQ.totalGross, null);
eq("eltérő kerület/ISZ: a hiba típusa", mismatchQ.freightResult.kind, "mismatch");

/* ─────────── 6. Vár: ismeretlen engedélydíj → nincs garantált végösszeg ─────────── */
section("I. kerületi Vár — ismeretlen engedélydíj");

for (const answer of ["igen", "nem-tudom", ""]) {
  const r = quote({ postalCode: "1011", districtId: 1, m3: 5, castleAnswer: answer });
  check(`Vár (${answer || "nincs válasz"}): engedély-egyeztetés kell`, r.needsPermitClearance);
  eq(`Vár (${answer || "nincs válasz"}): NINCS garantált végösszeg`, r.totalGross, null);
  eq(`Vár (${answer || "nincs válasz"}): a blokkolás oka`, r.totalBlockedReason, "permit-unknown");
  // Az ISMERT tételek viszont külön láthatók maradnak.
  eq(`Vár (${answer || "nincs válasz"}): anyag bruttó részösszeg látszik`, r.material.subtotalGross, 67500);
  eq(`Vár (${answer || "nincs válasz"}): fuvar nettó látszik`, r.freight?.net, 32000);
  eq(`Vár (${answer || "nincs válasz"}): fuvar ÁFA látszik`, r.freight?.vat, 8640);
  eq(`Vár (${answer || "nincs válasz"}): fuvar bruttó látszik`, r.freight?.gross, 40640);
}

const notCastle = quote({ postalCode: "1011", districtId: 1, m3: 5, castleAnswer: "nem" });
check("Vár = nem → nincs engedély-egyeztetés", !notCastle.needsPermitClearance);
eq("Vár = nem → van teljes bruttó összeg", notCastle.totalGross, 67500 + 40640);

const otherDistrict = quote({ postalCode: "1221", districtId: 22, m3: 5, castleAnswer: "igen" });
check(
  "más kerületben a Vár-válasz nem blokkol",
  !otherDistrict.needsPermitClearance && otherDistrict.totalGross !== null,
);

/* ─────────── 7. Ár nélküli anyag ─────────── */
section("Ár nélküli anyag");

const noPrice = computeQuote({
  item: { priceGross: null },
  m3: 4,
  freight: { municipalityId: "budapest", districtId: 22, postalCode: "1221", m3: 4 },
});
eq("ár nélküli anyag: nincs részösszeg", noPrice.material.subtotalGross, null);
eq("ár nélküli anyag: nincs teljes összeg", noPrice.totalGross, null);
eq("a blokkolás oka: anyag-egyeztetés", noPrice.totalBlockedReason, "material-quote");

finish("quote.test.mjs");
