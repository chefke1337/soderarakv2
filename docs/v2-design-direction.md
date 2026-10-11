# V2 design direction

## A két irány

### A) „Mérlegjegy” — pontos, árközpontú, világos  ✅ választott
A Sóder Árak vásárlója egy kérdéssel érkezik: *mennyibe kerül, és mikor hozzák?*
Az oldal úgy viselkedik, mint egy jól megírt telepi árjegyzék vagy mérlegjegy:
világos homok/törtfehér felületek, grafit szöveg, táblázatos számok, a frakciók
(0/4, 0/8, 16/32 mm…) **mm-skálán** ábrázolva. Az égett narancs kizárólag cselekvést
(hívás, kalkulátor) és árat jelöl. A „wow” egyetlen helyen van: a hero jobb
oldalán álló **árjegyzék-szelvény**, amely az első képernyőn mutatja meg mind
a hat anyagcsoport induló nettó árát és a fuvarsávot.

### B) „Depó” — sötét, anyagfotós, hangulati
Mély földszínű/bazalt felületek, nagy anyag-közeli fotók, rakás-sziluettek.
**Elvetve**, mert: (1) nincs valódi fotóanyag, kitalálni/stockolni pedig nem
akarunk; (2) a brief kifejezetten világos bézs/törtfehér alapot és visszafogott
akcentust kér; (3) a sötét, nagy felületek pont a korábban kifogásolt „domináns
háttér” problémát ismételnék meg.

## Miért az A
- A márkanév ígérete (árak) az első képernyőn teljesül.
- Valós adatból épül (site.ts árak, frakciók, zónák) — nincs dekoráció tartalom helyett.
- Telefon-első marad: egy elsődleges CTA (hívás), egy másodlagos (kalkulátor).

## Tokenek (`src/app/globals.css` `@theme`)

| token | hex | szerep |
|---|---|---|
| `paper` | `#fbf8f2` | törtfehér alap |
| `sand` | `#f3ebdc` | világos bézs szekció |
| `sand-deep` | `#e6d8bd` | meleg homok: skála-sáv, kiemelt mező |
| `line` | `#ddcfb4` | hajszálvonalak |
| `ink` | `#24211d` | grafit szöveg |
| `ink-soft` | `#5b544a` | másodlagos szöveg (AA papíron és homokon) |
| `brand-dark` | `#c2410c` | égett narancs — CTA, ár, logó „ÁRAK” (változatlan) |
| `brand-deep` | `#9a3412` | hover / link |
| `brand` | `#f97316` | csak apró jelölők (pötty, fókusz-sáv) — soha nagy felület |
| `clay` | `#b4532f` | frakció-sáv kitöltése |
| `dust` | `#d9b77a` | amber por — szemcse-textúra pöttyei |
| `basalt` | `#211d19` | footer |
| `petrol` | `#0f766e` | csak a Buda Konténer testvér-hivatkozás (funkcionális) |

Zöld nagy felületen nincs. A korábbi aurora/glow, a forgó szegély, a
futószalag és a csillanás megszűnik.

## Tipográfia
- **Space Grotesk** (display, 500/700) — megtartva: a szerif display-t a
  megrendelő korábban elutasította. Szoros (-0.02em) követés nagy méretben.
- **Inter** (szöveg, 400–600), `tabular-nums` minden árnál és mennyiségnél.
- Skála: 13 · 15 · 17 · 20 · 26 · 34 · 46 · 60 px (desktop H1 = 60, mobil 38).
- Szekciócímkék mondatkezdő kisbetűvel, nem csupa nagybetűvel.

## Elrendezés
12 hasábos rács, max. 1200 px, balra zárt. A szekciók nem egy sablonból jönnek:
```
HERO (paper + finom szemcse)
┌──────────────────────────────┬─────────────────────┐
│ Budafok, XXII. ker. · H–P 7–17│  ÁRJEGYZÉK-SZELVÉNY │
│ H1 Sóder, homok, kavics…      │  Sóder    13 000 Ft │
│ lead                          │  Homok    13 300 Ft │
│ [ Hívás ]  [ Árkalkulátor ]   │  …                  │
│ disclosure                    │  Fuvar 12–45 e Ft   │
└──────────────────────────────┴─────────────────────┘
TÉNYSOR  4–23 m³ │ gyakran aznap │ 15 település │ saját depó
ANYAGOK + ÁRLISTA (egy blokk, nem három)
  sor: [textúra] Név · rövid leírás · frakció-skála ▬▬▬ · már X Ft  [+]
       └ lenyitva: tételtábla, mm-skálával, „Kalkulátorban” link
MIRE KELL?  (feladat → anyag választó, a meglévő GYIK-tartalomból)
RENDELÉS 1–4 (valódi sorrend → számozás indokolt)
HOL SZÁLLÍTUNK  sematikus zóna-gyűrűk SVG + 3 zóna táblázatsor
BUDA KONTÉNER sáv (keskeny) · ÚTMUTATÓK · GYIK
ZÁRÓ HÍVÁS (homok panel, nem sötét)
FOOTER (basalt)
```
Mobil: hero → CTA-k → szelvény; a szelvény teljes szélességű, a frakció-skála a
sor alá törik.

## Mozgás
Egyetlen szervezett pillanat: a hero betöltésekor a szelvény sorai sorban
„nyomtatódnak” (opacity + 6 px). Minden más mozgás válasz a felhasználóra
(lenyitás, hover, fókusz). `prefers-reduced-motion` alatt nincs animáció.

## Állapotok
- Hover: hajszálvonal → `ink` szín, háttér `sand`.
- Fókusz: 2 px `brand-dark` outline + 2 px offset, mindenhol.
- Térkép betöltés: homok helyfoglaló a végleges magassággal; hiba: üzenet + a zónák listája.
- Kalkulátor: validációs hibák mezőnként + összesítő, siker/hiba blokk megmarad.
- „Egyeztetés után” ár (bazalt): üres skála-sáv helyett szöveges jelölés.

## V2.1 „Rétegrend" (2026-10-10, ügyfél-visszajelzés: „túl sok a fehér")
- **Felületritmus, szemantikus tokenekkel** (`globals.css`): page (meleg homok) · surface (törtfehér, csak űrlap/sűrű info) · surface-muted (mély homok) · surface-accent (égett terrakotta) · surface-dark (meleg sötétbarna) · text / text-muted · border · accent · focus, valamint hat anyagszín.
- **Főoldal sorrendje:** sötét hero + homok ténysor → anyaglista (homok, törtfehér anyag-kártyák) → terrakotta kalkulátor-belépő → sötét anyagválasztó → rendelési útvonal → mély homok zónák → miért mi → Buda Konténer (törtfehér) → GYIK (mély homok) → sötét záró hívás + footer rétegcsíkkal.
- **Egyedi komponensek:** `MaterialStrata` (hero anyag-rétegrend, SVG szemcsetextúra, árak a site.ts-ből), `MaterialGrain`, `CalculatorEntry` (a GYIK meglévő példáját ugyanazzal a képlettel számolja), `OrderRoute` (görgetésre haladó teherautó), `MobileMenu` (animált nyitás/zárás, Esc, kattintás kívül).
- **Motion:** hero egyszeri belépője + rétegek beúszása; gombok hover/pressed; anyagminta-nagyítás; menüátmenet; anyagválasztó- és összegváltás. Mind CSS, `prefers-reduced-motion` alatt kikapcsol; nincs folyamatos animáció.
- **Assetigény:** valódi anyagfotók (depó, rakások, közeli szemcse) — amíg nincsenek, a textúra SVG-ből generált, és nem ad ki magát fotónak.

## V2.3 design polish (2026-10-11)
- **Motion tokenek** (`globals.css @theme`): `--dur-fast` 140 ms (hover/lenyomás), `--dur-ui` 240 ms (menü, ikon, tartalomcsere), `--dur-enter` 560 ms (egyszeri belépők), `--stagger` 55 ms, `--move-sm/md` 8/14 px, közös `--ease-out-soft`. Minden meglévő animáció és Tailwind `duration-*` erre hivatkozik.
- **Gombok:** kettős fókuszgyűrű (világos és sötét felületen is látszik), gyors lenyomás-visszajelzés, a nyíl fókuszra is elmozdul.
- **Térkép:** méretváltozáskor újraillesztés (ResizeObserver), amíg a felhasználó maga nem mozgatta; a főoldalon nincs duplikált jelmagyarázat (a zónalista mellette van).
- **Rendelés menete:** egységes terrakotta számjelek, szorosabb ritmus, lépésenként diszkrét belépés.
- **Mobilmenü:** az X-ikon transformmal animál; nyitáskor a fókusz az első menüpontra kerül.
