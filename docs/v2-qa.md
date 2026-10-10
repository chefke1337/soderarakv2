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
