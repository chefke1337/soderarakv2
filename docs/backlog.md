# Prioritásos backlog — soderarak.hu (2026-11-09)

A `CLAUDE.md`/megbízás 19.6. szakasza szerinti önálló deliverable: minden
eddig (`v3-audit-and-fixes.md`, `decisions.md`, `market-research.md`,
`business-facts.md`, `metrics-plan.md`) **szétszórva nyitva maradt** tétel
egy helyen, P0–P3 súlyozással. Csak **nyitott** tételek — a már javított
hibák a `v3-audit-and-fixes.md` 2. szakaszában, illetve a `decisions.md`
változtatási naplójában maradnak.

Súlyozás: **P0** = adat/biztonsági/tulajdonosi döntés, amely nélkül az
oldal nem tekinthető teljesen élesítésre késznek; **P1** = valódi, mért
hatású technikai/tartalmi hiányosság; **P2** = polírozási/kisebb hiányosság;
**P3** = opcionális, feltáró jellegű, nem blokkoló.

## P0 — tulajdonosi döntés vagy adatkonzisztencia-kockázat

| # | Tétel | Eredet | Következmény, ha nyitva marad |
|---|---|---|---|
| P0-1 | Indexelés élesítése (`noindex` levétele) | `v3-audit-and-fixes.md` 5. szakasz; **2026-11-09-én SERP-szinten is megerősítve** (`market-research.md` 1.2) — a site két mintakeresésben sem jelent meg, miközben 7+ versenytárs/klaszter aktívan foglalja a helyet | Az egész SEO-munka (23 kerületi oldal, 11 útmutató, strukturált adat) nem hoz organikus forgalmat, amíg ez a kapcsoló zárva van |
| P0-2 | `v3-audit` ág szinkronizálása az `origin/v3`-tal + a rendelési e-mail cím egységesítése (`info@` vs `rendeles@soderarak.hu`) | `decisions.md` 2026-11-09 18:49 bejegyzés (párhuzamos session commitja); megerősítve: `src/server/order-handler.ts:104` ezen az ágon még `info@soderarak.hu` | Ha a `v3-audit` ág publikálásra kerül a párhuzamos session commitja nélkül, a rendelések a régi, esetleg már nem figyelt postafiókba mennének |

## P1 — valódi, mért hatású hiányosság

| # | Tétel | Eredet | Jelenlegi állapot |
|---|---|---|---|
| P1-1 | H-1: időszakos React #418 hidratációs hiba | `decisions.md`, 2026-11-08-án elsőként reprodukálva (2× egy 20 route-os seprésben) | Regresszióteszt WARN-ként kezeli, nem blokkoló; gyökérok nem bizonyított (feltételezett keretrendszer-szintű versenyhelyzet) |
| P1-2 | next@16 major frissítés (bundle-ölt postcss biztonsági rés) | `decisions.md` 2026-11-08 (folytatás 2) | Patch-bump (15.5.29) megtörtént, a major **nem** — valódi breaking change, külön jóváhagyást igényel |
| P1-3 | 5 nevesített település (Diósd, Törökbálint, Tárnok, Sóskút, Pusztazámor) — nincs jóváhagyott fuvardíj-tarifa | `v3-audit-and-fixes.md` 7. szakasz; a piackutatás megerősítette: **két versenytárs-klaszter is hirdet ezekre a településekre szolgáltatást** (`market-research.md` 1.2a) | Kalkulátor egyedi egyeztetést kér, nincs automata ár — helyes védelem, de szűkebb lefedettséget jelent, mint a versenytársak hirdetett területe |
| P1-4 | XXIII. kerület — csak 1237–1239 irányítószámra van tarifa | `v3-audit-and-fixes.md` 7. szakasz | Ua. — egyedi egyeztetés a le nem fedett irányítószámokon |
| P1-5 | Árgarancia/aznapi szállítás vállalásának eldöntése | `market-research.md` 5.5., `business-facts.md` #3 | Nincs ilyen állítás a site-on — csak valós alap esetén vehető fel |
| P1-6 | Valós, igazolható ügyfélszám/tesztimónium kérdése | `market-research.md` 5.5./4. mátrix (Sóderház versenytárs saját, nem igazolt "1037 ügyfél" állítása volt a kiváltó megfigyelés), `business-facts.md` #4 | Nincs ilyen elem a site-on; csak valós adat alapján vehető fel |

## P2 — polírozási / kisebb hiányosság

| # | Tétel | Eredet | Jelenlegi állapot |
|---|---|---|---|
| P2-1 | Andezit-fotó hiánya (stilizált illusztráció helyette) | `v3-audit-and-fixes.md` 7. szakasz, `catalog.ts:318-320` | A régi bazaltfotó szándékosan NEM lett átnevezve — adat-integritás, de hiányos vizuál |
| P2-2 | "Saját flotta Budafokról" / "Budafokról és környékéről indulunk" szövegek külön jóváhagyása | `v3-audit-and-fixes.md` 7. szakasz | Nem telephely-állítás, de a "nincs telephely" döntés fényében érdemes külön jóváhagyatni |
| P2-3 | Kalkulátor CLS (Lighthouse szimulált 0,115; valós betöltésnél mérten 0) | `v3-audit-and-fixes.md` 7. szakasz | Dokumentált, tudatos kompromisszum (async CSS) — külön A/B szükséges a kritikus CSS-sel, nem ennek a körnek a hatóköre |
| P2-4 | Főoldal Lighthouse Performance 84–86 (cél 90) | `v3-audit-and-fixes.md` 6–7. szakasz, `decisions.md` 2026-11-08 | A maradék a nagy RSC-payload (23 tételes árlista + hero) — további csökkentés tartalmi átszervezést (design-döntést) igényelne |
| P2-5 | Valódi cross-browser / fizikai eszköz teszt (iOS Safari, Android Chrome) | Minden audit-kör nyitva hagyta | Csak asztali Chromium-renderelésű Playwright-screenshot történt eddig |

## P3 — opcionális, feltáró, nem blokkoló

| # | Tétel | Eredet |
|---|---|---|
| P3-1 | `kavicsszallitas.hu` klasztertagságának megerősítése (A/B klaszter vagy önálló) | `market-research.md` 1.2b, 6. szakasz |
| P3-2 | Golts Épker Kft. (goltsepker.hu) mélyebb vizsgálata | `market-research.md` 4. mátrix, 6. szakasz |
| P3-3 | A két azonosított domainklaszter üzemeltetőjének cégjogi azonosítása (whois/e-cégjegyzék) | `market-research.md` 6. szakasz — **csak ha a tulajdonosnak ennek stratégiai jelentősége van, magától nem indítandó** |
| P3-4 | `Article`/`HowTo` strukturált adat hozzáadása az útmutató oldalakra | `decisions.md` 2026-11-08 (folytatás 2) — jelenlegi `BreadcrumbList`+`FAQPage` lefedettség érvényes és elegendő, ez csak bővítési ötlet |
| P3-5 | Valódi, geolokalizált SERP-mérés (fizetős eszköz vagy bejelentkezett, budapesti IP-ről futó keresés) | `market-research.md` 0., 3. szakasz |

## Kifejezetten NEM backlog-tétel (tudatosan kizárva)

- Új oldaltípus létrehozása kitalált kulcsszóvolumen alapján — a 2026-11-09-i
  piackutatás nem talált ehhez bizonyított igényt (`market-research.md` 5.3).
- Versenytárs kerületi aloldalainak "doorway" mintázatának átvétele, vagy
  a versenytárs-támadó hangnem (`kavicsszallitas.hu` mintája) átvétele —
  a megbízás 8–9. szakasza ezt kifejezetten tiltja.
- GA4 property/Measurement ID kitalálása vagy aktiválása — a tulajdonos
  még nem adott valós `G-` azonosítót (`CLAUDE.md`, `metrics-plan.md` §1).
