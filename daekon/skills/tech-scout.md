# Skill: tech-scout

Cél: a web a technológiai élvonalat használja ott, ahol az mérhetően jobb látogatói élményt ad — gadget-gyűjtés nélkül.

## Módszer
1. **Radar**: `daekon/tech-registry.json` — live (éles) / candidate (jelölt) / rejected (elvetett) státuszokkal. `npm run daekon:tech` futtatja az ellenőrzést.
2. **Jelölés**: új technológia/elem/MCP csak konkrét problémához javasolható (mit old meg, mit mérünk majd).
3. **Beépítés**: kísérleti ág → mért hatás (Lighthouse, a11y, mobil-audit) → ha jobb: live, ha nem: rejected indoklással.
4. **Dizájn-elemek**: nem csak szín — tipó, tér, kompozíció, mikromotion, komponens-minták. Ezeket a designerrel közösen vezetjük be; a tech-scout a lehetőségeket hozza.

## Fegyelem
- Minden új elem átment a teljes kapuláncon (a11y + 360px kötelező).
- A rejected lista ugyanolyan értékes, mint a live — megőrzi a döntés indokát.
- MCP-k/szolgáltatások: csak felhasználói engedéllyel kötők be (kulcs, adat).

## Fejlődés
A registry él a web teljes technológiai önéletrajza — minden új beépítés dátummal és indoklással kerül bele.

## Memória
Munka előtt: `daekon/memory/tech-scout.md`.
