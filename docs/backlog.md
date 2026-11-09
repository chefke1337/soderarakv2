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
| P0-3 | Nincs egyetlen, valódi kapcsoló az élesítéshez | `independent-audit.md` A.2 — **saját kódolvasással megerősítve**: `src/content/site.ts:56` `IS_PREVIEW` konstansnak `grep -rn "IS_PREVIEW" src/` **0 felhasználót** ad; a tényleges `noindex` `src/app/layout.tsx:65`-ön hardkódolt, ettől függetlenül | Az élesítés nem "egy env var", hanem több fájl kézi átnézését igénylő feladat — az élesítési tervnek ezt explicit fel kell sorolnia (lásd P0-1) |
| P0-4 | Adatvédelmi tájékoztató nem sorolja fel a számlázási adatok (név, adószám, cím) kezelését | `independent-audit.md` A.3 — **saját kódolvasással megerősítve**: `adatvedelem/page.tsx` "Milyen adatot és miért?" szakasza nem említi; `BillingFields.tsx` + `order.ts:198` igazoltan gyűjti/küldi, amikor a felhasználó kitölti | Valós GDPR-tájékoztatási rés a 2026-11-07/08-i számlázási bővítés óta — a szöveget bővíteni kell, mielőtt bármilyen éles forgalom érné az űrlapot |

## P1 — valódi, mért hatású hiányosság

| # | Tétel | Eredet | Jelenlegi állapot |
|---|---|---|---|
| P1-1 | H-1: időszakos React #418 hidratációs hiba | `decisions.md`, 2026-11-08-án elsőként reprodukálva (2× egy 20 route-os seprésben) | Regresszióteszt WARN-ként kezeli, nem blokkoló; gyökérok nem bizonyított (feltételezett keretrendszer-szintű versenyhelyzet) |
| P1-2 | next@16 major frissítés (bundle-ölt postcss biztonsági rés) | `decisions.md` 2026-11-08 (folytatás 2) | Patch-bump (15.5.29) megtörtént, a major **nem** — valódi breaking change, külön jóváhagyást igényel |
| P1-3 | 5 nevesített település (Diósd, Törökbálint, Tárnok, Sóskút, Pusztazámor) — nincs jóváhagyott fuvardíj-tarifa | `v3-audit-and-fixes.md` 7. szakasz; a piackutatás megerősítette: **két versenytárs-klaszter is hirdet ezekre a településekre szolgáltatást** (`market-research.md` 1.2a) | Kalkulátor egyedi egyeztetést kér, nincs automata ár — helyes védelem, de szűkebb lefedettséget jelent, mint a versenytársak hirdetett területe |
| P1-4 | XXIII. kerület — csak 1237–1239 irányítószámra van tarifa | `v3-audit-and-fixes.md` 7. szakasz | Ua. — egyedi egyeztetés a le nem fedett irányítószámokon |
| P1-5 | Árgarancia/aznapi szállítás vállalásának eldöntése | `market-research.md` 5.5., `business-facts.md` #3 | Nincs ilyen állítás a site-on — csak valós alap esetén vehető fel |
| P1-6 | Valós, igazolható ügyfélszám/tesztimónium kérdése | `market-research.md` 5.5./4. mátrix (Sóderház versenytárs saját, nem igazolt "1037 ügyfél" állítása volt a kiváltó megfigyelés), `business-facts.md` #4 | Nincs ilyen elem a site-on; csak valós adat alapján vehető fel |
| P1-7 | CI (`deploy-v3-pages.yml`) kihagyja az `og-hash.mjs` pixel-regressziós kaput | `independent-audit.md` A.8 — **saját fájlolvasással megerősítve**: `package.json` `build` script tartalmazza, a workflow közvetlen `next build && prepare-static-export.mjs`-t futtat, og-hash nélkül | A `CLAUDE.md` load-bearing kapuként nevezi meg ezt — a GitHub Pages demo-deploy ezt soha nem futtatja, csak a lokális/manuális build |
| P1-8 | Hardkódolt árak `src/app/utmutatok/[slug]/page.tsx:125,325`-ön, nem `catalog.ts`-ből interpolálva | `independent-audit.md` A.6 (alügynök állítása, sor-hivatkozással, nem egyenként újraszámolva) | Jelenleg egyezik a katalógussal — látens eltérés-kockázat, ugyanaz a hibaosztály, mint a korábban javított `tel:`-literál eset |
| P1-9 | A kalkulátor 3. lépésének kötelező mezői (kerület, irányítószám, utca/házszám) nincsenek `required`/`aria-required`-del jelölve | `independent-audit.md` A.7 (alügynök állítása, `ArkalkulatorForm.tsx` ~790–879. sor) | Automatizált axe-futás nem kapja el; valódi, kézi a11y-ellenőrzést igényel a megerősítéshez |
| P1-10 | 6 használaton kívüli produkciós függőség (`framer-motion`, `lucide-react`, 2× `@radix-ui`, `clsx`, `tailwind-merge`) | `independent-audit.md` A.5 (alügynök állítása — **nem ellenőriztem egyenként újra**, önálló megerősítés szükséges törlés előtt) | Ha igaz, ütközik a `CLAUDE.md` "ne vezess be függőséget konkrét indok nélkül" elvével |

## P2 — polírozási / kisebb hiányosság

| # | Tétel | Eredet | Jelenlegi állapot |
|---|---|---|---|
| P2-1 | Andezit-fotó hiánya (stilizált illusztráció helyette) | `v3-audit-and-fixes.md` 7. szakasz, `catalog.ts:318-320` | A régi bazaltfotó szándékosan NEM lett átnevezve — adat-integritás, de hiányos vizuál |
| P2-2 | "Saját flotta Budafokról" / "Budafokról és környékéről indulunk" szövegek külön jóváhagyása | `v3-audit-and-fixes.md` 7. szakasz | Nem telephely-állítás, de a "nincs telephely" döntés fényében érdemes külön jóváhagyatni |
| P2-3 | Kalkulátor CLS (Lighthouse szimulált 0,115; valós betöltésnél mérten 0) | `v3-audit-and-fixes.md` 7. szakasz | Dokumentált, tudatos kompromisszum (async CSS) — külön A/B szükséges a kritikus CSS-sel, nem ennek a körnek a hatóköre |
| P2-4 | Főoldal Lighthouse Performance 84–86 (cél 90) | `v3-audit-and-fixes.md` 6–7. szakasz, `decisions.md` 2026-11-08 | A maradék a nagy RSC-payload (23 tételes árlista + hero) — további csökkentés tartalmi átszervezést (design-döntést) igényelne |
| P2-5 | Valódi cross-browser / fizikai eszköz teszt (iOS Safari, Android Chrome) | Minden audit-kör nyitva hagyta | Csak asztali Chromium-renderelésű Playwright-screenshot történt eddig |
| P2-6 | `docs/v3-audit-and-fixes.md` 1. szakasz 3 sora elavult adatra hivatkozik (impresszum cégnév, kulé mosott-jelölés, térkép-jelölésszám) | `independent-audit.md` A.19 — **mindhárom saját kódolvasással megerősítve** | **Dokumentáció-staleness, NEM élő hiba** — a 2026-11-09-i auditpassz előtt frissíteni kell, nehogy egy jövőbeli olvasó elavult tényt vegyen át |
| P2-7 | `docs/design-system.md` és `docs/sitemap.md` több állítása nem egyezik az élő kóddal (pl. `.glow-ring` előírva, de a kódból törölve; sitemap.md nettó árat és "saját depót" ír a jóváhagyott bruttó modell / "nincs telephely" döntés ellenére) | `independent-audit.md` A.20 — a `.glow-ring` hiányát saját `grep`-pel megerősítettem; a két dokumentum teljes, sor-pontos átvizsgálása még nem történt meg | Ugyanaz a staleness-kockázat, mint P2-6 |
| P2-8 | Adatvédelmi tájékoztató jelen időben írja le a GA4-mérést, miközben az jelenleg sosem töltődik be (`NEXT_PUBLIC_GA4_ID` üres) | `independent-audit.md` A.4 | Pontossági/megfogalmazási kérdés, nem aktív téves adatkezelés — kisebb súlyú, mint P0-4 |
| P2-9 | Több, egyenként nem újraellenőrzött, de hitelesnek tűnő apró tétel az alügynöki jelentésből (versengő CTA-k, 8× egyidejű `backdrop-filter`, 12 díszítő kép a felhajtás fölött, `aria-pressed` egyválasztós csoportokon, dependency-tömb nélküli `useEffect`, arbitrary típusméretek, 3 eltérő theme-color, mobil nav teljes dokumentum-betöltéssel, 2 elírás, copyright-év befagyás, consent-dialógus z-index) | `independent-audit.md` A.9–18 | Lásd a teljes listát az `independent-audit.md`-ben — mielőtt bármelyiket kódmódosítás követi, **egyenként újra kell ellenőrizni**, ahogy a P0/P1-es tételeknél történt |
| P2-10 | `test:a11y` és `test:mobile` csendben **cache-skip**-pel tér vissza változatlan fán, ha nincs `DAEKON_FULL_AUDIT=1` beállítva — nem derül ki a kimenetből, hogy valódi auditálás történt-e | `independent-audit.md` B. szakasz — **saját, friss futtatással megerősített** megállapítás (a `quality-auditor` alügynök elsőre maga is cache-skip-et kapott, csak kényszerítéssel futott valódi audit) | Minden korábbi audit-napló "63/63 PASS" sorát **nem lehet visszamenőlegesen eldönteni**, hogy kényszerített futásból jött-e; jövőbeli auditoknak explicit `DAEKON_FULL_AUDIT=1`-gyel kell futtatniuk és ezt a naplóba is beírniuk |
| P2-11 | `docs/decisions.md` 2026-11-08-i bejegyzése "4647 OK"-t ír a `test:all` összesítőre; a saját felsorolt részösszegei (181+3635+440+117+83+166+26) valójában **4648**-ra jönnek ki, és a mai friss futtatás is 4648-at adott | `independent-audit.md` B. szakasz | Írási hiba a naplóban, nem regresszió — minden részösszeg egyezik |
| P2-12 | `CLAUDE.md` "Known fragile spots" szakasza "~95-97 Lighthouse" mért helyi maximumot állít a főoldalra; minden 2026-11-01 utáni, ebben a repóban dokumentált mérés 83-90 között van, és a `v3-audit-and-fixes.md` már jelezte, hogy a magasabb szám valószínűleg a hibás (base-path nélküli) Lighthouse-harness korából származik | `independent-audit.md` B. szakasz | A `CLAUDE.md` (projekt-utasítás) szövege ezt a caveatot nem tartalmazza — **tulajdonosi/karbantartói döntés**, hogy frissül-e a `CLAUDE.md`, ezt a session nem módosította magától |

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
