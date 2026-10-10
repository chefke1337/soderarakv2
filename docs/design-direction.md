# Frissített design irány

Dátum: 2026-10-04. Ez **nem** egy teljes palettacsere (az a `src/app/globals.css`-ben
rögzített paper/ink/brand/petrol/moss/basalt rendszer korábban már lezajlott,
és érvényben marad) — ez a főoldal két nagy, domináns sötét szekciójának
(hero teteje, záró CTA alja) dekoratív háttér-glow-jaiban a zöld (petrol/moss)
túlsúlyának célzott, kis felületű csökkentése egy meleg homok/terrakotta/amber
irányba, a felhasználó kifejezett kérésére.

## Koncepció

A domináns dekoratív hátterek épületanyaghoz illő, meleg földszíneket
kapjanak (homok, terrakotta, amber) a hideg zöld/teal helyett — a narancs
márkaszín és a petrol/moss funkcionális/másodlagos szerepe változatlan marad.

## Hangulat

- Megbízható
- Földközeli
- Professzionális
- Modern
- Jól olvasható
- Ipari / építőanyaghoz illő
- Nem túl rusztikus
- Nem rikító

## Színstratégia

- **Meglévő elsődleges márkaszín:** `--color-brand` `#f97316` (élénk narancs,
  nagy felület/akcent), `--color-brand-dark` `#c2410c` (szöveg/gomb),
  `--color-brand-deep` `#9a3412` (hover), `--color-brand-soft` `#ffedd5`.
  **Változatlan** — a logó és a CTA-k állapotjelzése nem módosult.
- **Háttér alap:** `--color-paper` `#faf6ef` (világos szekciók),
  `--color-basalt` `#1a1614` (sötét szekciók, hero + záró CTA alapszíne).
- **Másodlagos világos háttér:** `--color-sand` `#f1e9d8` / `--color-sand-deep`
  `#e6dabf`.
- **Sötét szövegszín:** `--color-ink` `#1c1917` / `--color-ink-soft` `#57534e`.
- **Új meleg glow-tokenek (ma hozzáadva):**
  - `--color-terracotta` **`#b1543a`** — visszafogott, poros égett-terrakotta;
    a hero jobb oldali aurora-foltjában (`bg-terracotta/28`) és a hero alsó
    radiális gradiens rétegében (`rgb(177 84 58 / 0.35)`) használva, a korábbi
    petrol helyén.
  - `--color-amber-glow` **`#d6a24a`** — meleg, poros arany-amber; a hero
    harmadik aurora-foltjában (`bg-amber-glow/22`, korábban moss) és a záró
    CTA szekció felső-bal aurora-foltjában (`bg-amber-glow/24`, korábban
    petrol) használva.
  - Mindkettő a `@theme` blokkban, `src/app/globals.css`-ben, a meglévő
    `--color-petrol`/`--color-moss` tokenek **mellett** (nem helyettük) —
    azok máshol változatlanul megmaradnak.
- **Zöld szerepe ezután:** kizárólag másodlagos/funkcionális — a Buda
  Konténer kereszt-promó CTA sáv (tudatos vizuális megkülönböztetés a
  testvércégtől), egy "✓" ikon, egy 3-színű zóna-akcent-pötty rotáció egyik
  tagja, egy vékony dekor-elválasztó vonal. Ezeken a kis felületeken a zöld
  **nem lett lecserélve** — a felhasználói utasítás kifejezetten ezt kérte.
- **Kontraszt-ellenőrzési szabályok:** mindkét új token csak alacsony
  opacitással (22-30%), erősen blur-özve (`filter: blur(64px)`), sötét
  `basalt` alapon, fehér (`paper`) szöveg mögött fut — ugyanaz a kontraszt-
  profil, mint a korábbi petrol/moss blobok (hasonló opacitás-tartomány),
  ezért a szöveg-kontraszt nem változott. Megerősítve: axe 45/45 PASS a
  csere után is (ez lefedi a kontraszt-ellenőrzést).

## Dekoratív hátterek

- **Hero felső glow/blur** (`src/app/page.tsx`, `data-call-region="hero"`):
  - `aurora-a`: `bg-brand/25` — **változatlan**.
  - `aurora-b`: `bg-petrol/30` → **`bg-terracotta/28`**.
  - `aurora-c`: `bg-moss/25` → **`bg-amber-glow/22`**.
  - Radiális gradiens réteg: `rgb(15 118 110 / 0.35)` (petrol) →
    **`rgb(177 84 58 / 0.35)`** (terracotta rgb-je).
- **Alsó záró CTA glow/blur** (ugyanaz a fájl, "Záró CTA" szekció):
  - `aurora-b`: `bg-petrol/25` → **`bg-amber-glow/24`**.
  - `aurora-a`: `bg-brand/25` — **változatlan**.
- **Gradient szabályok:** nincs új gradient-típus bevezetve, csak a már
  meglévő `.aurora`/radiális-gradiens mechanizmus kapott új szín-inputot.
- **Milyen zöld háttérelemek szűnnek meg vagy alakulnak át:** csak a fenti
  négy helyen (3 aurora-folt + 1 radiális gradiens réteg) — ez a teljes
  repóban megtalált összes "nagy, domináló zöld háttér" (ellenőrizve:
  `grep -rn "aurora\|bg-petrol/\|bg-moss/"` más route-okon nem talált
  találatot, ez a mintázat kizárólag a főoldalon létezik).
- Minden más petrol/moss előfordulás (lásd Színstratégia) **nem** dekoratív
  nagy háttér, hanem kis felületű funkcionális elem — ezek nem módosultak.

## Tipográfia és spacing

Nem változott ebben a körben — lásd `docs/project-audit.md` Design és UX
szakaszát a már dokumentált típusskála-állapotért (P2 mérföldkő, névre szóló
`--text-heading-*` tokenek, egyelőre csak a főoldalon alkalmazva).

## UI-komponensek

Nem változott ebben a körben. A `.glow-ring` gomb-keret (a telefon CTA-kon
futó, forgó conic-gradient szegély, ami brand→petrol→moss ciklust használ)
**szándékosan nem lett módosítva** — ez egy vékony (2px), funkcionális CTA-
díszítés, nem egy domináns háttér, és a mandátum kifejezetten kéri a CTA-k
állapotjelzésének érintetlenül hagyását.

## Tiltott irányok

- Neon narancs — nem került bevezetésre, a `--color-brand` család változatlan.
- Túl erős gradient — a meglévő finom radiális/aurora mechanizmus maradt,
  nem lett agresszívabb.
- Túl sok blur — ugyanannyi blur-özött elem van, mint korábban (3+2 folt),
  nem nőtt a szám.
- Túl sok shadow — nem érintett ebben a körben.
- Túl sok zöld nagy felületen — **ez volt a javítandó probléma, megoldva.**
- Random glassmorphism — nincs a projektben, nem került bevezetésre.
- Túl sok pill alakú UI — nem érintett ebben a körben.
- Alacsony kontraszt — ellenőrizve, nem romlott (axe 45/45 PASS).
- Generikus AI-weboldal minták — a dömper-logó, a földközeli színvilág és az
  emberi hangú magyar szöveg továbbra is megkülönbözteti az oldalt a generikus
  sablonoktól.
