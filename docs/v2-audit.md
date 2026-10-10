# V2 audit — Sóder Árak

Kiinduló verzió: `chefke1337/soderarak-website@345de89` (a publikus
`chefke1337.github.io/soderarak/` forrása — lásd `docs/v2-implementation-plan.md` §0).
Ellenőrzés: a publikált build (`chefke1337/soderarak@fc925bd`) helyi kiszolgálása
`/soderarak/` útvonalon, Playwright Chromium, 390 / 768 / 1440 px.

## Globális (layout, tokenek)

| # | Hol | Megállapítás | Súly |
|---|---|---|---|
| G1 | `globals.css` `.aurora`, hero + záró CTA | Elmosott, lebegő fényfoltok (animált blob) a két legnagyobb felületen. A zöldet már lecserélték melegre, de maga a mintázat generikus és a tartalomtól vonja el a figyelmet. | közepes |
| G2 | `globals.css` `.glow-ring` (hero, záró CTA, mobil hívássáv) | Forgó konikus szegély a hívógomb körül: harsány, folyamatosan mozog, eddig két hibát is javítani kellett benne. | közepes |
| G3 | `Section.tsx` kicker | Minden szekció fölött nagybetűs, ritkított „ANYAGAINK / ÁRLISTA / GYIK” címke + vonal → sablonos ritmus, minden szekció egyforma. | közepes |
| G4 | `Section.tsx` | Egyetlen szekcióminta (kicker–cím–lead–tartalom) minden blokkra; a papír/homok váltakozás az egyetlen ritmuseszköz. | közepes |
| G5 | `.reveal`, `.reveal-l/r`, `.sheen`, `.marquee` | Sok, egymástól független mozgás (beúszás minden szekcióban, csillanás, futószalag). Egyik sem szolgál információt. | alacsony |
| G6 | `package.json` | `framer-motion` függőség, de a `src/` egyetlen fájlja sem importálja. | alacsony |
| G7 | `.cv-auto` | `content-visibility: auto` → teljes oldalas screenshoton/nyomtatásban üres sávok. Valós böngészésben jó, de a QA-t félrevezeti. | info |

## Főoldal (`/`, `src/app/page.tsx`)

| # | Megállapítás |
|---|---|
| H1 | A márkanév „Sóder **Árak**”, de az első képernyőn egyetlen ár sincs — az árak csak a 3. szekcióban jelennek meg. |
| H2 | A hero sötét, a fő üzenetet egy aláhúzott szó („szállítása”) és egy aláhúzott település-lista viszi — mindkettő linknek látszik, pedig nem az. |
| H3 | Ugyanaz a 6 anyagcsoport háromszor ismétlődik egymás után: hero-chipek → 3×2 kártyarács → ár-accordion. |
| H4 | A ténysáv (15+ / 4–23 m³ / 15 / 20) után a település-futószalag és a 3 USP-kártya ugyanazt mondja még egyszer (aznap, 4–23 m³, saját autó). |
| H5 | A „Miért mi” szekció a település-chipeket ismétli, amelyek a „Hol szállítunk” blokkban újra megjelennek. |
| H6 | Zónák: három azonos kártya, a fuvarár-sáv apró (12 px) narancs szöveg — a döntéshez legfontosabb szám a legkisebb. |
| H7 | Útmutató-sáv: chipek, amelyek közül egy narancs „pill” — negyedik CTA-stílus az oldalon. |
| H8 | Záró CTA: harmadszor ugyanaz a telefon + kalkulátor gombpár, sötét háttér + fényfoltok. |

## Árkalkulátor (`/arkalkulator`, `ArkalkulatorForm.tsx`)

| # | Megállapítás |
|---|---|
| K1 | Desktopon a bal oszlop alja ~200 px üres (3 select, a jobb oszlop jóval magasabb). |
| K2 | A mennyiség 8 opciós `<select>` — mobilon két tappal több, mint egy szegmentált választó. |
| K3 | Nem lehet anyagra előre kitöltve érkezni (pl. az árlistáról) — mindig a 0/24-es sóder az alap. |
| K4 | A település kiválasztásakor nem látszik, melyik zónába esik és mennyi a fuvar, csak a jobb oldali összegzésben. |
| K5 | Hiba/siker állapotok rendben vannak (validáció, mailto-nyitás, másolás, hívás-fallback) — megtartandók. |

## Kapcsolat + térkép (`/kapcsolat`, `ZonaTerkep*.tsx`)

| # | Megállapítás |
|---|---|
| C1 | A térkép ténylegesen betölt (Leaflet, 3 zónapoligon, telephely-jelölő, skála, jelmagyarázat). A teszt-környezetből az OSM csempék nem érhetők el, ezért a háttér szürke — a poligonok és a vezérlők működnek. |
| C2 | A hibaállapot („A térkép nem tölthető be…”) azt mondja, hogy „a zónák listája lent olvasható”, de a kapcsolat oldalon alatta csak a település-chipek vannak, zónák nélkül. |
| C3 | A jobb oszlop három egyforma kártya; a telefonszám és a „Hívás most” gomb kétszer ugyanazt teszi. |
| C4 | „Ajánlatkérés űrlapja” gomb az árkalkulátorra visz — a felirat nem mondja meg, hova. |

## Árak, anyagok, szállítás

| # | Hol | Megállapítás |
|---|---|---|
| A1 | `/arak` | 6 különálló táblázat, kártyában, egyforma árnyékkal; a fuvar-zónák kártyarácsa ugyanaz a minta. |
| A2 | `/anyagok/[anyag]` GYIK | „nettó 13 000 Ft **Ft**/m³-től” — a `formatFt` már tartalmazza a „Ft”-t. **Hiba.** |
| A3 | `/anyagok/[anyag]` GYIK | „Szállítanak murva**ot** / föld**ot**…” — a toldalék vakon `ot`. **Nyelvtani hiba** (murvát, földet). |
| A4 | `site.ts` FAQ | „fu**w**art”, „környék**e**ben” elírások. |
| A5 | `/szallitas` | Az autótípusok kártyái rendben; a szekcióminta ugyanaz, mint minden más oldalon. |

## Navigáció és footer

| # | Megállapítás |
|---|---|
| N1 | Fejléc: felső fekete sáv + fejléc + gradiens vonal — három réteg, 76 px + 28 px; a telefonszám kétszer látszik desktopon. |
| N2 | A publikált fejlécben nincs logóikon, csak a kétsoros „SÓDER / ÁRAK” szövegblokk. A V2 ezt a lockupot változatlanul, egy egységként tartja meg. |
| N3 | Footer: az „Útmutatók” oszlop 12 linkje miatt a footer magasabb, mint a kapcsolat oldal tartalma. |
| N4 | Mobil hívássáv: mindig látható, forgó szegéllyel — a sáv maga jó, az animáció felesleges. |

## Mobil (390 px)

- A hero 2 teljes képernyő magas: a hívógomb az első képernyőn van, de az anyagchipek és a disclosure kitolják a tartalmat.
- A ténysáv 2×2 középre zárt rácsa után a USP-k balra zártak — igazítás-váltás.
- Nincs vízszintes túlcsordulás egyik vizsgált oldalon sem (scrollWidth = viewport).

## Ami jó és marad

- Egyetlen adatforrás (`src/content/site.ts`) — árak, zónák, telefon, cím.
- Statikus export, minimális kliens-JS, lusta térkép error boundaryvel.
- Telefon-első konverzió, `data-call-region` mérési pontok.
- Kalkulátor: piszkozatmentés, validáció, mailto + másolás + hívás fallback.
- Jogi oldalak, strukturált adatok (LocalBusiness, OfferCatalog, FAQ, breadcrumb).
