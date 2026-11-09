# Üzleti tényjegyzék és adatbekérő lista — soderarak.hu (2026-11-09)

A `CLAUDE.md`/projektutasítás 10. és 19.7. szakasza szerinti önálló
deliverable. Két korábbi hiány pótlása: (1) a jelenleg **élő, publikált**
állítások egy helyen, forrással és ellenőrzési státusszal; (2) a korábbi
auditkörökben (`v3-audit-and-fixes.md` 7. szakasz, `decisions.md`
2026-11-08/11-09 bejegyzések) és a mostani piackutatásban (`market-research.md`
5. szakasz) **szétszórva felhalmozott, tulajdonosi döntést igénylő
kérdések** egy, kereshető listában.

Nem tartalmaz kitalált adatot — ahol a forrás "ügyféladat", az korábbi,
dátumozott session-ben rögzített, jóváhagyott közlés (lásd a hivatkozott
fájlt/sort), nem ebben a körben feltételezett tény.

## 1. Üzleti tényjegyzék — jelenleg élő, publikált állítások

| Állítás | Forrás | Ellenőrzés | Felhasználható oldalak | Szükséges megerősítés |
|---|---|---|---|---|
| Üzemeltető: Újhegyi Lajosné E.V. | `src/content/site.ts:60`, ügyféladat 2026-11-03 | B (forráskód) | Impresszum, LocalBusiness JSON-LD | — (nincs nyitott kérdés) |
| Székhely: 1224 Budapest, Báthori utca 9. — **kizárólag üzemeltetői/adatkezelői cím, NEM telephely/depó** | `site.ts:72-80`, ügyféladat 2026-11-03; a kommentár explicit tiltja térképre tételét/átvételi pontként feltüntetését | B | Impresszum, LocalBusiness JSON-LD (NEM a térkép) | — |
| Adószám 61008203-2-43, EV-nyilvántartási szám 4868853 | `site.ts:82-85` | B | Impresszum | — |
| Telefon +36 30 852 8909 | `site.ts:67-70` | B | Minden oldal (fejléc, hívógombok) | — |
| E-mail `info@soderarak.hu` (általános) | `site.ts:71` | B | Impresszum, kapcsolat | **Lásd 2. szakasz** — a rendelési űrlap címzettje egy párhuzamos session (2026-11-09, `origin/v3`@`9e64716`) szerint már `rendeles@soderarak.hu`-ra változott; ezt a `v3-audit` ág még nem tartalmazza, kereszt-ellenőrzés szükséges merge előtt |
| Telefonos elérhetőség: H–P 07:00–16:00 — **ez nem nyitvatartás/ügyfélfogadás, és nem korlátozza az egyeztetett kiszállítási időt** | `site.ts:86-98`, ügyféladat 2026-11-03 | B | Impresszum, LocalBusiness `openingHours`, kapcsolat | — |
| Minimum rendelés 1 m³, egy fuvarban legfeljebb 10 m³ | `src/content/freight.ts:20,22` | B (+ `tests/freight`, `tests/quote`) | Kalkulátor, árlisták, kerületi oldalak, GYIK | — |
| "Budafok környékén gyakran még aznap" szállítás — **feltételes, nem garancia** | `site.ts:136-140` (HERO), jóváhagyva 2026-10-27 | B | Főoldal | — |
| "Több mint 15 év tapasztalat" | `site.ts:119` | D (ügyféladat) — **nincs harmadik féltől független igazolás** | Főoldal (Miért mi lista) | Ha a piackutatásban látott versenytárs-állítások (Sóderház "20+ év", Pap Ádám "30+ év") miatt felmerül frissítés igénye, csak valós, ellenőrzött évszám alapján módosítható |
| 23/23 budapesti kerülethez + Érdhez van kiszállítás, 25 díjprofil, irányítószám-pontos fuvardíj | `freight.ts`, `districts.ts`; korábbi audit: `tests/districts` 117 teszt, `tests/area-pages` 83 teszt | B + C (automatizált teszt) | `/teruletek`, `/szallitas`, kalkulátor | — |
**Ez a sor javítva 2026-11-09-én, lásd `decisions.md`** — két, korábban itt hibásan összemosott, külön tény: (a) a XI. kerületnek **két automata díjprofilja** van (`freight.ts:161-173`): az alap (1111, 1113–1117, 1119) és az 1112/1118 (eltérő, magasabb sávokkal, pl. 10 m³: 60 000 Ft nettó az alap 50 000 Ft-jával szemben) — **mindkettő automatizált ár, nincs egyeztetés**. (b) A Vár-kivétel az **I. kerülethez** tartozik (`CASTLE_DISTRICT_ID = 1`, `freight.ts:85,378-382`): ha a cím a Vár területén van, **nincs automata ár**, a kalkulátor egyedi egyeztetést kér. | `freight.ts:85,161-173,378-382`; korábbi audit smoke-teszt | B + C | Kalkulátor, I. kerületi oldal (Vár-GYIK), XI. kerületi oldal (1112/1118 profil) | — |
| Minden anyagár BRUTTÓ (ÁFÁ-val), a fuvar díja külön, NETTÓ | `catalog.ts:1-28` (`DISCLOSURE_GROSS`, `DISCLOSURE_FREIGHT`) | B | Minden árlista, kalkulátor | — |
| Mosott-jelölés: rostált sóderfrakciók + osztályozott kavicsok mosottak; töltősóder NEM mosott; kulé egyszer mosott; föld/murva/andezit/homok nincs jelölve | `catalog.ts:41-69`, ügyféladat 2026-11-02 | B | Katalógus, árlisták | — |
| Nincs telephely/depó/átvételi pont a nyilvános oldalon | Korábbi audit (B-1 hiba javítva, `tests/area-pages`) | B + C | Teljes oldal | — |
| GA4 nincs aktiválva | `CLAUDE.md` "Inherited constraints" szakasz | D | — | A megbízó még nem adott valós `G-` Measurement ID-t; amíg nincs, **nem aktiválandó** |

## 2. Adatbekérő lista — tulajdonosi döntést/adatot igénylő, nyitott kérdések

Ezek **nem hibák**, hanem olyan pontok, ahol a helyes tartalom/döntés a
megbízó kezében van. Korábbi auditkörökből összegyűjtve + a 2026-11-09-i
piackutatás új kérdéseivel bővítve.

| # | Kérdés | Eredet | Miért fontos | Jelenlegi átmeneti állapot |
|---|---|---|---|---|
| 1 | Indexelés élesítése (`noindex` levétele) | `v3-audit-and-fixes.md` 5. szakasz, minden audit megerősítette | A 2026-11-09-i piackutatás most elsőként igazolta **SERP-szinten**: a soderarak.hu két mintakeresésben sem jelent meg, miközben 7+ versenytárs/klaszter aktívan foglalja a helyet | Marad `noindex, follow`, amíg jóváhagyás nincs |
| 2 | A `rendeles@soderarak.hu` postafiók éles rendelés-fogadásra szolgál-e, és a `v3-audit` ág szinkronizálható-e ezzel | `decisions.md` 2026-11-09 18:49 bejegyzés (párhuzamos session commitja, `origin/v3`@`9e64716`) | A `v3-audit` ág jelenleg 1 valódi kódcommittal lemaradva áll; amíg nem szinkronizált, a rendelési cím két ágon eltér | `v3-audit`-on még `info@soderarak.hu` az `order-handler` címzettje |
| 3 | Vállal-e a cég bármilyen árgarancia vagy aznapi szállítás ígéretet (mint a Sóder Express-klaszter) | `market-research.md` 5.5. pont | Ha van valós alap, bizonyítottan hatásos bizalmi elem a piacon; ha nincs, **nem állítható** | Nincs ilyen állítás a `MIERT_HIVJON` szövegben — marad így, amíg nincs jóváhagyott válasz |
| 4 | Van-e valós, igazolható ügyfélszám/referencia/tesztimónium | `market-research.md` 5.5. és 4. mátrix (Sóderház "1037 elégedett ügyfél" — versenytárs saját, nem igazolt állítása, de a piacon látottan hatásos elem) | Jelenleg a soderarak.hu-n nincs ilyen elem; csak valós adat alapján vehető fel | Nincs tesztimónium/számadat a főoldalon |
| 5 | XXIII. kerület — csak 1237–1239 irányítószámra van tarifa; a többi 1230-as sávra kell-e bővíteni | `v3-audit-and-fixes.md` 7. szakasz ("Ügyfélkérdések") | Hiányzó tarifánál a kalkulátor szándékosan NEM mutat 0 Ft-ot — ez helyes védelem, de szűkebb lefedettséget is jelent | A nem lefedett irányítószámokon a kalkulátor egyedi egyeztetést kér |
| 6 | Diósd, Törökbálint, Tárnok, Sóskút, Pusztazámor — nincs jóváhagyott tarifa | `v3-audit-and-fixes.md` 7. szakasz | A piackutatásban látott versenytárs-klaszterek (Ambrus-klaszter, Kovács Kálmán-klaszter) **ezekre a településekre is hirdetnek** szolgáltatást — nyitott kérdés, hogy valós, kiszolgálható terület-e | Nincs automata ár ezekre; kalkulátor egyedi egyeztetést kér |
| 7 | Andezit-fotó hiányzik (jelenleg stilizált illusztráció) | `v3-audit-and-fixes.md` 7. szakasz, `catalog.ts:318-320` komment | A régi bazaltfotó szándékosan NEM lett átnevezve andezit-fotóvá (adat-integritás) | Stilizált illusztráció látható az andezit csoportnál |
| 8 | next@16 major frissítés (a bundle-ölt postcss biztonsági javításához) | `decisions.md` 2026-11-08 (folytatás 2) bejegyzés | Valódi breaking change, külön jóváhagyást igényel; jelenlegi kockázat csökkentett (statikus export, nincs Next-szerver élesben), de nem nulla | `next` a jelenlegi major verzión, patch-bump (15.5.29) megtörtént |
| 9 | H-1: időszakos React #418 hidratációs hiba | `decisions.md`, több kör óta nyitott, 2026-11-08-án először reprodukálva (2 előfordulás 20 route-seprésből) | Látható hatás nincs, de megerősített, nem csak feltételezett hiba | Regresszióteszt WARN-ként kezeli, nem blokkoló |
| 10 | "Saját flotta Budafokról" (Rólunk OG-kép) / "Budafokról és környékéről indulunk" (útmutató) szövegek jóváhagyása | `v3-audit-and-fixes.md` 7. szakasz | Nem telephely-állítás, de a "nincs telephely" döntés fényében érdemes külön jóváhagyatni | Változatlanul él a szövegben |

**Nyitva maradt ebben a körben is:** a 2–10. tételek egyike sem technikai
hiba — mindegyik tulajdonosi adat vagy döntés hiánya. Az implementáció
ezek megválaszolása **előtt** nem léphet tovább bennük kitalált adattal
(a `CLAUDE.md` és a megbízás 3. szakasza ezt kifejezetten tiltja).
