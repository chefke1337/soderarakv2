# V2 QA

Állapot: **előzetes**. Ez a fájl a ténylegesen lefuttatott ellenőrzéseket rögzíti, mást nem.

## Lefuttatva
| Ellenőrzés | Eredmény |
|---|---|
| Kiinduló (eredeti) screenshotok, 390/768/1440 px, 6 route | elkészült (a publikált build helyi kiszolgálásával) |
| Vízszintes túlcsordulás, eredeti | nincs (scrollWidth = viewport mindenhol) |
| Eredeti térkép | Leaflet betölt, a poligonok, a jelölő és a skála működik; az OSM csempéket a tesztkörnyezet nem éri el |
| Kontraszt, V2 tokenek (számolva) | ink-soft 7,05:1 papíron / 6,3:1 homokon; brand-dark 4,89:1 papíron; papír a brand-dark gombon 4,89:1 |
| Titokkeresés a commitolandó fájlokban | nincs találat (a docs/metrics-plan.md csak példa GA-azonosítót tartalmaz) |

## Nem futott (blokkolva)
A munkakörnyezet proxyja tiltja a `registry.npmjs.org`-ot (403), ezért az `npm ci` nem futott.
Emiatt **nem futott**: lint, typecheck, production build, V2 screenshotok, axe.
Ezek az első valódi futása a V2 repó GitHub Actions workflow-ja (typecheck + lint + build);
a vizuális QA a kész `gh-pages` buildön következik.

A Lighthouse-pontszámokról nincs állítás.
