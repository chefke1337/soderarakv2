# V2 implementation plan

## 0. Eredet és elkülönítés

| | |
|---|---|
| Eredeti publikus oldal | https://chefke1337.github.io/soderarak/ |
| Eredeti build repo | `chefke1337/soderarak` (csak statikus kimenet, `main` @ `fc925bd`) |
| Eredeti forrás repo | `chefke1337/soderarak-website` (privát) |
| **Kiinduló commit** | `345de89d2d37e10143336d370e6797bb638d83ae` (`chore/soderarak-github-pages-20261004-1021`) |
| Forrásverzió ellenőrzése | A publikus build legutóbbi deploy commitjának üzenete: `Deploy chefke1337/soderarak-website@345de89…` (2026-10-10 06:08 UTC); a `345de89` a forrásrepó azon branchének HEAD-je, amelyet a `deploy-soderarak-pages.yml` workflow figyel. Bájtszintű build-összevetés nem készült. |
| V2 munkamappa | `soderarakv2/` (külön mappa, saját `git init`, az eredeti `.git` nélkül) |
| V2 cél repo | `chefke1337/soderarakv2` |
| V2 publikus cél | https://chefke1337.github.io/soderarakv2/ |

Kimaradt a másolásból: `.git`, mindkét eredeti deploy workflow (`deploy-pages.yml`,
`deploy-soderarak-pages.yml` — ezek az eredeti repókra pusholnának), `.freebuff/`,
`og-gallery.html`, `.lh-*.json`, `.logo-compare.html`, `.server.log`,
`tsconfig.tsbuildinfo`, `node_modules`, `.next`, `out`. Titok/`.env` nem volt a commitban
(`.env.example` üres értékekkel megmaradt).

## 1. Technikai alap
- `next.config.ts`: `GH_PAGES_BASE_PATH` env → basePath/assetPrefix (a meglévő mechanizmus).
- V2 workflow: `.github/workflows/deploy-v2-pages.yml` — trigger `main`, build
  `GH_PAGES_BASE_PATH=/soderarakv2`, `NEXT_PUBLIC_SITE_URL=https://chefke1337.github.io/soderarakv2`,
  közzététel a **saját** repó `gh-pages` branchére `GITHUB_TOKEN`-nel (nincs deploy key, nincs külső repo); Pages forrás: `gh-pages` / root.
- `company.site.url` → `NEXT_PUBLIC_SITE_URL` env, alapértéke a V2 cél. Abszolút URL-ek
  (canonical, OG, sitemap, JSON-LD) egy `absoluteUrl()` helperrel, hogy a `/soderarakv2`
  útvonal-előtag ne vesszen el.
- **noindex**: `robots: { index: false, follow: true }` a root metadata-ban; a `robots.txt`
  nem tilt (különben a keresők nem látnák a noindexet).
- Nincs custom domain (`CNAME` nincs a repóban).

## 2. Design rendszer
`globals.css` tokenek a `v2-design-direction.md` szerint; aurora/glow-ring/marquee/sheen/
reveal törlése; egy hero-betöltési animáció.

## 3. Komponensek
| fájl | változás |
|---|---|
| `Header.tsx` | egyrétegű fejléc, lockup változatlan, fókusz/hover állapotok |
| `Section.tsx` | mondatkezdő címke, két szekcióváltozat, nincs reveal |
| `PriceSlip.tsx` (új) | hero árjegyzék-szelvény |
| `FractionScale.tsx` (új) | mm-skála sáv (szerveroldali SVG/CSS) |
| `MaterialLedger.tsx` (új) | anyag + árlista egy blokkban (`<details>`, JS nélkül) |
| `UseCasePicker.tsx` (új, kliens) | „Mire kell?” feladat → anyag, a GYIK meglévő tartalmából |
| `ZoneRings.tsx` (új) | sematikus zónagyűrűk SVG |
| `ArkalkulatorForm.tsx` | logika változatlan; mennyiség szegmentált rádiókkal, zóna-visszajelzés, `?anyag=` előtöltés |
| `Footer.tsx`, `MobileCallBar.tsx` | V2 tokenek, forgó szegély nélkül |

## 4. Oldalak
Főoldal teljes újrakomponálás; `/arak`, `/anyagok`, `/anyagok/[anyag]`, `/kapcsolat`,
`/szallitas`, `/arkalkulator` célzott átdolgozás; a többi a megosztott komponensektől
kapja az új megjelenést.

## 5. Függőségek
Új dependency **nincs**. A Motion/Framer Motion nem kell: az egyetlen animáció CSS.
A Radix nem kell: a lenyitható elemek natív `<details>`, a választó natív rádiócsoport.

## 6. Ellenőrzés
`npm run lint`, `npm run typecheck`, `npm run build` (basePath-tal és anélkül),
`git diff --check`, Playwright screenshotok 390/768/1440-en eredeti ↔ V2, axe a meglévő
`scripts/a11y-export.mjs`-sel, térkép működés böngészőben.
