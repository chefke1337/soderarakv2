# V2 QA

Ez a fájl csak a ténylegesen lefuttatott ellenőrzéseket rögzíti.

## CI (GitHub Actions, `deploy-v2-pages.yml`, `main`)
| Lépés | Eredmény |
|---|---|
| `npm ci` | ✅ |
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ |
| `next build` + `scripts/prepare-static-export.mjs` (basePath `/soderarakv2`) | ✅ — 45 HTML-oldal, 45 saját OG-kép (1200×630), 41 kanonikus URL = 41 sitemap URL |
| OG pixel-regresszió (`og-hash`, csak jelentés) | Az utolsó futáson ✅. Egy korábbi futás a `/anyagok/bazalt/` kártyán eltérést jelzett; a kártya adatai a V2-ben nem változtak, ezért valószínűleg a runner fontkörnyezete okozta. Megfigyelendő. |
| Publikálás a saját `gh-pages` branchre | ✅ |

## Vizuális ellenőrzés (a `gh-pages` build helyi kiszolgálása `/soderarakv2/` alatt, Playwright Chromium)
- Screenshotok 390 / 768 / 1440 px-en: `/`, `/arkalkulator/`, `/kapcsolat/`, `/arak/`, `/anyagok/`, `/szallitas/`, összevetve az eredeti oldal ugyanazon képeivel.
- Vízszintes túlcsordulás: nincs (scrollWidth = viewport mindenhol).
- Javítva a vizsgálat után: telefonszám-sortörés a desktop fejlécben, dupla pont a zóna-feliratban, a footer útmutató-listájának térközei.

## Funkcionális teszt (18/18 ✅)
- A kalkulátor `?anyag=` előtöltése működik. A számítás egyezik az eredeti szabályokkal: 8 m³ Sóder 0/24 Budafokra = 132 000 Ft anyag + 12–22e fuvar → 144 000 – 154 000 Ft.
- Mennyiségváltás, zóna-visszajelzés (Érd → Közeli, 18 000 Ft), validációs hibaállapotok, bazalt → „egyeztetés után”.
- Az anyaglista lenyílik; a kalkulátor-link basePath-szal és `anyag=` paraméterrel működik; az anyagválasztó vált.
- A mobilmenü nyílik. A mobil hívássáv látszik, a `/kapcsolat` oldalon rejtve van.
- A térkép (Leaflet) ténylegesen renderel: 3+ zónapoligon és a telephely-jelölő. Az OSM-csempéket a tesztkörnyezet nem éri el.
- A főoldal mind az 59 belső linkje 200-at ad. Futásidejű JS-hiba nincs.
- **Javított hiba:** a mobilmenü és a cookie-banner sima `<a>` linkjei nem kapták meg a basePath-ot, ezért 404-re vittek. Ugyanez a hiba **az eredeti `/soderarak/` oldalon is megvan**.

## Nem futott
- axe / Lighthouse: az npm-regiszter ebből a környezetből tiltott, a helyi axe-core nem telepíthető. Pontszámokról nincs állítás.
- A publikus `https://chefke1337.github.io/soderarakv2/` URL ebből a környezetből nem érhető el (proxy). A Pages bekapcsolását a repó tulajdonosának kell elvégeznie (Settings → Pages → Branch: `gh-pages` / root).

## 2026-10-10 — Térkép (Újbuda) és mobil/tablet kör

**Újbuda hiba oka.** A `site.ts` szerint Újbuda (XI.) a `mag` zóna tagja (a zóna
leírása: „Budapest XXII. és XI. kerület vonala”), a kalkulátor is így számol. A
`mag` körvonala viszont északon 47,455°-nál véget ért, ezért a XI. kerület és
Újbuda markerpontja (47,470°, 19,048°) kívül esett. Az új teszt szerint ugyanez
történt **Nagytétény** (XXII., 47,3975°) déli pontjával is.

**Javítás.** A `mag` tájékoztató sáv északra a Duna budai partja mentén (XI.
kerület), délen Nagytétényig bővült (`src/content/site.ts`). Ez nem
közigazgatási határ: ellenőrizhető határadat ebből a környezetből nem volt
elérhető, ezért kerülethatárt nem rajzoltunk. A sáv a Dunán nem nyúlik át, és
más zóna egyetlen települése sem került bele. Markert és díjat nem módosítottunk.

**Teszt.** `npm run test:zones` (Node ≥ 22.6): minden település a saját zónáján
belül van, nincs önmetszés. Egy ismert eltérés maradt, **Halásztelek**:
`tavolabbi` besorolás, de a pontja a `kozel` körvonalán belül van. Ügyféldöntésre vár.

**Reszponzív audit** (a gh-pages build Playwright Chromiumon; ≤1100 px érintéses
kontextus, reduced-motion). Viewportok: 360×780, 390×844, 430×932, 768×1024,
1024×768, 1440×900, 844×390 (fekvő). Route-ok: `/`, `/arkalkulator/`, `/arak/`,
`/anyagok/`, `/anyagok/soder/`, `/kapcsolat/`, `/szallitas/`, `/teruletek/`,
`/teruletek/erd/`, `/utmutatok/`, `/utmutatok/mennyi-soder-kell/`, `/rolunk/`.
- Oldalszintű vízszintes túlcsordulás: nincs, egyik méreten sem.
- Javítva: a zónatáblázatok (`/arak`, `/szallitas`) mobilon görgetés helyett
  egymás alá rendezett sorok; a település- és útmutató-aloldalak 17–20 px magas
  linkjei most 44 px-es érintési célok.
