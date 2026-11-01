/**
 * V3 TERÜLETI OLDALAK — adatkonzisztencia (audit, 2026-11-01).
 *
 * Ellenőrzi: minden budapesti kerületnek pontosan egy kerületi oldala van
 * (a meglévő XI./XXI./XXII. slugok megmaradnak), a slugok egyediek, minden
 * kerületi oldalhoz van jóváhagyott díjprofil, a térkép (serviceAreas) nem
 * kapott új, koordináta nélküli jelölést, és a forrásban nincs telephely-adat.
 *
 * Futtatás: npm run test:areas
 */
import { readFileSync } from "node:fs";
import {
  areaPages,
  budapestDistricts,
  districtAreaPages,
  districtPageSlug,
  findAreaPage,
  freightProfiles,
  serviceAreas,
} from "../src/content/site.ts";
import { check, eq, section, finish } from "./_harness.mjs";

section("Kerületi oldalak");
eq("23 kerület", budapestDistricts.length, 23);
const slugs = budapestDistricts.map((d) => districtPageSlug(d.id));
eq("23 egyedi kerületi slug", new Set(slugs).size, 23);
eq("XI. → meglévő Újbuda-oldal", districtPageSlug(11), "ujbuda-budapest-11-kerulet");
eq("XXI. → meglévő Csepel-oldal", districtPageSlug(21), "csepel");
eq("XXII. → meglévő XXII. kerület oldal", districtPageSlug(22), "budapest-22-kerulet");
eq("20 új kerületi oldal", districtAreaPages.length, 20);
for (const d of budapestDistricts) {
  const page = findAreaPage(districtPageSlug(d.id));
  check(`${d.id}. kerület: van oldala`, !!page);
  check(
    `${d.id}. kerület: van jóváhagyott díjprofilja`,
    freightProfiles.some((p) => p.municipalityId === "budapest" && p.districtId === d.id),
  );
}

section("Területoldalak és térkép");
eq("összes területoldal egyedi slugja", new Set(areaPages.map((a) => a.slug)).size, areaPages.length);
eq("a térkép jelölései változatlanok (13)", serviceAreas.length, 13);
check("minden térképjelölésnek van koordinátája", serviceAreas.every((a) => Array.isArray(a.latlng)));

section("Nincs telephely-adat a forrásban");
const src = readFileSync(new URL("../src/content/site.ts", import.meta.url), "utf8");
check("site.ts: nincs telephely-cím", !/Arany János|Telephely —/.test(src));

finish("area-pages");
