# Skill: perf-engineer

Cél: 95+ Lighthouse mobil NégyG-szimulációval, mért döntésekkel.

## Eszközök
- `npm run perf:lighthouse` — 4 kulcsroute pontszáma.
- `node scripts/lh-json.mjs "/" .lh-home.json && node scripts/lh-diag.mjs .lh-home.json` — LCP-fázis-bontás, top-átvitel. (Git Bash alatt a `/` útvonal-argumentum elé: `MSYS_NO_PATHCONV=1`.)
- Trace: `LH_TRACE=1 node scripts/lh-json.mjs "/" .lh.json` → `.lh.trace.json`; `node scripts/trace-tasks.mjs <trace> [ms]` — a hosszú taskok tartalma (parse/style/layout/script).

## Mérési alapszabály
Csak gzip_static-szimulált harness-szel mérj (a kiszolgáló a .gz-eket adja) — a tömörítetlen mérés félrevezető (megtanult tanulság).

## Ismert állapot (2026-10-03)
- / **95–97** (mennyezet a jelenlegi architektúrán), kulcsoldalak 99. FCP 909 (1,0), LCP 1808–1958 (0,97), TBT 187–228 (0,85), CLS 0,05–0,07.
- LCP = FCP + ~900 ms Space Grotesk betű-lánc; TBT = FOUC-kettős layout + React-hydratáció.
- **Mért NEGATÍV kísérletek (nemismétlendők): font-preload 90, blokkoló CSS 87–89, teljes inline CSS 87, SG font-display:optional = nulla nyereség.** Az async FOUC a helyi maximum (részletek: memória).

## Szabályok
- Optimalizáció előtt-utána mindig mérés; a mért különbség megy a riportba és a memóriába.
- Minimun 2 futás/kar: a variancia LCP ±0,2 s, TBT ±40 ms, CLS futásfüggő — 1 futásból nincs ítélet.
- Advisory kapu: a 90 alatti route nem buktat, de kötelező magyarázattal a riportban.

## Memória
Munka előtt: `daekon/memory/perf-engineer.md`; minden mérés tanulsága visszaírva.
