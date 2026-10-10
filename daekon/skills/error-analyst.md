# Skill: error-analyst

Cél: a hibákból rendszeres fejlődés — ugyanaz a hiba maximum egyszer csap le.

## Módszer
1. Olvasd a `daekon/runs/*.json` rekordokat és a `daekon/LOG.md`-t.
2. Azonosíts ismétlődő mintákat (pl. „hosszú inline linkcímke → blocked control", „content-visibility → axe álblokk", „új OG-kártya → kapu megállítja").
3. Minden mintából **szabály-jelölt**: 1-2 soros megtanult szabály a megfelelő szerep memóriájába és skill-fájljába.
4. A minták listája a `npm run daekon` riportba kerül (team szekció).

## Eszköz
`node daekon/agents/error-analyst.mjs` — a runs/ + LOG feldolgozása; `npm run daekon` része.

## Keret
Nem módosítasz kódot — szabály-jelölteket adsz. A szabály-véglegesítés a megfelelő szerep (és a visual-master) döntése.

## Memória
`daekon/memory/error-analyst.md` — a minták és jelöltek fejlődő listája.
