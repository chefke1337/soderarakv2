# Memória: perf-engineer

## Állapot (2026-10-02)
- / 94–95, /utmutatok/ és kulcsoldalak 99 (gzip_static-szimulált harness).
- Főoldal LCP: TTFB 5 ms, render-delay ~112 ms — egészséges; a 94–95 a maradék JS-TBT (hyd. komponensek ~101 kB) miatt van.
- Legnagyobb átvitel: Fraunces 700 woff2-k (85 kB latin-ext normal + 48 kB latin), Next chunkok.
- Font: Fraunces csak 700 (6→2 fájl trimelve); 36 @font-face (Inter 4 súly × 9 subset + Fraunces 2).

## Állapot (2026-10-03, mobilsáv + ring + ScrollSensor után)
- / **96/100** (azonos gzip-harness, mobil emuláció) — a sáv előtti 94–95 bázishoz képest NINCS mérhető regresszió; SEO/BP/a11y 100/100, CLS 0,054.
- Kulcsroute-ok teljes funkciókészlettel (ScrollSensor + kompakt sáv + átmenetek + bloom): / 96 (TBT 190ms, CLS 0,07), /utmutatok/ 99 (TBT 80ms), /anyagok/soder/ 99 (TBT 90ms), /teruletek/erd/ 99 (TBT 80ms) — a sáv előtti 99-es kulcsoldal-bázis változatlan. CLS / 0,054→0,07: a kártya-sürítés layout-változásához köthető (a szenzor/átmenetek nem generálnak layoutot), zöld (<0,1). Jegyzet: lab-mérés nem görget → a szenzor görgetési idejű költségét nem gyakoroltatja, a mount-költség benne van.
- scripts/lh-json.mjs bővítve: LH_CATEGORIES env (alap: performance — kapuk változatlanok). Konverziót a Lighthouse NEM mér: valódi adat a GA4 call_click (analytics.ts), de GA_ID nincs beállítva — ha konverziót akarunk mérni, előbb GA-t kell élesíteni.

## LCP/TBT A/B sorozat (2026-10-03 este) — a 95–97 a mennyezet
Mért alap (3+ futás, konzisztens): **95–97** — FCP 909–915 (score 1,0), **LCP 1808–1958 (0,97–0,98)**, **TBT 187–228 (0,82–0,88)**, CLS 0,047–0,070 (0,95), SI 1349–1414 (1,0). Variancia: LCP ±0,2 s, TBT ±40 ms, CLS futásfüggő (0,047 vagy 0,070).

**Mért karok — mind elutasítva (A/B, ≥2 futás):**
| Kar | Eredmény | Miért |
|---|---|---|
| Space Grotesk font-preload (probe, previous session) | **90** (FCP 0,9→1,8, LCP 2,0→3,5) | a preload linkek priority:High-jal a CSS elé tolódnak a sorban → minden később érkezik |
| Blokkoló CSS (prepare-static-export átalakítás visszavonva) | **87–89** (FCP 2266, LCP 3471–3621, **TBT 27–41, CLS 0**) | styled first-paint = Lantern CSS→4 betű-lánc (176 kB) + valós Chrome is bevárja a betűket (filmstrip: tartalom csak ~750 ms-kor) |
| Teljes inline CSS (`<style>`, link nélkül) | **87** (FCP 2488, LCP 3474, TBT 77, CLS 0) | nincs hálózati CSS-lánc, mégis FCP≈2,5 s → a betűk a styled paint-hez kötve |
| Space Grotesk `display:"optional"` | **95 = nulla nyereség** (LCP 1809–1959) | a Lantern az optional-t is a LCP-láncra fűzi; cserébe valós fallback-fejsor-kockázat |

**GYÖKÉROKOK (trace-igazolt, `LH_TRACE=1` + `scripts/trace-tasks.mjs`):**
- **CLS 0,05–0,07 = az async CSS (FOUC) ára.** Shift1: 0,01 @188 ms = UA body-margin 8px → preflight 0 (old_rect [7,8]→[0,0]). Shift2: 0,037–0,06 @460 ms = hero-régió + mobilsáv ugrás a képfestés (LargestImagePaint@431) utáni style-recalc-ban (node-ok 52–60px lefelé). Betű-swap KIZÁRVA (a next/font size-adjust fallback nem shiftel). CSS-blokkoló/inline karokban CLS 0 — de FCP 2266–2488 = −8 pont. **Az async FOUC a legjobb pontszámú konfiguráció.**
- **LCP = FCP + ~900 ms betű-lánc** (h1.rise a LCP-elem; TTFB 5 ms, raw render-delay 93 ms; a +900 a szimulált doc→CSS→Space Grotesk lánc). Betű-preload és optional is mért negatív/nincs hatás. További tér csak betű-subsettinggel (pyftsubset NINCS; `subset-font` npm wasm lenne a opció — SG 42→~15 kB ≈ +0,3 pont, de magyar glyph-lefedettségi kockázat).
- **TBT 187–228 = FOUC-kettős layout (raw 38+86 ms) + React-hydratáció (raw 96+56 ms a 1255/4bd1b chunkokon)** — a styled-paint karokban TBT 27–41-re esne, de ott dől be FCP. React statikus oldal padlója: ~100–150 ms.
- **Inter 4 súly = ugyanaz a variable fájl subsetenként** (weight:400 és 500 ugyanazt a woff2-t mutatja) → súlyvágás NEM takarít bájtot. Inter 134 kB (latin 85,5 + latin-ext 48,7), SG 42 kB (22,5+19,2); vietnamese/cyrillic/greek subsetek unicode-range miatt nem töltődnek.
- DOM ~895 elem, cv-auto 10 szekción a home-on; unused-javascript [] ; render-blocking (async alapban) [] ; bootup scripting ~215 ms.

**Következtetés: a jelenlegi async-FOUC konfiguráció a helyi maximum.** Maradék mikrotér (mérés nélkül, alacsony ROI): body{margin:0} prestyle (+~0,2 pont), SG-subsetting (+~0,3 pont).

## Megtanult szabályok
- Mindig gzip_static-szimulált harness-szel mérj — a tömörítetlen mérés félrevezető.
- Git Bash-ben a `/` argumentum útvonallá konvertálódik: elé `MSYS_NO_PATHCONV=1`.
- Eszközök: `node scripts/lh-json.mjs "/" .lh-home.json` + `node scripts/lh-diag.mjs .lh-home.json`. **Trace: `LH_TRACE=1` a lh-json mellé → .trace.json; `node scripts/trace-tasks.mjs <trace> [ms]` = hosszú taskok felbontása (RenderMain thread: `args.name`, NEM `args.data.name`).**
- További tér: JS-TBT csökkentés (kalculátor/leaflet lazy) — csak mért hatással; **A/B kötelező, a LCP/TBT variancia ±0,2 s / ±40 ms: minimum 2 futás/kar.**
- A perf kapu advisory (minLighthouse 90, `perfNotes` nem buktat) — de a `render-blocking-resources` audit LH 13-ban NINCS (csak `render-blocking-insight`).
