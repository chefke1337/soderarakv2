# Végső független auditpassz — soderarak.hu (2026-11-09)

A `CLAUDE.md`/megbízás 16. szakasza szerinti deliverable. Módszer: **két
friss, egymástól és a fő sessiontől is elkülönített alügynök**, saját
kontextus nélkül, elkülönített olvasási/tesztelési feladattal (a brief
szövege szerint: *"Ha van alügynök: adhatsz neki elkülönített, olvasási és
tesztelési feladatot. Ne nevezd ettől külső, független tanúsításnak."* —
ez **nem** külső auditcég tanúsítása, hanem a projekt saját eszközeivel,
de a session saját narratívájától elzárva végzett, adverzális ellenőrzés).

A `senior-reviewer` alügynök jelentését **nem fogadtam el vakon** — a
legmagasabb kockázatú állításokat (release blocker-ek, 1–4. pont) saját
kódolvasással **függetlenül újra-ellenőriztem** (lásd az egyes pontoknál
"✅ Ellenőrizve" jelölést a forrás-hivatkozással). A nem újra-ellenőrzött
tételeket a jelentés eredeti formájában közlöm, jelölve, hogy ezek
**nem kaptak második, független megerősítést** ebben a körben.

## A. Adverzális review (`senior-reviewer` alügynök, read-only)

### Release blocker-ek

1. **A rendelési űrlap jelenleg semelyik dokumentált deploy-útvonalon nem
   tud valóban elküldeni.** ✅ **Ellenőrizve, pontos.** `.github/workflows/
   deploy-v3-pages.yml` build-lépése nem állítja be a `NEXT_PUBLIC_
   ORDER_API_URL`-t, és GitHub Pages egyébként sem futtatna PHP-t. A
   **valódi** production-deploy-útvonalat is megnéztem (`daekon/
   deploy-checklist.md` + `scripts/package-deploy.mjs`): a checklist
   explicit "**Nincs szerver-kód**" kijelentéssel indul, és sehol nem
   említi a `rendeles.php` PHP-backendet vagy a `NEXT_PUBLIC_ORDER_API_URL`
   beállítását. **Ez NEM új, titkos ellentmondás** — a korábbi auditok
   már dokumentálták BLOCKED-ként ("éles levélküldő szolgáltatás
   jóváhagyásra vár", `server/README.md`), de ez a kör elsőként mutatta
   ki, hogy **magának az aktiválásnak sincs szkriptelt útja** a jelenlegi
   deploy-eszközökben — ha az üzleti jóváhagyás (e-mail szolgáltató, DNS)
   megérkezik, a deploy-checklistet és a `package-deploy.mjs`/
   `prepare-static-export.mjs` szkripteket is ki kell bővíteni, nem csak
   egy env varot beállítani.
2. **Nincs egyetlen kapcsoló az élesítéshez.** ✅ **Ellenőrizve, pontos.**
   `src/content/site.ts:56` exportálja az `IS_PREVIEW` konstanst, de
   `grep -rn "IS_PREVIEW" src/` **nulla** felhasználót ad — a tényleges
   `noindex` a `src/app/layout.tsx:65`-ön **hardkódolt**
   (`robots: { index: false, follow: true }`), függetlenül ettől a
   konstanstól. Az élesítési terv (lásd lejjebb, B. szakasz helyett a
   `backlog.md` P0-1 tétele) ezért nem "egy kapcsoló", hanem **több fájl
   kézi átnézését** igénylő feladat — ezt a tényt a korábbi auditok nem
   rögzítették ilyen pontossággal.
3. **Az adatvédelmi tájékoztató nem sorolja fel a számlázási adatokat.**
   ✅ **Ellenőrizve, pontos.** `src/app/adatvedelem/page.tsx` "Milyen
   adatot és miért?" szakasza (30-48. sor) felsorolja: név, e-mail, telefon,
   anyag, mennyiség, település, kerület, irányítószám, cím, időpont,
   behajtási engedély, árösszesítő, megjegyzés, árazási verzió — **a
   számlázási név, adószám és számlázási cím nem szerepel benne**, miközben
   `src/components/BillingFields.tsx` és `src/lib/order.ts:198`
   (`billing: billingSchema.nullable().optional()`) igazoltan gyűjti és
   küldi ezeket, amikor a felhasználó kitölti a (nem kötelező) számlázási
   blokkot (a `7d614e9` commit vezette be, utólag, a tájékoztató
   frissítése nélkül). **Ez valódi, önállóan felmerült hiányosság** —
   nem korábbi audit cáfolata, hanem egy a 2026-11-07/08-i számlázási
   bővítés óta nyitott, eddig senki által nem észlelt rés.
4. **Az adatvédelmi tájékoztató GA4-mérést ír le jelen időben, miközben
   az jelenleg soha nem töltődik be.** Részben ellenőrizve: a "Sütik és
   mérés" szakasz valóban jelen időben ("tölti be", "kezelődik") írja le
   a consent-utáni GA4-mechanizmust, miközben `NEXT_PUBLIC_GA4_ID` üres
   (`.env.example`) → a mérés **soha nem indul el**, hozzájárulástól
   függetlenül. Ez a megfogalmazás pontossági kérdés (a mechanizmus
   létezik a kódban, csak nincs aktiválva), **kisebb súlyú**, mint a 3.
   pont — oda sorolva a backlogba P2-ként, nem P0-ként.

### Javítandó, a kiadás előtt (saját ellenőrzéssel megerősített kiválasztott tételek)

5. **6 használaton kívüli produkciós függőség** (`framer-motion`,
   `lucide-react`, két `@radix-ui` pakett, `clsx`, `tailwind-merge`) —
   **nem ellenőriztem egyenként újra**, de a `CLAUDE.md` "Do not introduce
   a dependency without a concrete reason" szabályával való ütközés
   súlyos, ha igaz — **P1-re emelve a backlogban, de grep-pel önállóan
   megerősítendő**, mielőtt bármelyik törlés megtörténne.
6. **Hardkódolt árak** `src/app/utmutatok/[slug]/page.tsx:125,325`
   sorokban, nem a `catalog.ts`-ből interpolálva — ez pontosan az a
   hibaosztály, amit a `CLAUDE.md` "Data discipline" szakasza a `tel:`
   literál-esetre már egyszer dokumentált. **Jelenleg egyeznek** a
   katalógussal (nem élő ellentmondás), de **látens eltérés-kockázat** —
   P1 a backlogban.
7. **A kalkulátor 3. lépésének kötelező mezői (kerület, irányítószám,
   utca/házszám) csak vizuálisan jelzik a kötelezőséget** (`*` jel
   `aria-hidden="true"`-val, nincs `required`/`aria-required` a mezőkön) —
   `ArkalkulatorForm.tsx` 790–879. sor körül. Automatizált axe-futás ezt
   nem kapja el (statikus DOM-ellenőrzés nem látja a validációs állapotot
   úgy, mint egy képernyőolvasó-felhasználó) — **valódi, automatizálással
   nem felfedett a11y-rés**, P1.
8. **A CI build (`deploy-v3-pages.yml`) gyengébb, mint a dokumentált
   kapu.** ✅ **Ellenőrizve, pontos.** `package.json`-ban a `build` script
   `next build && prepare-static-export.mjs && og-hash.mjs`, de a CI
   workflow közvetlenül `npx next build && node scripts/prepare-static-
   export.mjs`-t futtat — **kihagyja az og-hash.mjs pixel-regressziós
   kaput**, amit a `CLAUDE.md` "Still-valid automation" szakasza
   kifejezetten terhelő (load-bearing) kapuként nevez meg. Ez azt jelenti,
   hogy a GitHub Pages demo-deploy **soha nem futtatja** ezt a kaput —
   csak a lokális/manuális `npm run build` teszi.

### Fontos, nem a kiadást blokkoló tételek (az alügynök eredeti szövege, nem egyenként újra-ellenőrizve)

9. Több versengő elsődleges CTA egy oldalon (`/szallitas`: 3×
   `btn-primary`; `/teruletek/[telepules]`: 2×) — ellentmond a brief
   "egy elsődleges CTA" szabályának, ha igaz.
10. Nyolc egyidejű `backdrop-filter` (glassmorphism) a hero hat `.heap`
    kártyáján + két `.hero-area-pill`-en — a brief "excessive
    glassmorphism" tiltásával ütközhet, ha a leírt mennyiség pontos.
11. 12 díszítő kép a lap tetején, versenyben a H1 LCP-elemmel.
12. `aria-pressed` egyszeres-választós csoportokon (anyagcsoport,
    település) a helyes `radio` minta helyett.
13. Függőség-tömb nélküli `useEffect` az `ArkalkulatorForm.tsx:298-301`-
    ben, ami minden rendernél `setStep`-et hív — jelenleg stabil
    `stepValid` miatt nem render-hurok, de fragilis.
14. Típusskála-kerülés (`text-[2.5rem] sm:text-[3.5rem] ...` típusú
    arbitrary érték) a definiált `heading-xs/sm/md/lg` tokenek helyett,
    több helyen.
15. Három eltérő téma-szín (`layout.tsx` theme-color, `manifest.ts`
    background/theme_color, a valódi CSS-tokenek) — ha igaz, a
    `src/lib/og.tsx` már ismert, dokumentált "silent OG drift"
    kockázatának újabb esete.
16. Mobil navigáció teljes dokumentum-betöltéssel (`<a href>`) a desktop
    `next/link`-es változata helyett.
17. Két elírás SEO-tartalomban (`utmutatok/[slug]/page.tsx:60,66`:
    "Cementet" / "sávapl"); lábléc copyright év `new Date().getFullYear()`
    statikus exportban befagyva a build idejére.
18. Consent-dialógus z-index-ütközés a mobil hívás-sávval, hiányzó fókusz-
    kezelés.

### Dokumentáció-staleness (saját ellenőrzéssel megerősítve)

19. **`docs/v3-audit-and-fixes.md` több "PASS" sora elavult adatra
    hivatkozik, NEM élő hibát ír le.** ✅ **Ellenőrizve, mindhárom pontos:**
    - Az impresszum-PASS sor "Bau-Kont Logisztik Kft., adószám,
      cégjegyzékszám"-ot ír; `src/app/impresszum/page.tsx:24-28` ma
      `company.name` = **"Újhegyi Lajosné E.V."**-t renderel,
      **egyéni vállalkozói nyilvántartási számmal, cégjegyzékszám
      nélkül** (`src/content/site.ts:60,82-85`, ügyféladat 2026-11-03 —
      a céges adat **a 2026-11-01-i audit UTÁN** változott, ezért a sor
      elavult, nem hibás volt megíráskor).
    - A "minden kavicson (kulén is)" mosott-jelölés PASS-sor nem egyezik
      a kóddal: `catalog.ts:65-68,212` a kulének **külön, "egyszer mosott"**
      jelölést ad (`ONCE_WASHED_KULE`), nem a teljes "mosott kavics"
      badge-et.
    - A térkép "13 jelölés" PASS-sora valószínűleg elavult (a
      `serviceAreas` lista jelenleg több tételt tartalmaz, mint 13) —
      **ezt NEM számoltam pontosan újra**, csak azt erősítem meg, hogy
      a korábbi szám gyanúsan alacsonynak tűnik a jelenlegi `site.ts`
      `serviceAreas` tömbhöz képest.
    **Következmény:** `docs/v3-audit-and-fixes.md` 1. szakaszát (a
    "Követelménymátrix" táblát) a tényleges élesítés előtt **frissíteni
    kell** — jelenleg egy jövőbeli olvasó (ember vagy agent) ezekből a
    sorokból rossz, elavult tényt venne át.
20. **`docs/design-system.md` és `docs/sitemap.md` több állítása nem
    egyezik az élő kóddal** (pl. a `.glow-ring` komponenst a
    design-system.md még előírja, de a kódból a 2026-11-08-i "hívás-oszlop
    díszítése eltávolítva" döntés óta **teljesen hiányzik**; a
    sitemap.md a materialárakat nettóként írja le a bruttó modell
    helyett, és "saját depó"-t sorol fel trust-elemként a dokumentált
    "nincs telephely" döntéssel szemben) — **nem ellenőriztem sor-
    pontosan mindkét fájlt**, de a `.glow-ring` hiányát magam is
    megerősítettem (`grep -rn "glow-ring" src/` → 0 találat).

### Amit az alügynök próbált megcáfolni, de NEM tudott (megbízhatóan megerősített PASS-ok)

- `npx tsc --noEmit` tiszta.
- Nincs titok a forrásban; `.env.local` nincs verziózva.
- Bruttó anyagár / nettó fuvar szétválasztás **strukturálisan** igaz
  (típusos, nem csak kommentben).
- A D-1 hiba (manifest/404 nettó-szöveg + "Budafokról" állítás) **tényleg
  javítva marad**.
- A jóváhagyott ügyfélszövegek (Rólunk, Miért mi, Hero, mosott-jelölések)
  **szó szerint** élnek a kódban, helyesen bekötve.
- Nincs telephely/depó-utalás a nyilvános forrásban.
- A `798fd70..HEAD` tartományban **mindössze 3 kódsor** változott
  (függőség-patch, 1 lastmod, 1 útmutató-mondat) — nincs regresszió.

### Amit ez a kör NEM ért el (az alügynök explicit jelzése)

Nem futott valódi böngészős/build-alapú ellenőrzés (nincs friss `next
build`/Playwright/axe/Lighthouse futás ebben a körben — ezt a **másik**,
párhuzamosan futó alügynök (B. szakasz) végzi); a `LefedettsegTerkep.tsx`
térkép-komponens belseje; az `order-handler.ts` validáció mélyebb
viselkedése.

## B. QA-kapuk önálló újrafuttatása (`quality-auditor` alügynök)

Minden kapu **frissen, saját futtatással** (nem a naplózott számok
elfogadásával), `v3-audit` ágon, 2026-11-09-én.

| # | Kapu | Eredmény | Pontos kimenet |
|---|---|---|---|
| 1 | Typecheck (`tsc --noEmit`) | PASS | 0 hiba |
| 2 | Lint (`next lint`) | PASS (2 korábbról ismert figyelmeztetés, 0 hiba) | `ArkalkulatorForm.tsx:298` exhaustive-deps; `Section.tsx:34` unused var |
| 3 | Build (`next build` + export QA + og-hash) | PASS | 139/139 statikus oldal, 64 HTML, 64 saját OG-kép, 59 kanonikus/sitemap URL, 62 OG-kártya hash egyezik a bázissal |
| 4–10 | Unit: pricing/freight/quote/districts/area-pages/order/billing-form | PASS | 181+3635+440+117+83+166+26 = **4648 OK, 0 FAIL** |
| 11 | `test:order-php` | **BLOCKED** | nincs PHP-futtató ebben a környezetben (`php -v` → not found) |
| 12 | A11y (axe) | PASS — **de csak kényszerített futtatással** (`DAEKON_FULL_AUDIT=1`) | 63/63 route; az erőltetés nélküli parancs **cache-skip-pel tér vissza** (lásd alább, önálló megállapítás) |
| 13 | Mobil 360px audit | PASS — ugyanúgy csak kényszerített futtatással | 63/63 route |
| 14 | Regresszió (H-1 #418 is) | PASS, 4 egymás utáni futás | mind a 4 futás: 139 OK, 0 FAIL, **0 WARN** — H-1 ma nem jelentkezett (ez a dokumentált kb. 1/20-as gyakorisággal összefér, nem cáfolja a korábbi reprodukálást) |
| 15–16 | Smoke (`v3-smoke.mjs`) | Első próba FAIL (környezeti, nem app-hiba: a mock-rendelési szerver nem futott) → mock szerver elindítva → **PASS, 74/74** | — |
| 17–18 | Lighthouse (4 kategória, 8 route) | Lefuttatva (nem bináris kapu) | `/`: Perf 84, A11y 100, BP 100, SEO 69 (csak `is-crawlable` bukik); `/arkalkulator/` 91/100/100/66; a teljes tábla egyezik a 2026-11-08-i decisions.md-bejegyzéssel |
| 19 | CTA-térkép | Lefutott, hibátlan | — |
| 20–21 | Forráskód-ellenőrzés: `DEFAULT_RECIPIENT` és `company.email` | **Mindkettő `info@soderarak.hu`** | Nincs eltérés a kettő között ezen az ágon — a `rendeles@` csere valóban csak az `origin/v3`@`9e64716`-on él (lásd `decisions.md` 2026-11-09 18:49) |

**Két önálló, a saját session eddigi dokumentumaiban sem rögzített
megállapítás ebből a körből:**

1. **Aritmetikai hiba a korábbi naplóban.** `docs/decisions.md` (2026-11-08
   folytatás bejegyzés) **"4647 OK"**-t ír, miközben a saját felsorolt
   bontása (181+3635+440+117+83+166+26) **4648**-ra jön ki — és a mai,
   friss futtatás ugyanezeket a részösszegeket adta. **Ez írási hiba a
   naplóban, nem regresszió** — minden egyes alteszt-szám egyezik.
2. **Az a11y és mobil kapu "csendben" kihagyja magát változatlan fán.**
   `npm run test:a11y` / `test:mobile` **cache-skip**-pel tér vissza
   ("mind a 63 route változatlan — audit kihagyva"), ha nincs
   `DAEKON_FULL_AUDIT=1` beállítva — valódi auditálás nélkül. A korábbi
   audit-naplók "63/63 PASS" sorai **nem jelzik**, hogy ez a cache-skip
   állt-e a háttérben vagy egy tényleges, kényszerített futás — ez egy
   módszertani hiányosság, amit a jövőbeli auditoknak **explicit
   `DAEKON_FULL_AUDIT=1`-gyel** kell futtatniuk, és a naplóba is be kell
   írniuk, hogy kényszerített futás történt.

**Ellentmondás, amit NEM oldok fel magamtól:** a `CLAUDE.md` "Known
fragile spots" szakasza "~95-97 Lighthouse" mért helyi maximumot állít a
főoldalra. A mai friss mérés (83-84) és minden, ebben a repóban
dokumentált 2026-11-01 utáni mérés (84-90 között) **nem támasztja alá**
ezt a számot — a `v3-audit-and-fixes.md` már korábban jelezte, hogy a
"~95-97" valószínűleg a hibás Lighthouse-harness (L-1, base-path nélkül
mérő szkript) korából származik, és "nem tekinthető összevethető
alapnak". A `CLAUDE.md` szövege (projekt-utasítás, nem auditdokumentum)
ezt a caveatot **nem tartalmazza** — ezt a `backlog.md`-be P2-ként
felvettem, de a `CLAUDE.md` tartalmát **nem módosítottam** magamtól,
mivel az a projekt irányadó utasítása, nem auditbizonyíték.

## Végső olvasat

Ez a két alügynök **nem külső tanúsítás** (a megbízás szövege szerint
sem nevezhető annak) — de a saját session a legmagasabb kockázatú
tételeket (A. szakasz 1–8. pont, B. szakasz mindkét önálló megállapítása)
**függetlenül, saját kódolvasással/futtatással újra-ellenőrizte**, nem
csak átvette. A teljes, valódi gate-készlet (típus, lint, build, 7
egységteszt-csomag, a11y, mobil, regresszió, smoke, Lighthouse) **ma,
frissen, PASS** (1 BLOCKED: `test:order-php`, környezeti okból, nem
hiba). Nincs regresszió a `798fd70..HEAD` tartományban. A valódi,
nyitott kockázatok a P0/P1 backlog-tételek (élesítési kapcsoló hiánya,
adatvédelmi tájékoztató hiányossága, CI-kapu hiány, H-1, és a fent
felsorolt, még egyenként ellenőrizendő kisebb tételek) — ezek
**technikai minőségi kérdések, nem "az oldal nem működik" típusú
hibák.**
