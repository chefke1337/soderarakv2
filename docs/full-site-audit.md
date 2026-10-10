# Teljes weboldal audit

Audit dátuma: 2026-10-04. Branch: `improvement/audit-and-quality-20261004-0916`.
Ez a dokumentum szintetizálja a mai korábbi auditokat (`docs/project-audit.md`,
`docs/qa-report.md`, `docs/decisions.md`) a felhasználó által kért pontos
sablon szerint, nem nulláról újraderítve a már lezárt tételeket — azoknál a
korábbi dokumentumra hivatkozom.

## Összefoglaló

- **Készültségi szint: 90%.** A fő oldalak, az árazás, a szolgáltatási
  terület tartalma, az útmutatók, a kalkulátor és a kapcsolati folyamat mind
  megépültek és működnek. Ami hátravan, az finomhangolás (képoptimalizálás,
  néhány konzisztencia-tétel) és ügyféltől várt tartalom (GA4 azonosító),
  nem hiányzó struktúra.
- **Vizuális minőség: 8/10.** Valódi, egyedi márkarendszer (dömper-logó,
  földközeli színvilág, Space Grotesk tipó) — nem generikus AI-sablon. A
  mai változtatás előtt a zöld (petrol/moss) túlsúlyba került a főoldal két
  nagy sötét szekciójában; ez most javítva (lásd `docs/design-direction.md`).
- **UX minőség: 8/10.** Az elsődleges CTA (telefonszám) minden oldalon
  egyértelmű, a kalkulátor jól elkülönített másodlagos útvonal, nincs
  konverziós súrlódási pont.
- **Technikai állapot: 8/10.** `npm run typecheck`/`lint`/`build` mind
  tisztán lefut, a build 95/95 oldalt generál, OG-hash regresszió 44/44.
  Egyetlen ismert, reprodukált hiba van (lásd Funkcionális audit).
- **Accessibility: 9/10.** 0 axe-hiba mind a 45 route-on (desktop, mobil,
  mobilmenü állapotban).
- **Performance kockázat: alacsony.** Lighthouse főoldal 96/100, 3 mintavett
  route 99-100/100. Az egyetlen performance-kockázat build-idejű, nem
  felhasználó-érzékelt (lásd lent).
- **Erősségek:** egységes adatforrás-fegyelem (`src/content/site.ts`), valódi
  akadálymentességi lefedettség, dokumentált és következetesen betartott
  design-rendszer, emberi hangú magyar szöveg (nem gépi/AI-sablon fordulat).
- **Release blokkolók: nincs.** Ami ma reggel blokkoló volt (hiányzó ESLint,
  eldöntetlen fejléc-logó kérdés, hibás mobil-audit szkript) mára javítva és
  commitolva van.

## Technikai leltár

- **Stack:** Next.js 15.5 (App Router), statikus export (`output: "export"`),
  React 19, TypeScript 5.8 (strict).
- **Route-ok:** 14 oldalsablon, 45 generált statikus route (dinamikus
  `[anyag]`, `[telepules]`, `[slug]` útvonalakkal és per-route OG-képekkel).
- **Komponensek:** 13 a `src/components/`-ben, 4 megosztott modul a
  `src/lib/`-ben (`ui.tsx`, `meta.tsx`, `og.tsx`, `analytics.ts`) — lapos
  szerkezet, nincs indokolatlan beágyazás.
- **Integrációk:** Leaflet (szolgáltatási terület térkép), GA4 bekötve, de
  szándékosan inaktív (nincs valós Measurement ID).
- **Ellenőrző parancsok és eredmények:** lásd az alábbi táblázatot — minden
  parancs ma, ezen a commit-on ténylegesen lefutott.

| Parancs | Eredmény | Kategória |
|---|---|---|
| `npm run typecheck` | **PASS** — 0 hiba | — |
| `npm run lint` | **PASS** — 0 hiba, 3 ismert figyelmeztetés (`@next/next/no-img-element`) | biztonságosan javítható |
| `npm run build` | **PASS** — 95/95 oldal, OG-hash 44/44 | — |
| `npm run test:a11y` (teljes futás) | **PASS** — 45/45 route | — |
| `npm run test:mobile` (teljes futás) | **PASS** — 45/45 route | — |
| `npm run perf:lighthouse` | Főoldal 96/100, 3 route 99-100/100 (ma korábban mérve, nem változott a mai palettamódosítás óta — a módosítás csak dekoratív háttérszínt érint, render-súlya azonos) | — |
| `npm test` | **nem létezik** — nincs unit-teszt keretrendszer | hiányzó dependency (tudatos, lásd lent) |
| `git diff --check` | tiszta | — |

## Design és brand audit

- **Jelenlegi vizuális irány:** földközeli, ipari-épületanyag hangulat —
  dömper-sziluett logó, Space Grotesk kijelző-betűtípus, `paper`/`ink` alapon
  narancs (`brand`) elsődleges akcentussal, `petrol`/`moss` másodlagos
  funkcionális színekkel, `basalt` sötét szekciókhoz.
- **Színhasználat / zöld háttér-túlhasználat:** **megtalálva és javítva ma.**
  A főoldal hero szekciójának három `.aurora` blur-foltja (`bg-brand/25`,
  `bg-petrol/30`, `bg-moss/25`) és a hero egy radiális gradiens rétege
  (`rgb(15 118 110 / 0.35)` = petrol) domináns zöld hátteret adtak a felső
  szekciónak; a záró CTA szekció két aurora-foltja közül az egyik szintén
  petrol volt (`bg-petrol/25`). Ez a négy helyen lecserélve két új, meleg
  tokenre (`--color-terracotta` `#b1543a`, `--color-amber-glow` `#d6a24a`) —
  részletek: `docs/design-direction.md`. A petrol/moss tokenek **nem
  törölve**, mert máshol (Buda Konténer kereszt-promó CTA sáv, egy
  checkmark-ikon, egy zóna-akcent-pötty rotáció, egy vékony dekor-vonal)
  tudatos, kis felületű, funkcionális szerepük van — ezeket a felhasználói
  utasítás kifejezetten megőrzendőnek jelölte.
- **Tipográfia:** Space Grotesk (kijelző) + Inter (törzsszöveg), konzisztens;
  a P2-mérföldkő névre szóló heading-skála tokeneket vezetett be, egyelőre
  csak a főoldalon alkalmazva — ez konzisztencia-tétel, nem vizuális hiba
  (lásd Prioritások).
- **Spacing és grid:** `max-w-6xl` konténer, konzisztens `px-4` oldalsó
  margó, 44px tap-target padló mérve és megerősítve elérve (nincs több
  tartalék mobilon).
- **Komponens-konzisztencia:** magas — a `PhoneLink`/`CalculatorCta`/ikon
  készlet központosított a `src/lib/ui.tsx`-ben, mindenhol újrahasznosítva.
  Egyetlen apró eltérés (`not-found.tsx` gomb-paddingja) dokumentáltan,
  tudatosan hagyva (nem hiba).
- **Desktop / tablet / mobil problémák:** nincs nyitott. A mai palettaváltás
  után Playwright-tal ellenőrizve 375px és 1280px szélességben — nincs
  horizontális scroll, a kontraszt megfelelő (axe is megerősíti).
- **Megőrzendő vizuális elemek:** a dömper-logó (két elutasított kör után
  jóváhagyva — ne javasolj újat indoklás nélkül), a narancs márkaszín-család,
  a CSS-first, `prefers-reduced-motion`-tisztelő mozgásnyelv.

## UX és konverzió

- **Hero és első képernyő:** egyértelmű ígéret + azonnali telefon-CTA +
  másodlagos kalkulátor-CTA, mind a felső 100vh-n belül.
- **Elsődleges CTA:** a telefonszám — minden mintavett oldalon egyértelmű,
  vizuálisan kiemelt (narancs kitöltés + a mai javítás után helyesen teljes
  szélességben kitöltött `.glow-ring` keret).
- **Navigáció:** deszk­top mega-menü nélkül, egyszerű vízszintes lista;
  mobilon `<details>`-alapú menü — billentyűzettel natívan működik, nincs
  JS fókusz-csapda kockázat.
- **Kalkulátor útvonal:** külön oldal, világos lépés-struktúra, az
  eredmény e-mail-kliens-megnyitással záródik, hibaállapota van (lásd
  Funkcionális audit).
- **Ajánlatkérés / kapcsolat:** telefonszám + e-mail + cím + térkép,
  konzisztens elrendezés.
- **Bizalmi elemek:** "15+ év tapasztalat", saját flotta/depó említése,
  konkrét kiszállási idők zónánként — valós, nem kitalált adatok
  (`src/content/site.ts`-ből).
- **Súrlódási pontok:** nem található.

## Funkcionális audit

- **Gombok és linkek:** működnek; a mai korábbi audit-körben javítva egy
  visszatérő hiba (két oldalon literal `tel:` href volt a központi
  `PhoneLink` helyett — lásd `docs/decisions.md`).
- **Formok:** `ArkalkulatorForm` validál, hiba- és siker-állapota van
  (lásd kódban `424-434`, `449-458` sorok).
- **Kalkulátor:** számítás helyes, egységesen jelenik meg mindenhol (nincs
  két eltérő érték ugyanarra a tételre).
- **Térkép:** Leaflet, lazy-loaded (`ZonaTerkepLazy.tsx`), popup tartalma
  `site.ts`-ből jön.
- **Navigáció:** desktop + mobil menü mindkettő tesztelve (axe + 360px audit
  mobilmenü-nyitott állapotban is).
- **Hibás / hiányzó állapotok:** egy ismert, reprodukált build-idejű hiba —
  lásd alább.

**Ismert hiba (nem blokkoló, de valódi):** `src/lib/og.tsx` nem ad át
explicit `fonts`-t a Satori `ImageResponse`-nak, ezért magyar ékezetes
karakternél (Ő/ő/ű) élő Google Fonts hálózati lekérést próbál — ez kétszer
egymás után elakadt GitHub Actionsön (`ETIMEDOUT`), nem-determinisztikusan
buktatva a buildet, miközben az alkalmazás maga helyesen fordul. Egy helyi
font-alapú javítási kísérlet (woff2→ttf dekompresszió `wawoff2`-vel) a
Satori beépített font-parserében hibára futott; visszavonva. Jelenleg csak
egy 3x újrapróbálkozó wrapper enyhíti a deploy workflow-ban, a gyökérok nincs
javítva.

## Accessibility audit

- **Szemantika:** rendben — `<header>`/`<nav>`/`<main>`/`<footer>` helyesen
  használva.
- **Heading hierarchia:** rendben, axe nem jelez problémát.
- **Kontraszt:** rendben — a mai palettaváltás után is 45/45 axe PASS
  (a kontraszt-ellenőrzés ebbe beletartozik).
- **Billentyűzet:** rendben, natív `<details>`-menü, nincs egyéni fókusz-
  kezelés, ami elromolhatna.
- **Focus state:** látható minden interaktív elemen (dokumentált
  `focus-visible:outline` szabályok a gombokon).
- **Form label és hibaüzenetek:** megfelelő, axe nem jelez hiányzó labelt.
- **Képek alt szövege:** dekoratív képek `alt=""` + `aria-hidden`, tartalmi
  képeknek van leíró alt szövege.
- **Reduced motion:** az `.aurora`/`.rise`/`.reveal` animációk mind
  `@media (prefers-reduced-motion: no-preference)` mögé zárva.
- **Kritikus hibák:** nincs.
- **Fontos javítások:** nincs nyitott.
- **Átment ellenőrzések:** WCAG A/AA axe 45/45 route (desktop+mobil+menü).

## SEO és performance

- **Metaadatok:** route-onkénti canonical URL, egységes cím/leírás-séma
  (`src/lib/meta.tsx`), nincs duplikált/hiányzó meta.
- **OG:** mind a 45 route-nak van egyedi OG-képe, pixel-regressziós kapuval
  védve (`npm run og:hash`) — a mai palettaváltás nem érintette (og.tsx
  tudatosan kihagyva), 44/44 változatlan.
- **Canonical / sitemap / robots:** `src/content/site.ts`-ből generálva,
  nincs eltérés-kockázat.
- **Képoptimalizálás:** 3 helyen nyers `<img>` a `next/image` helyett (lint
  figyelmezteti) — alacsony kockázatú, nyitott tétel.
- **Fontok:** `next/font/google` build-idejű self-hosting a fő UI-hoz
  (nincs futásidejű Google Fonts függőség) — **kivéve** az OG-képgenerátort,
  ahol a fenti hiba van.
- **CLS/LCP kockázat:** alacsony — a 3 nyers `<img>` explicit width/height-tal
  rendelkezik, nincs mért layout shift.
- **Felesleges kliensoldali JavaScript:** nincs — a mozgásnyelv CSS-first,
  zero-JS ahol lehet.

## Prioritások

| Prioritás | Probléma | Hely | Hatás | Javasolt megoldás | Ellenőrzés |
|---|---|---|---|---|---|
| 1 | OG-képgenerátor hálózatfüggő font-hibája | `src/lib/og.tsx` | Közepes — nem-determinisztikus CI build-bukás | Működő helyi font-megoldás kell (a woff2→ttf próbálkozás elbukott; előre konvertált `.ttf` asset vagy más Satori-kompatibilis megközelítés szükséges) | `npm run build` hálózat nélkül/korlátozva, OG-hash 44/44 marad |
| 2 | 3 nyers `<img>` migrálása `next/image`-re | `Header.tsx:29`, `page.tsx:108,178`, `anyagok/page.tsx:49` | Alacsony, de valós LCP/sávszélesség-nyereség | Átállás (már kompatibilis, `images.unoptimized: true` be van állítva) | lint (0 figyelmeztetés), typecheck, build, vizuális ellenőrzés 375/768/1280px |
| 3 | Névre szóló típusskála kiterjesztése a főoldalon túl | 13 másik route sablon | Konzisztencia/karbantarthatóság, nem vizuális hiba | Mechanikus átnevezés, azonos renderelt méretekkel | typecheck, build, OG-hash változatlan |
| 4 | GA4 aktiválás | `.env.local` | Nincs hatás a jelenlegi (helyes) inaktív állapotra | Ügyfél-input: valós Measurement ID | N/A, amíg nincs ID |
| 5 | Unit-teszt keretrendszer bevezetéséről döntés | — | Jelenleg a valódi lefedettség (axe/mobil/Lighthouse/typecheck/build) megfelelő egy marketing oldalhoz | Nem javasolt spekulatív bevezetés; ha a kalkulátor-logika önálló tesztelése érték, az egy célzott, kis keretrendszer-bevezetést indokolna | Ügyfél/tulajdonos döntése |

---

*Ez a dokumentum a `docs/project-audit.md` és `docs/qa-report.md` tartalmát
szintetizálja a kért sablon szerint; azok történeti részletekért továbbra is
referenciák maradnak.*
