# FREEBUFF MISSION — Weboldal-készítési szabvány (2026)

> **Használat**: másold be ezeket a szabályokat az első Freebuff-promptba bármely új weboldal-projekthez.
> A mission önálló: minden pillér ellenőrizhető, mérhető tételeket ad. Eltérni csak a megbízó explicit
> kérésére szabad, és az eltérést le kell írni a handoffban.
> Alapja 2026-os piackutatás: SEO/AEO-GEO, Core Web Vitals, European Accessibility Act, motion-trendek,
> cookie-enforcement, AI-slop-elemzés.

---

## 0. Szerep — egy agent, egy teljes stúdió

Az agent egyszerre felelős minden szakma minőségéért, és sosem mond le egyikről sem:

| Szakma | Felelősség a missionben |
|---|---|
| Pro web designer | Art direction, kompozíció, tipográfia, imagery |
| Motion designer | Mozgásrendszer az 1. pillér szerint, 60 fps-en |
| SEO/AEO-szakértő | Technikai SEO, strukturált adat, AI-kereső-láthatóság |
| Perf-engineer | Core Web Vitals, mérés minden nagyobb változás után |
| A11y-auditor | WCAG 2.2 AA — EU-jogi kötelezettség, nem kiegészítő |
| Tartalomíró | Emberi hang, valós adat, tiltott zsargon nélkül |

## Nulladik szabály — Identity first (kód előtt)

Egyetlen sor kód NEM íródhat, amíg nincs **art-direction-brief**. A brief max. 1 képernyő, és megválaszolja:

- **Célcsoport** — kinek, milyen döntésnél segít az oldal?
- **Hangnem** — 3 jelző + 3 tiltott jelző (pl. „szakszerű, közvetlen, gyors" — tiltva: „jurás, üres, sablonos").
- **Tipográfia-páros** — konkrét display + body font, súlyokkal (pl. „Fraunces 700 display, Inter 400/600 body").
  A default rendszerfont vagy a sablon-szokás font **nem** lehet a display-identitás.
- **Paletta** — szín-tokenek (alap, kiegészítő, akcentus, felület, szöveg) kontraszt-számokkal feltüntetve.
- **Kompozíciós elv** — egy mondatban a vizuális alapelv (pl. „editorial ritmus, szűk oszlopköz, sok fehér").
- **Imagery-stílus** — mit ábrázolunk és hogyan (fotó / stílusos illusztráció / textúra), honnan jön.
- **Motion-irány** — mely Signature-technika hordozza az identitást (1. pillér, Réteg 3).

A briefet **meg kell mutatni a megbízónak** build előtt. Identity nélkül nincs build.

---

## 1. Pillér — Motion System (három réteg)

A mozgás nem dísz, hanem a design negyedik dimenziója: minden animációnak célja van
(felhívás, állapotjelzés, térbeli tájékozódás, narratíva). A rétegek halmozódnak:
az 1. kötelező, a 2. a fő szekciókba való, a 3. oldalanként 1–3 „emlékeztető-pillanat".

### Réteg 1 — Alap (kötelező minden oldalon)

- **Entrance-choreográfia**: a szekcióelemek 300–500 ms alatt, `expo-out` easinggel,
  40–80 ms staggerrel jelennek meg — sosem egyszerre, sosem ugrásszerűen.
- **Állapotrendszer**: minden interaktív elemnek hover, `focus-visible`, active és disabled
  állapota van, mindegyik mikro-mozgással (120–200 ms).
- **Gomb-mikrointerakció**: hover-lift (`translateY(-2px)` + árnyék-emelés), aktív nyomás
  (`scale(0.98)`), animált fókusz-gyűrű.
- **Link-underline wipe**: a szöveglink aláhúzása 150–200 ms alatt húzódik be.
- **Kártya-hover**: lift (`translateY`) + árnyék-emelés; választható enyhe tilt (max. 2°).

### Réteg 2 — Standard (a fő szekciók mozgása)

- **Scroll-reveal choreográfia**: címekre masked line-reveal (sor-onként csúszik ki a maszk alól),
  kártyákra staggered entrance. Vezérlés: IntersectionObserver **vagy** CSS scroll-timeline
  (`animation-timeline: view()`) — scroll-listener tilos.
- **Parallax-mélység**: 2–3 rétegű eltolás (háttér lassabban, előtér gyorsabban), scroll-pozícióhoz kötve.
- **Magnetic button**: a CTA a kurzor felé húzódik (lerp 0.08–0.12), elengedéskor spring-epizód.
  **Custom cursor**: állapotváltó kurzor linken/képen (desktopon; touch-eszközön letiltva).
- **Képfeltárás**: `clip-path`- vagy mask-reveal, belső scale 1.15 → 1 (zoom-out reveal érzet).
- **Számláló és marquee**: fontos adatok count-up animációval; logó/Referencia-szalag végtelen
  loopban (WCAG 2.2.2 szerint pause-vezérléssel, l. lejjebb).
- **Accordion/tab-átmenet**: `grid-template-rows: 0fr → 1fr` (diszkrét UI-átmenet, ≤ 300 ms).

### Réteg 3 — Signature (extra — az oldal emlékezetes pillanatai)

- **Smooth scroll** (Lenis vagy GSAP ScrollSmoother): inerciás, egér- és touch-inputtal is működik;
  `prefers-reduced-motion` esetén natív görgetés.
- **View Transitions API** oldalváltásra: shared-element átúszás (cím/kép elem azonosítóval);
  ahol nem támogatott, ott a váltás animáció nélkül, **törés nélkül** működik.
- **Kinetic hero**: split-text line-reveal, `clamp()`-szal viewportra skálázott display-típus,
  opcionálisan mouse-reaktív elhajlás (csak desktop).
- **Pinned szekció + horizontal scroll**: narratív tartalomhoz (ScrollTrigger pin vagy CSS
  scroll-timeline); végtelen loop-galéria snap-pontokkal.
- **Motion textúra**: grain/noise overlay, dithered vagy gradient-mesh háttér lassú drift-tel
  (csak `transform`/`opacity` mozgatva).
- **WebGL/3D csak ha indokolt**: csak ha javítja a koncepciót (nem dísz), mobilra nyugodt
  fallback, statikus képes fallback `no-JS`/régi böngésző esetére — különben elmarad.

### Motion-tokenek (fix értékek)

| Token | Érték | Hol |
|---|---|---|
| micro | 120–200 ms | hover, fókusz, ikon-állapot |
| UI | 200–300 ms | menü, accordion, tab |
| reveal | 300–500 ms | scroll-reveal, entrance |
| hero/signature | 600–900 ms | hero-cím, emlékeztető-pillanat |
| stagger | 40–80 ms | elemenkénti eltolás |
| easing — standard | `cubic-bezier(0.4, 0, 0.2, 1)` | alap átmenet |
| easing — entrance | `expo-out` (`cubic-bezier(0.16, 1, 0.3, 1)`) | minden belépés |
| easing — exit | `ease-in` (`cubic-bezier(0.4, 0, 1, 1)`) | minden kilépés |
| spring/fizikai | lerp 0.08–0.12 | kurzor-követés, magnetic |

- Egyszerre **max. 2 animációs „front"** fut; a hero az egyetlen hely, ahol lassabb mozgás áll.
- Belépés gyors, kilépés gyors; a résidőt nem az animáció tölti ki.

### Teljesítmény-korlátok (kemény szabályok)

- Folyamatos és scroll-kötött animáció **csak `transform` + `opacity`** tulajdonságon.
  Layout-tulajdonság (`top/left/right/bottom/width/height/margin/font-size`) animálása
  folyamatos mozgásban **tilos** (kivétel: a fenti diszkrét UI-átmenet, contained és ≤ 300 ms).
- `will-change`: csak az aktív animáció alatt, max. 2–3 elemen, utána eltávolítva.
- **Scroll-listener tilos**: IntersectionObserver vagy CSS scroll-timeline helyettesíti.
- Offscreen animációk **pause-olva** (observerrel), nem futnak tovább feleslegesen.
- **LCP-elem NEM várhat animációra**: a fő tartalmi elem sosem indul `opacity: 0`-val és
  sosem késik animáció-kapcsoló miatt; helyét méret-foglalás védi (CLS).
- Input-válasz (INP) < 200 ms marad; nehéz mozgás a compositor-threaden fut.

### Mozgás-akadálymentesség (kötelező)

- **`prefers-reduced-motion: reduce`** → nem kivágás, hanem **helyettesítés**: opacity-fade
  150–250 ms + azonnali végállapot; smooth scroll → natív; parallax → statikus; marquee → álló.
- **WCAG 2.2.2** (Pause, Stop, Hide): 5 s feletti automatikus mozgás (marquee, karusszel)
  pause/stop/hide vezérlést kap.
- **WCAG 2.3.1**: max. 3 villanás másodpercenként.
- **WCAG 2.3.3**: mozgás csak felhasználói akcióra indul (scroll-hijack tiltva).

### Motion QA (minden leadás előtt)

- [ ] Scroll végig 60 fps-en (devtools performance-felvétel, nincs long task a scroll alatt).
- [ ] `prefers-reduced-motion` mód végigjátszva — minden réteg helyettesítéssel él.
- [ ] Mobilon a motion **egyszerűsítve, nem levéve** (Réteg 1 marad).
- [ ] Pixel-scan: nincs túlfolyás, átfedés, klipping animáció közben és után.

---

## 2. Pillér — Design (anti-generikus)

**Cél**: az oldal ne legyen felismerhetően AI-generált. A piaci kutatás szerint az AI-oldalak
~40%-a design-hibás, és a hiba oka szinte mindig a kihagyott identity-munka.

### Kötelező irány

- **A tipográfia vezet**: karakteres display-font, `clamp()`-szal viewportra skálázott méretek,
  `text-balance` a címeken; display : body kontraszt legalább 2,5× méretben a hero-címen.
- **Kompozíciós ritmus**: editorial szerkezet, kicker + vonal elemek, tág szekció-ritmus,
  nagy, tartalmas lábléc.
- **Valódi imagery**: minden képnek tartalmi célja van; üres placeholder, lorem vagy
  „semmi" kimenetre nem megy.
- **Mobil saját art direction**: nem zsugorított desktop — ritmus, méretek és hit-targetek
  (≥ 44 px) mobilon újratervezve.

### Design-elemek 2026 — választható paletta (min. 2 él a projekten)

broken grid · bento-szekciók · oversized/viewport-scaled display-típus · grain/dither
textúra · editorial kompozíció · sticky/pinned narratíva-szekciók · custom vonalas
ikonkészlet · nagy lábléc tangibilis adatokkal.

### Tilalomlista (kizáró okok — ezek bármelyike verziót nem enged ki)

- default tipográfia + lila gradient kombináció (a „generikus AI-look" alapja);
- emoji mint ikon;
- lorem ipsum vagy üres szakasz a leadott verzióban;
- szimmetrikus, három-kártyás generikus szekció-sor egyetlen variáció nélkül;
- kitalált üzleti adat (l. 7. pillér);
- „AI-hang" szöveg (l. 7. pillér).

---

## 3. Pillér — SEO + AEO/GEO

A hagyományos SEO önmagában nem elég: a kutatás ~25%-os organikus visszaesést jelez előre
az AI-keresésen nem átlépő oldalaknak. A célpont egyszerre a Google és a válaszmotorok
(Google AI Overviews, ChatGPT, Perplexity).

### Technika (minden indexelhető oldalon)

- [ ] `title` ≤ 60 karakter, `meta description` 140–160 karakter, egyedi oldalonként.
- [ ] Canonical URL (perccel záró, beszédes, kisbetűs, ékezet nélküli forma).
- [ ] OG- és Twitter-kártya minden oldalon, dedikált OG-grafikával a kulcsoldalakon.
- [ ] Pontosan **1 db h1** oldalonként; a heading-sorrend nem ugrik szintet.
- [ ] JSON-LD: Organization/LocalBusiness (kötelező), BreadcrumbList, FAQPage minden
      kérdés-válasz szekción — build előtt validálva.
- [ ] `sitemap.xml` **1:1-ben** az indexelhető kanonikus halmazzal (eltérés = buktató);
      404 `noindex`; nincs `noindex` indexelhető oldalon.
- [ ] **Belső linkgráf**: minden oldal legalább 3 belső bejövő linket kap; rokon tartalmak
      egymásra linkelnek (kétirányúan).

### Tartalom (AEO/GEO)

- [ ] Kérdés-című, közvetlen választ adó szakaszok (a válasz az első mondatban).
- [ ] Konkrét számok, példaszámítások, források — a GEO-kutatás szerint az idézet és a
      statisztika a legerősebb idéztényező az AI-válaszokban.
- [ ] E-E-A-T jelek: tapasztalat, szerző/forrás feltüntetése, aktualitás.
- [ ] AI-crawlerek (GPTBot, PerplexityBot, ClaudeBot stb.) a robots-ban **nincsenek blokkolva**,
      kivéve a megbízó explicit kérését.

---

## 4. Pillér — Teljesítmény (mérve, nem remélt)

Core Web Vitals küszöbök (p75, 2026): **LCP < 2,5 s · INP < 200 ms · CLS < 0,1**.
A mindháromon áteső oldal mérhetően jobb rangsorolást és ~24%-kal alacsonyabb bounce-ot kap.

- [ ] LCP-elem: modern formátum (AVIF/WebP), méretre szabva, `fetchpriority="high"`, **nem lazy**.
- [ ] Minden kép/videó/embed méretezve (`aspect-ratio` / width+height) → CLS-védelem.
- [ ] Fontok: max. 2 család, subsett woff2, `font-display: swap`, fallback-méret-igazítás.
- [ ] JS: minden nagyobb szkript késleltetve/darabolva (long task < 50 ms); az animációhoz
      **CSS először** — GSAP/Lenis csak a Signature-réteghez (1. pillér, Réteg 3).
- [ ] Lighthouse (desktop + mobil) minden nagyobb változás után; performance-cél ≥ 90,
      alatta iteráció, nem engedély.
- [ ] A mért értékek (előtte-utána) bekerülnek a handoffba.

---

## 5. Pillér — Akadálymentesség (WCAG 2.2 AA — EAA-compliance)

Az **European Accessibility Act 2025. június 28. óta** EU-s jogi kötelezettség (magyar
cégekre is vonatkozik) — a WCAG 2.2 AA a referencia-szabvány. Ez compliance-tétel, nem kiegészítő.

- [ ] Kontraszt: szöveg ≥ 4,5:1, nagy szöveg ≥ 3:1, UI-alkatrész ≥ 3:1 (a palettában
      számokkal feltüntetve, l. Nulladik szabály).
- [ ] Fókusz: mindig látható (`focus-visible`), sorrend logikus; skip-link a fő tartalomhoz.
- [ ] Minden funkció elérhető billentyűvel; nincs trap nélküli, de nem elhagyható modál.
- [ ] Touch-cél ≥ 44 px (szabványunk; a WCAG 2.5.8 minimuma 24 px, az enyhébbet nem fogadjuk el).
- [ ] Minden tartalmi képnek értelmes `alt`-ja van; dekoratív elem `aria-hidden`.
- [ ] űrlapok: minden mezőhöz tartozó `<label>`; hibaüzenet szövegben + `aria-describedby`,
      nem csak színben.
- [ ] axe-audit: **0 kritikus sérülés** desktopon és mobilon, minden útvonalon.

---

## 6. Pillér — Mobil (360 px első)

- [ ] 360 px szélességen audit: nincs vízszintes túlfolyás, átfedés vagy vágás egyetlen
      útvonalon sem.
- [ ] Mobilmenü: minden fő oldal 2 koppintáson belül; nyitva a háttér-görgetés zárolva.
- [ ] Touch-célok ≥ 44 px; kritikus gombok nem a képernyő szélén és nem csúszkázó elem alatt.
- [ ] Body-szöveg ≥ 16 px (iOS zoom-gátlás), sorköz ≥ 1,5.
- [ ] Motion mobilon egyszerűsítve (Réteg 1), nem eltávolítva (l. Motion QA).

---

## 7. Pillér — Tartalom, bizalom, jog

### Adatfegyelem (a leggyakoribb AI-buktató)

- Minden üzleti adat (ár, cím, telefonszám, nyitvatartás, név, referencia) **valós forrásból**
  jön — a megbízótól, meglévő tartalmából vagy hivatalos forrásból.
- **Kitalálás tilos**: ha egy adat nincs meg, a felhasználót kell megkérdezni — sosem
  felvenni sehol sem „hogy legyen valami".

### Emberi hang

- Rövid, konkrét mondatok; számok szövegbe építve.
- **Zsargon-tilalom**: „dinamikus", „innovatív", „forradalmi", „prémium minőségű szolgáltatás"
  jellegű üres klisék cserélendők konkrétumra.

### Bizalom és jog

- Trust-jelek: valós referencia, konkrét ár vagy várakozási idő, elérhetőség minden oldalon.
- **Cookie-consent opt-in**: a nem-esszenciális cookiek addig blokkolva, amíg hozzájárulás
  nincs; az elutasítás legalább olyan egyszerű, mint az elfogadás (implicit consent érvénytelen).
- Adatvédelmi tájékoztató + impresszum minden éles oldalra.

---

## 8. Pillér — Funkcionális minőség

Bármely űrlap, foglalás, rendelés, belépés vagy adatvisszatöltő folyamat esetén:

- [ ] Kliens- **és** szerver-oldali validáció; explicit hiba- és sikeres állapot mindkettőn.
- [ ] Beküldés: loading-állapot, duplikátum-védelem (idempotens kezelő vagy letiltott gomb),
      sikeres visszaigazolás.
- [ ] Minden állapot megtervezve: üres, betöltés, hiba, siker.
- [ ] **„Mockolt kész" nem kész**: a folyamat addig nem leadható, amíg valós végpontja
      nincs, vagy a megbízó nem írta alá a mock-állapotot.

---

## 9. Munkafolyamat

1. **Kutatás** — az iparág és 2–3 versenytárs felmérése: mitől legyünk mások (mit keresnek
   az emberek, mit kínálnak rosszul a meglévők).
2. **Identity-brief** — a Nulladik szabály szerint; megbízói jóváhagyással.
3. **Build** — a pillérek szerint, motion-tokens-en át.
4. **Mért QA** — build + axe + Lighthouse + 360 px audit + motion-check + pixel-scan.
5. **Iteráció** — minden elkapott hibából legalább egy új ellenőrzőpont születik.
6. **Handoff** — mérési eredményekkel (CWV-számok, axe-eredmény, ismert kompromisszumok).

## 10. Ellenőrzési kultúra

- **A nem futtatott ellenőrzés NEM VERIFIKÁLT — sosem PASS.**
- A saját implementáció **nem hagyhatja jóvá önmagát**: a QA-t friss szemmel, külön lépésként
  futtatni (független QA-lépés vagy executor).
- Bármely blocker-ellenőrzés FAIL → a munka nincs kész; NOT_VERIFIED → nincs kész.
- Hibából szabály: minden elkapott hiba legalább egy új ellenőrzőpontot kap a handoffban.

## Zárás — kapulánc

Minden kérés lezárásakor kapulánc fut: **DAEKON-projektben `npm run daekon`** (kapulánc +
team-executorok + riport); egyéb projektben a fenti mért QA-lánc (build + axe + Lighthouse +
360 px + motion-check) a kapulánc. **Verdict PASS nélkül a munka nincs kész.**

## Gyors-ellenőrzőlista (minden leadás előtt)

- [ ] Art-direction-brief létezik és jóváhagyott (Nulladik szabály).
- [ ] Motion: Réteg 1 teljes; Signature-pillanatok működnek és 60 fps-ek; reduced-motion helyettesítve.
- [ ] Nincs egyetlen tilalomlista-elem sem a verzióban (2. pillér).
- [ ] SEO: meta/canonical/OG, 1 h1, JSON-LD valid, sitemap 1:1, min. 3 belső link minden oldalon.
- [ ] CWV: LCP < 2,5 s, INP < 200 ms, CLS < 0,1 — méréssel.
- [ ] WCAG 2.2 AA: axe 0 kritikus sérülés; kontraszt, fókusz, keyboard, 44 px touch-cél.
- [ ] 360 px: tiszta layout, működő mobilmenü.
- [ ] Tartalom: minden adat forrásolt; zsargon- és placeholder-mentes; opt-in consent éles.
- [ ] Funkciók: minden folyamat valós végponton, teljes állapotrendszerrel.
- [ ] Kapulánc lefutott, verdict PASS.
