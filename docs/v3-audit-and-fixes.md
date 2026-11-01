# Sóder Árak V3 — teljes audit és javítások (2026-11-01)

Munkabranch: `v3-audit` (a `v3`-ból, 43198e3 = akkor élő commit). Publikálás:
`v3` → `chefke1337/soderarakv3` (gh-pages) → https://chefke1337.github.io/soderarakv3/

## 0. Hozzáférés és módszer

| Erőforrás | Elérhető? | Megjegyzés |
|---|---|---|
| Projektforrás (`chefke1337/soderarakv2`, `v3` ág) | igen | CLAUDE.md, docs, src, scripts, tests átnézve |
| Futtatás helyben | részben | npm-registry tiltva → typecheck/lint/build/axe/Lighthouse a CI-ban; unit tesztek és böngészős tesztek (Playwright) helyben |
| CI (GitHub Actions) | igen | `qa/v3.4` ág: unit, build, axe, 360px audit, regresszió, Lighthouse, mock-backend smoke |
| Böngészős ellenőrzés | igen | Playwright (helyi statikus kiszolgálás), élő oldal: Claude in Chrome |
| Search Console / analitika | **nem** | nincs adat → keresési teljesítményről nincs állítás |

Az alábbi PASS csak ott áll, ahol kód + renderelt kimenet + futtatott teszt igazolja.

## 1. Követelménymátrix

| Követelmény | Oldal/komponens | Állapot | Bizonyíték | Teendő |
|---|---|---|---|---|
| „Rólunk – Minőség minden szemcsében!" ügyfélszöveg | /rolunk, `ROLUNK` | PASS | szó szerinti egyezés a 2026-11-01-i ügyfélszöveggel (regresszió + kézi) | — |
| Mosott sóder jelölése | katalógus, árlista, kalkulátor | PASS | `tests/pricing` (minden sóder: „Jó minőségű, mosott sóder") | — |
| „Első osztályú, mosott kavics" jelölés | katalógus | PASS (felülírva) | az ügyfél 2026-11-01-i kérése: „jó minőségű MOSOTT" → „Jó minőségű, mosott kavics", minden kavicson (kulén is); `tests/pricing` | — |
| Teljes, friss termék- és frakciólista, bruttó Ft/m³ | catalog.ts | PASS | 23/23 ár egyezik az ügyfél-specifikációval (független összevetés, 0 eltérés); „Bruttó anyagárak, Ft/m³" banner minden árlistán | — |
| Andezit a Bazalt helyett | catalog, /anyagok/bazalt | PASS | nincs Bazalt kategória; régi URL noindex + látható link az andezitre | — |
| Föld: csak két aktív változat | catalog | PASS | Töltőföld 4000, Termőföld 11 500; régi slugok átfordítva | — |
| Főoldali üzenet + feltételes aznapi szöveg | / | PASS | „Budafok környékén gyakran még aznap" (nem általános ígéret) | — |
| Impresszum, valós üzemeltetői adatok | /impresszum | PASS | Bau-Kont Logisztik Kft., adószám, cégjegyzékszám (regresszió) | — |
| 1 fuvar max. 10 m³; 1–10 m³ kalkuláció | freight.ts, kalkulátor | PASS | `tests/freight`, `tests/quote`; smoke: „10 m³ felett nincs fuvardíj" | — |
| 10 m³ felett egyedi, többfuvaros | kalkulátor | PASS | smoke: „10 m³ felett többfuvaros ajánlat üzenet" | — |
| Külön település / kerület / irányítószám | kalkulátor | PASS | smoke: kerület/irányítószám eltérés | — |
| Jóváhagyott irányítószámos tarifák | freight.ts | PASS | 25/25 profil, minden irányítószám, ÁFA 27% egyezik (0 eltérés) | — |
| XI. 1112/1118 kivétel | freight.ts | PASS | smoke: „XI. 1112 @ 8 m³ → 60 000 Ft" | — |
| Hiányzó tarifánál nincs 0 Ft | kalkulátor, kereső | PASS | `tests/freight`; regresszió: ismeretlen irányítószám → nincs 0 Ft | — |
| Bruttó anyag / nettó fuvar elkülönítése, ÁFA | quote.ts | PASS | `tests/quote` (440 ellenőrzés), smoke 165 150 Ft példa | — |
| I. kerületi Vár külön egyeztetés | kalkulátor, I. ker. oldal | PASS | smoke: Vár-kérdés; regresszió: I. kerület oldal Vár-GYIK | — |
| Kötelező ügyfél-email | rendelési űrlap | PASS | `tests/order` 422 + email mezőhiba | — |
| Címzett: info@soderarak.hu | order-handler | PASS | `DEFAULT_RECIPIENT` = company.email | — |
| A beküldés nem végleges visszaigazolás | űrlap | PASS | smoke: „a siker NEM végleges megrendelés-visszaigazolás" | — |
| Valódi backend vagy jelzett nem-aktív állapot | űrlap | PASS (nem aktív) | publikus buildben nincs végpont → „A beküldés nincs konfigurálva" + telefon | **BLOCKED**: éles levélküldő szolgáltatás jóváhagyásra vár |
| Nincs hamis siker | űrlap | PASS | regresszió: üres beküldés → hiba, nincs siker; siker csak szerverválaszra |
| Nincs frontendbe égetett secret | build | PASS | build-kimenet átkeresve (kulcs/token minták): 0 találat |
| Nincs telephely / depó / átvétel | teljes oldal | PASS (javítva) | publikus oldalon sosem jelent meg; a nyilvános forrásból is törölve a nem használt belső cím (`tests/area-pages`) |
| Nincs telephelypin | térkép | PASS | 13 jelölés, mind szolgáltatási terület |
| Footer: csak szöveges márkanév | Footer | PASS | képernyőkép |
| Fejléc logó + felirat szoros egység | Header | PASS | képernyőkép 360/768/1440 |
| „Mire kell az anyag?" nem került vissza | teljes forrás | PASS | 0 találat |
| Hat anyag mobilon egy vízszintes sorban | HeapRail | PASS | képernyőkép 390px |
| Képcserék, megosztási előnézet | OG | PASS | minden oldalon og:image + twitter:card (63/63) |
| Korábban eltávolított CTA-blokkok nem jöttek vissza | főoldal | PASS | V3.4-ben visszaállítva az eredeti V3-ra |

## 2. Talált hibák, ok, javítás

| # | Prio | Hiba | Bizonyított kiváltó ok | Javítás | Újraellenőrzés |
|---|---|---|---|---|---|
| T-1 | P1 | Térkép 360 px-en: a budafoki/XI. kerületi feliratok egymásra csúsznak, olvashatatlanok | keskeny térképen 13 állandó felirat ütközik | prioritásos felirat-ütközéskezelés; rejtett felirat neve a pont popupjában, nagyításra visszajön | regresszió: 9 nézet × 0 átfedés / 0 kilógás |
| T-2 | P1 | (a T-1 első javítása) lusta betöltéskor csak 1 felirat maradt | a mérés a Leaflet felirat-pozicionálása előtt futott | mérés a következő képkockákra ütemezve | regresszió PASS |
| T-3 | P2 | Térkép szélső feliratai levágva (V3.5-ben javítva) | szimmetrikus fitBounds-padding | aszimmetrikus padding | regresszió: 0 kilógás |
| M-1 | P1 (a11y) | Mobilmenü nyitásakor a fókusz a gombon maradt (reduced-motion alatt) | a panel láthatósága 1–2 képkockával később frissül | rövid újrapróbálás, amíg a menüpont fókuszálható | regresszió PASS |
| B-1 | P0 (adat) | Nem használt telephely-cím a nyilvános forráskódban | régi belső konstans | törölve; teszt őrzi | `tests/area-pages` |
| S-1 | P2 | 20 kerületnek nem volt saját oldala (csak XI., XXI., XXII.) | — | kerületi oldalak központi adatból (lásd 4.) | 23/23 elérhető (regresszió) |
| S-2 | P2 | Impresszum meta description túl rövid (53 kar.) | — | bővítve, valós tartalommal | SEO-szkript |
| U-1 | P2 | 360 px: tördelt „Minden kerület és városrész" / hosszú kerületcím-link középpontja nem a linkre esik | inline link két sorban | blokk/inline-flex, 44 px magas link | 360px audit PASS |
| D-1 | P0 (adat) | A webalkalmazás-manifest „Tájékoztató **nettó** árak"-at állított (az anyagárak bruttók); a manifest és a 404 leírása „Budafokról" szállítást írt | régi V2-szöveg | „Bruttó anyagárak Ft/m³-ben, a fuvar irányítószám szerint"; 404: „Budapestre és Érdre" | build-kimenet |
| L-1 | P1 (mérés) | A Lighthouse-mérőszkript base path-os buildnél az összes CSS/JS-re 404-et kapott → a korábbi Lighthouse-pontszámok stílus/JS nélküli oldalt mértek (érvénytelenek) | a harness nem vette le a `/soderarakv3` előtagot | előtag-kezelés (a smoke-teszt mintájára), 4 kategória, 8 route, metrikák | lásd 6. — axe és 360px-audit eszközei helyesek voltak |
| P-1 | P1 (perf) | Főoldal Lighthouse Performance 67 | (a) a hero H1 (LCP-elem) átlátszóságból úszott be → ~1 s LCP-késés (mért A/B: 3,94–4,03 s → 2,94–3,01 s); (b) a hat kupac inline SVG-je ~70 KB, kétszer (HTML + RSC) | (a) H1 csak elmozdul, azonnal látható; (b) kupacok statikus `/kupac/*.svg` fájlként, méretfoglalással | főoldal HTML 505→350 KB (gz 76→42 KB); Performance 67→86 |
| U-2 | P2 (a11y) | Lábléc „Adatvédelem"/„Impresszum" link 20 px magas (target-size) | inline szöveg-link | min. 24 px | Lighthouse a11y |
| H-1 | P3 | Időszakos React #418 hydration-hiba (~1–3% betöltés, a teljes `<body>` kliensoldali újrarenderelése) | NEM javítva — lásd 7. | — | regresszió külön WARN-ként számolja |

## 3. Térkép (Leaflet + OpenStreetMap)

- Komponens: `LefedettsegTerkep` (lusta: `LefedettsegTerkepLazy`, hibahatárral). Adat: `serviceAreas` (13 jelölés, saját koordinátával). Díj: kizárólag irányítószámból (`freight.ts`) — a térkép „áttekintő" feliratú, határt nem rajzol, a régi háromzónás ábra megszűnt.
- Ellenőrizve (/, /teruletek, /kapcsolat × 360/768/1440 + elforgatás): minden jelölés a kereten belül; feliratok nem fednek és nem lógnak ki; OSM-attribúció látható; a sticky fejléc és a nyitott mobilmenü a térkép fölött van; átméretezés/tájolásváltás után újraillesztés; egyujjas húzás mobilon az oldalt görgeti, nagyítás gombbal/csippentéssel.
- Nem tesztelve: valódi OSM-csempék (a teszt-környezet nem éri el; üres csempével mérve).

## 4. SEO-oldaltérkép

| Oldal | Szándék | Egyedi hasznos tartalom | Belső kapcsolatok | Indok |
|---|---|---|---|---|
| /anyagok, /anyagok/[anyag] | anyagválasztás | frakciók, bruttó Ft/m³, mosott-jelölés | árlista, kalkulátor | meglévő |
| /arak | árösszevetés | teljes bruttó árlista | anyagok, kalkulátor | meglévő |
| /szallitas | fuvardíj | 25 díjprofil, sávok, engedély | **kerületi oldalak (új link)** | meglévő |
| /teruletek | „szállítanak-e hozzám?" | kereső + 23 kerület városrészekkel (statikus HTML), Service JSON-LD | minden kerületi oldal | V3.6 |
| /teruletek/budapest-N-kerulet (20 új) | „sóder szállítás XIV. kerület" | **a kerület saját díjsávjai, irányítószámai, mennyiségi korlátja, Vár (I.), városrészei, adatvezérelt GYIK** | szomszédos sorszámú kerületek, díjlista, kalkulátor | valódi, kerületenként eltérő adat — nem helynév-csere |
| /teruletek/(budafok, albertfalva, …) | településrész | meglévő + a kerület városrészei | kerület-index | meglévő |
| /utmutatok/* | mennyiségtervezés | 11 útmutató | anyagok, kalkulátor | meglévő |

Nem készült: városrészenkénti oldal (≈250 csak névben eltérő oldal lenne; városrészhez nincs saját díj vagy irányítószám — a brief szerint tilos), új településoldal tarifa nélkül.

## 5. Technikai SEO (63 exportált oldal)

| Ellenőrzés | Eredmény |
|---|---|
| Title / description egyedi | PASS (0 duplikátum) |
| Egy H1 / heading-ugrás | PASS / PASS |
| Canonical (trailing slash) | PASS; 404 a gyökér canonicalt örökli (noindex) — tudatosan, a validátor elvárása |
| OG + Twitter | PASS (63/63) |
| Kép-alt | PASS |
| Sitemap | PASS: minden indexelendő oldal (59), a noindex jogi oldalak és a 404 nélkül |
| Árva oldal | csak a 404 és a régi `/anyagok/bazalt` átirányító (szándékos) |
| Strukturált adat | LocalBusiness, Breadcrumb, Service (areaServed), FAQ — csak látható, valós adat; nincs értékelés/review |

### Indexelési döntés
A V3 jóváhagyott szerepe: **preview** — minden oldal `noindex, follow`. Nincs végleges indexelési jóváhagyás, ezért **megőrizve**. Következmény: az új SEO-oldalak keresőben NEM jelenhetnek meg, amíg az indexelés nincs élesítve; Lighthouse SEO = 66 (egyetlen bukó audit: `is-crawlable`). Élesítési terv (jóváhagyás után): `noindex` le, végleges domain canonical/`NEXT_PUBLIC_SITE_URL`, sitemap beküldése Search Console-ba.

## 6. Mérések (CI, helyi statikus szerver, Lighthouse 13 mobil preset, szimulált throttling, javított harness)

| Route | Perf | A11y | BP | SEO | FCP / LCP / TBT / CLS |
|---|---|---|---|---|---|
| / | 86 (előtte 67) | 97* | 100 | 69** | 2,26 s / 3,68 s / 101 ms / 0,001 |
| /arkalkulator/ | 96 | 100 | 100 | 66** | 1,05 s / 1,80 s / 65 ms / **0,115** |
| /arak/ | 89 | 100 | 100 | 66** | 2,25 s / 3,30 s / 73 ms / 0 |
| /teruletek/ | 93 | 100 | 100 | 66** | 2,25 s / 2,85 s / 35 ms / 0 |
| /teruletek/budapest-14-kerulet/ | 93 | 100 | 100 | 66** | 1,95 s / 3,00 s / 63 ms / 0 |
| /utmutatok/ | 94 | 100 | 100 | 66** | 2,10 s / 2,70 s / 71 ms / 0 |
| /anyagok/soder/ | 92 | 100 | 100 | 69** | 2,10 s / 3,15 s / 33 ms / 0 |
| /teruletek/erd/ | 93 | 100 | 100 | 66** | 1,95 s / 3,00 s / 66 ms / 0 |

\* A főoldali `color-contrast` a „Rendelés menete" görgetésre beúszó lépéseit méri beúszás előtti (áttetsző) állapotban — futásonként változó (egy futásban 100); látogatónál a szöveg beúszás után teljes kontraszttal látszik. Az axe (reduced-motion) CI-lépés PASS.
\*\* Kizárólag a szándékos noindex (`is-crawlable`).

Laborérték egyetlen futásból (CI-gépen) — nem valós felhasználói Core Web Vitals. A korábbi dokumentumokban szereplő ~95–97-es főoldali pontszám a hibás harness (L-1) idejéből származhat; nem tekinthető összevethető alapnak.

Helyi Playwright (360 px, 4× CPU, lassú 4G, 4 futás): főoldali LCP 3,94–4,03 s → 2,94–3,01 s a H1-javítással.

## 7. Fennmaradó tételek

- **H-1 (nyitott):** időszakos React #418 hydration-hiba. Bizonyítékok: a régi élő buildben is jelentkezik; a CSS-átírás visszacsinálásával sem szűnik meg (A/B); a teljes `<body>` újrarenderelődik, a body első eleme a Next 15.4 metadata-outlet `<div hidden>`-je. Látható hatás nincs (azonos tartalom). Valószínű ok: keretrendszer-szintű versenyhelyzet; javítás Next-frissítéssel próbálható — függőségváltás, jóváhagyást igényel.
- **CLS a kalkulátoron (Lighthouse 0,115):** az aszinkron CSS (CLAUDE.md: mért, tudatos kompromisszum, „ne próbáld újra új mérés nélkül") a szimulált betöltésben stílus nélküli első festést ad. Helyi valódi betöltésnél (3 futás) CLS 0. Javaslat: külön A/B a kritikus CSS kalkulátorra szabott megoldásával — nem ennek az auditnak a hatóköre.
- **Főoldal Performance 86 (cél 90):** a maradék a nagy RSC-payload (23 tételes árlista + hero) — további csökkentés a főoldali árlista tartalmának átszervezését igényelné (design-döntés).
- **Ügyfélnek ellenőrzésre:** a „Saját flotta Budafokról" (Rólunk OG-kép) és „Budafokról és környékéről indulunk" (útmutató) szövegek — telephely-állításnak nem minősülnek, de a „nincs telephely" döntés fényében érdemes jóváhagyatni.
- **BLOCKED:** automatikus rendelés-e-mail (info@soderarak.hu) — levélküldő szolgáltatás bekapcsolása jóváhagyást igényel.
- **Döntés:** indexelés élesítése.
- Ügyfélkérdések: XXIII. kerület csak 1237–1239; Diósd/Törökbálint/Tárnok/Sóskút/Pusztazámor tarifa nélkül; andezit-fotó hiányzik.

## 8. Tesztek

| Teszt | Eredmény |
|---|---|
| `test:pricing` / `freight` / `quote` / `districts` / `areas` / `order` | PASS (170 / 3635 / 440 / 117 / 56 / CI) |
| typecheck, lint, production build | PASS (CI) |
| axe WCAG A/AA (exportált build) | PASS (CI) |
| 360 px mobil-audit | PASS (CI) |
| `test:regression` (új) | 78 OK, 0 FAIL (+H-1 WARN számlálás) |
| `test:smoke` (mock backend) | PASS (CI) |
| Lighthouse (4 kategória, 8 route, javított harness) | lásd 6. |

## 9. Módosított fájlok (audit)

`src/components/LefedettsegTerkep.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `src/components/MaterialHeaps.tsx`, `src/app/kupac/[fajl]/route.ts` (új), `src/components/MaterialPile.tsx` (törölve), `src/app/manifest.ts`, `src/components/Footer.tsx`, `scripts/prepare-static-export.mjs`, `src/components/MobileMenu.tsx`, `src/content/site.ts`, `src/app/teruletek/[telepules]/page.tsx`, `src/app/teruletek/[telepules]/opengraph-image.tsx`, `src/app/sitemap.ts`, `src/components/DistrictIndex.tsx`, `src/components/AreaFinder.tsx`, `src/components/PostalTariffTable.tsx`, `src/app/impresszum/page.tsx`, `scripts/v3-regression.mjs` (új), `scripts/lighthouse-export.mjs`, `tests/area-pages.test.mjs` (új), `package.json`.
