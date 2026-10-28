# Sóder Árak V3 — brief és végrehajtás

Branch: `v3` (worktree: `C:\Users\Sz\PROJECTS\soderarak-v3`)
Kiinduló commit: `a9afc4c` (main)
Árazási verzió: `v3-2026-10-27`

A V3 nem publikus előnézet: a layout `noindex, follow`-t ad, a `v3` branch
pusholása **nem indít deployt** (a Pages-workflow csak `main`-re, a preview
build csak `preview/**`-ra fut).

## 1. Jóváhagyott ügyfélválaszok (2026-10-27)

| Kérdés | Válasz | Hol él a kódban |
| --- | --- | --- |
| Fuvar ÁFA-kulcsa | **27%** (magyar általános) | `FREIGHT_VAT_RATE` — `src/content/freight.ts` |
| Kulé vs. „minden anyag osztályozott" | **Rólunk szöveg szűkítése** | `ROLUNK.paragraphs[1]` — `src/content/site.ts` |
| Érd irányítószámai | **2030 és 2049** | `freightProfiles` → `erd` |

## 2. Adatmodell — egyetlen forrás

| Modul | Tartalom | Ártermészet |
| --- | --- | --- |
| `src/content/catalog.ts` | 6 kategória, 23 termékváltozat, mosott-jelölés | **BRUTTÓ** Ft/m³ (ÁFÁ-val) |
| `src/content/freight.ts` | 25 díjprofil, 4 mennyiségi sáv, Vár-logika | **NETTÓ** Ft / fuvar |
| `src/lib/quote.ts` | bruttó anyag + nettó fuvar + fuvar-ÁFA + teljes bruttó | tiszta függvények |
| `src/content/site.ts` | cég, tartalom, GYIK, lefedettség; újraexportálja a fentieket | — |

A korábbi három kézi árlista (felület, `public/llms.txt`, OG-kártyák) megszűnt:
az `llms.txt` build-time generálódik (`src/app/llms.txt/route.ts`), az
OG-kártyák és minden oldal ugyanebből az adatmodellből renderel.

### Árazási szabályok (kódban kikényszerítve)

- A bruttó anyagárra **soha nem kerül még egyszer ÁFA** — a részösszeg pontosan
  `egységár × m³`.
- A **nettó** fuvardíj **soha nem adódik közvetlenül** a bruttó anyagárhoz
  végösszegként: a teljes bruttó = anyag bruttó + fuvar **bruttó**.
- Ahol nincs jóváhagyott tarifa (ismeretlen irányítószám, profil feletti
  mennyiség, 10 m³ felett, ismeretlen engedélydíj), ott **nincs összeg** —
  `totalGross: null` + indok (`totalBlockedReason`).

## 3. Fuvardíj-modell

- A díj alapja **mindig a konkrét irányítószám**; a kerületválasztás nem
  helyettesíti. Eltérésnél hibaüzenet, **nem** automatikus másik díj.
- Sávhatárok zártak: `≤2`, `>2–5`, `>5–7`, `>7–10` m³ — nincs átfedés, nincs rés.
- Kivételek: I. kerület `≤2 / 2–5 / 5–8`; V. csak `5` m³-ig; VI–VII. `7` m³-ig.
  Felettük egyedi egyeztetés, kitalált ár nélkül.
- Egy fuvarban legfeljebb **10 m³** (korábban 20). Felette többfuvaros ajánlat —
  **nincs** kitalált többfuvaros szorzó.
- Csepel (XXI.) a megadott tarifával **ismét támogatott** (felülírja a V2-es kizárást).
- Diósd, Törökbálint, Tárnok, Sóskút, Pusztazámor: **nincs új tarifa** → egyedi
  egyeztetés. A régi háromzónás díjakat sehol nem alkalmazzuk automatikusan.

## 4. Behajtási engedély / Vár

A fuvardíjak tartalmazzák a behajtási engedélyt; kivétel a Budapest I. kerületi
Vár területe. Az I. kerületnél a kalkulátor rákérdez („Igen / Nem / Nem tudom").
„Igen" és „Nem tudom" (és válasz hiánya) esetén: **nincs garantált végösszeg**,
az ismert tételek és a még nem ismert engedélydíj **külön** jelennek meg.
A Várhoz tartozást **nem** irányítószámból döntjük el.

## 5. Bazalt → Andezit

- A Bazalt kategória megszűnt, helyette **Nógrádkövesdi andezit** (3 frakció).
- `/anyagok/bazalt/` megmaradt: `noindex`, meta-refresh + látható link az
  andezit oldalra (statikus exportban nincs szerveroldali 301). Kimarad a
  sitemapből és az auditokból (átirányító oldal).
- Régi tétel-azonosítók feloldása: `LEGACY_ITEM_SLUGS` — a `?anyag=` deeplinkek
  és a mentett piszkozatok nem vezetnek üres állapotra.
- **Nincs ellenőrzött andezitfotó**, ezért a korábbi bazaltfotót NEM adjuk ki
  andezit hiteles fotójaként: az árlistasoron és a megosztási képen stilizált
  illusztráció áll (`public/anyagok/andezit.svg`), a megosztási kép 5 valódi
  fotót mutat.

## 6. Rendelési igény (e-mail)

| Réteg | Fájl |
| --- | --- |
| Megosztott séma + validáció | `src/lib/order.ts` |
| Keretfüggetlen handler | `src/server/order-handler.ts` |
| Cloudflare Worker adapter | `server/worker.ts` |
| Lokális MOCK backend | `scripts/mock-order-server.mjs` |
| Kliens (timeout, idempotencia) | `src/lib/order-client.ts` |

**Az éles e-mailküldés NINCS aktiválva** — nincs szolgáltatói hozzáférés.
Lokálisan mock módban fut, a UI ezt egyértelműen jelzi („MOCK MÓD — valódi
e-mail NEM ment ki"), és sikeres küldést nem szimulálunk. A valódi
aktiváláshoz szükséges lépések: `server/README.md` (fizetős szolgáltató és
DNS-módosítás **jóváhagyást igényel**).

Biztonság: szerveroldali validáció, **hiteles árújraszámolás** a katalógusból
(a kliens összege csak eltérés-jelzés), IP-alapú rate limit, idempotencia
(dupla beküldés), CR/LF- és vezérlőkarakter-szűrés minden szabad szöveges
mezőn (nincs fejléc-injekció), szolgáltatói hibarészlet nélküli hibaüzenet,
16 KB törzskorlát, személyes adat nem kerül URL-be és logba.

## 7. Térkép és lefedettség

A V2 háromzónás, kiszínezett poligonos térképe megszűnt — találomra rajzolt
irányítószám-határokat nem jelenítünk meg. Helyette:

- **áttekintő lefedettségi térkép** (`LefedettsegTerkep`): csak a kiszolgált
  területek jelölése, tarifás és egyeztetéses megkülönböztetéssel;
- **kereshető irányítószámos díjlista** (`PostalTariffTable`): minden profil a
  SAJÁT sávjaival (az I. kerület 5–8 m³-es sávja így sosem jelenik meg rossz
  sávfelirattal).

Megőrizve: nincs telephelypin, nincs személyes átvétel, OSM-attribúció,
a térkép nem fed a headerre (`isolation: isolate`), mobilon az egyujjas
húzás az oldalé marad.

## 8. Design és motion

Megőrizve: meleg homok/terrakotta/grafit paletta, Space Grotesk display,
mobilon az **egy sorban oldalirányban görgethető hat anyagkupac** (nem lett
belőle magas kártyarács), footerben csak szöveges márkanév.

Új: lépéssávos kalkulátor (fókuszkezeléssel), anyagcsoport-chipek, termék-
változat kártyák mosott-jelöléssel, mennyiség-stepper élő díjsáv-jelzéssel,
szegmentált településválasztó, Vár-kérdés panel, „szelvény" árösszesítő
nettó/ÁFA/bruttó bontással, beküldési állapotok (küldés/siker/mock/hiba/
timeout/rate limit), szerkesztett Rólunk-tördelés pull-quote-tal.

Motion: a meglévő CSS-first rendszer tokenjeiből (`--dur-*`, `--ease-out-soft`),
új library nélkül. Minden a globális `prefers-reduced-motion` szabály alá esik;
a tartalom animáció nélkül is elérhető, nincs mesterséges várakozás, nincs
folyamatos CTA-pulzálás, és hover nélkül is minden működik.

## 9. Javított hibák (nem tartalmi)

- **Hero ténysáv**: `dl > div > div` WCAG 1.3.1 sértés volt → a `<dl>` most
  közvetlenül a dt/dd párokat burkoló `<div>`-eket tartalmazza.
- **Display-címsor**: hosszú magyar összetett szó („anyagválasztáshoz") 360px-en
  40px-es fokozattal túlcsordult. Megoldás: kisebb fokozat a legszűkebb
  kijelzőn + `hyphens: auto` — nem globális overflow-elrejtés, nem olvashatatlan
  zsugorítás.
- **Kalkulátor fókusz**: a lépésváltás fókuszálása rAF-ről effektre került (a
  rejtett panel miatt a böngésző a body-ra ejthette a fókuszt).
- **Audit-szkriptek**: `mobile-layout-audit` és `a11y-export` mostantól
  felismeri a buildbe sütött `basePath`-ot (korábban CSS nélküli oldalt mért
  volna, 113 hamis találattal), és kihagyja a meta-refresh átirányító oldalakat.
- **OG szállítás-kártya**: a kártya saját megnevezése (Budapest / Érd) nem
  jelent meg, csak a dekoratív besorolás.

## 10. Ellenőrzés (2026-10-28)

| Kapu | Eredmény |
| --- | --- |
| `tsc --noEmit` | OK |
| `next lint` | 0 hiba (1 örökölt figyelmeztetés: `Section` `reveal` prop) |
| `tests/pricing.test.mjs` | 170 OK / 0 FAIL |
| `tests/freight.test.mjs` | 3635 OK / 0 FAIL |
| `tests/quote.test.mjs` | 440 OK / 0 FAIL |
| `tests/order.test.mjs` | 132 OK / 0 FAIL |
| Production build + Export QA | 44 HTML, 44 saját OG-kártya, 39 kanonikus = 39 sitemap URL |
| 360px mobil audit | 43/43 route OK |
| axe WCAG A/AA 2.0–2.2 | 43/43 route OK (desktop, mobil, mobilmenü) |
| Böngésző smoke (`v3-smoke`) | 34 OK / 0 FAIL |
| Képernyőképek 360–1440px | 48 kép, 0 vízszintes túlcsordulás |
| `git diff --check` | tiszta |

## 11. Nyitott kérdések

1. **Éles e-mailküldés**: szolgáltató kiválasztása (fizetős → jóváhagyás),
   SPF/DKIM DNS-rekord a `soderarak.hu`-ra (DNS-módosítás → jóváhagyás),
   API-kulcs mint Worker secret.
2. **XXIII. kerület**: csak 1237–1239 szerepel a jóváhagyott listában
   (1231–1236 nem). Szándékos? Feltételezésből nem vettünk fel kódot.
3. **A XI. kerületen kívüli „külön díjprofil"**: csak 1112/1118 kapott eltérő
   tarifát — más kerületben nincs ilyen bontás az ügyfélanyagban.
4. **Diósd/Törökbálint/Tárnok/Sóskút/Pusztazámor**: marad-e az egyedi
   egyeztetés, vagy kapnak saját tarifát?
5. **Andezitfotó**: ha lesz hiteles fotó, bekerülhet a `photo` mezőbe és a
   megosztási képbe.
6. **LocalBusiness `PostalAddress`** (örökölt kérdés a V2-ből): a céges
   (impresszum) cím szerepel a strukturált adatban — maradjon-e.
