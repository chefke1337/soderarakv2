/**
 * V3 KERÜLETEK ÉS VÁROSRÉSZEK — az ügyfél listájának integritása.
 *
 * Ellenőrzi: mind a 23 kerület szerepel egyszer, sorrendben; nincs üres vagy
 * duplikált városrész egy kerületen belül; a megosztott városrészek MINDEN
 * megadott kerületnél ott vannak (nem rendeltük önkényesen egyhez); a modul
 * nem tartalmaz irányítószámot vagy díjat (városrészből nincs tarifa).
 *
 * Futtatás: npm run test:districts
 */
import { readFileSync } from "node:fs";
import { budapestDistrictAreas, districtAreas } from "../src/content/districts.ts";
import { check, eq, section, finish } from "./_harness.mjs";

section("23 kerület, sorrendben");
eq("23 kerület", budapestDistrictAreas.length, 23);
budapestDistrictAreas.forEach((d, i) => eq(`${i + 1}. elem azonosítója`, d.id, i + 1));

section("Városrészek");
for (const d of budapestDistrictAreas) {
  check(`${d.id}. kerület: van városrész`, d.areas.length > 0);
  check(`${d.id}. kerület: nincs üres/szóközös név`, d.areas.every((a) => a.trim() === a && a.length > 0));
  eq(`${d.id}. kerület: nincs duplikátum`, new Set(d.areas).size, d.areas.length);
}

section("Megosztott városrészek minden megadott kerületnél");
const base = (a) => a.replace(/\s*\(.*\)\s*$/, "");
const has = (id, name) => districtAreas(id).areas.some((a) => base(a) === name);
const SHARED = {
  Víziváros: [1, 2],
  Krisztinaváros: [1, 12],
  Tabán: [1, 11],
  Gellérthegy: [1, 11],
  Sashegy: [11, 12],
  Szépvölgy: [2, 3],
  Újlak: [2, 3],
  Budakeszierdő: [2, 12],
  Háros: [21, 22],
  Kőérberek: [11, 22],
  Orbánhegy: [12, 23],
};
for (const [name, ids] of Object.entries(SHARED)) {
  for (const id of ids) check(`${name} szerepel a(z) ${id}. kerületnél`, has(id, name));
}

section("Nincs irányítószám vagy díj a városrész-modulban");
const src = readFileSync(new URL("../src/content/districts.ts", import.meta.url), "utf8");
check("nincs négyjegyű irányítószám", !/\b1\d{3}\b/.test(src.replace(/\/\*[\s\S]*?\*\//g, "")));
check("nincs díj/tarifa a kódban", !/Ft|ft\b|price|tarif|freight/i.test(src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")));

finish("districts");
