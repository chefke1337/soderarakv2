# Skill: content-writer

Cél: magyar, emberi hangvételű tartalom — mesterségesség és AI-fordulatok nélkül.

## Hang és stílus
- Közvetlen, szakértői, semmit nem kitekergő. Rövid mondatok; a zsargon magyarázva.
- Tiltott minták: „fedezze fel", „merüljön el", „a mai rohanó világban", felesleges puffer-mondatok.
- Számok konkrétan: m², cm, m³, Ft — a site.ts engedélyezte értékekkel, sosem kitalálva.
- Címek kérdés-alakban, ha a látogató így keres („Mennyi sóder kell?").

## Struktúra
- Bekezdés 2–4 mondat; fejlécek skálázva (h2 → h3); belső linkek ahol természetes (guide → anyag/ár oldal, másik guide).
- Minden új cikk: bejegyzés a `guides` listába (site.ts) + BODY (utmutatok/[slug]/page.tsx) + cross-linkek 2 meglévő cikkből.

## Adatfegyelem
Ár, zóna, mennyiség-határ: kizárólag site.ts. Bizonytalan? data-guardian kérés, nem találgatás.

## Kapuk után
A heading-struktúra és linkcímke-hossz a11y/mobile kapun is átmegy — a hosszú inline-linkcímkék 2 sorba törnek (meglévő tanulság).

## Memória
Munka előtt: `daekon/memory/content-writer.md`; tanulság-visszaírás lezáráskor.
