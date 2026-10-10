# Memória: tech-scout

## Állapot (2026-10-02)
- Registry létrehozva: 8 live, 5 candidate, 1 rejected.
- Legfontosabb élő technológiák: Next 15 statikus export, Tailwind 4 @theme tokenek, Space Grotesk, CSS scroll-driven motion, gzip-harness, PWA-lite, OG-pipeline, llms.txt.

## Segmens-működés (2026-10-02)
- A radar minden `npm run daekon` futásban ellenőrzi a live-technológiák jelenlétét az exportban (font, animation-timeline, .gz, manifest, llms.txt).
- Következő beépítési kör javaslat: View Transitions + speculation-rules a kalkulátorra.

## Következő jelöltek (a registry-ből)
- 2026-10-03 (logó-kutatás, user kérés): **mcp-recraft** (valódi vektor-kimenetű képgenerálás — logó/ikon nyersanyagnak) és **mcp-figma-devmode** (design→kód kontextus) candidate a tech-registry-be került; ebben a környezetben egyik MCP sem telepíthető önállóan — user-engedély + konfig kell. Új skill: skills/logo-design.md (anti-AI checklist: kevés szín, nincs SVG-szöveg, nem szó szerinti, vektor/favicon-teszt, szándékos jellem). Vektor-iteráció eszköze: logo-lab.html (canvas-raszterizált tónustérkép-mérés — a screenshot-kiesés helyettesítője is).
- View Transitions (oldal-feel), Popover API (menü), speculation-rules a kalkulátorra, details-animáció, text-wrap-balance kiterjesztés.
- MCP-konnektorok (user hozzáadta, 2026-10-02): supabase — 'soderarak' projekt (eu-central-1, PG17) INACTIVE/paused, séma nem olvasható aktiválás nélkül; sentry — 'soderarak-kj' org, 0 projekt (nincs bekötve). Mindkettő candidate: csak mért, perf-kapu-barát beépítés (deferred SDK) — aktiválás/projektkreálás előtt user-engedély.
- qa-regression skill (daekon-quality-master) él a skills-ben — de NINCS benne az agents.json rosterben: összekötni vagy törlés mellett dönteni.
- LEZÁRVA (2026-10-03): qa-regression bekötve — roster-tag + 6. kapu (gate-qa-regression, blocker, npm run qa:regression → daekon/agents/qa-regression.mjs). Független QA az out/ artificekből (meta, OG→PNG, hash-bázis, sitemap, JSON-LD, site.ts-adatok). FAIL-ág scratch-exporttal is verifikálva (11 blocker, exit 1).

## Megtanult szabályok
- 2026-10-03 (CTA-pozíciós térkép, user kérés): `npm run cta:map` (scripts/cta-position-map.mjs) minden route × 360/1280 × CTA first-seen percent — a scroll_depth adat közvetlen vetítéséhez (metrics-plan §12, mért táblákkal). Két lecke: (1) a display:none ős alatt a gyerek computed display-je VÁLTOZATLAN — a rejtettséget a getClientRects().length mutatja (mobile_call_bar sm:hidden asztalon: gyerek display marad flex, rects=0); (2) a fixed/sticky-t az ŐSÖKÖN is keresni kell (MobileCallBar: fixed a wrapperen, nem az a-n). TDZ-csapda újra leutánozódott evaluate-ben: a használat ELŐTT deklarálj (regionOf). Az artifact a runs/ alá megy, NEM az out-ba (az zippelne). Melléktermékek: arak_cta új régió + data-guardian-javítás (arak oldalon beégetett tel:+36... site.ts helyett company.phone.raw-ból).
- 2026-10-03 (GA4 riport-terv, tech-scout-kutatás): GA4 egyéni dimenziók nélkül az event-paraméterek riportolhatatlanok — a terv a Admin → Egyéni definíciók lépést is tartalmazza (route→olvasasi_route, percent→olvasasi_melyseg, call_location→hivas_helye, mobil→mobil_olvaso; mind Esemény-hatókör). Kombinált nézet (scroll_depth × route × call_location) kétszintű sor-töréssel oldható meg, MERT a két dimenzió-készlet két különböző eseményen él — egyetlen sorban csak az egyik telik (a terv a korlátot is dokumentálja). A riport-kész kód állapot: scroll_depth + call_click + arkalkulator_submit mind dataLayerben élőben verifikálva.
- 2026-10-03 (CSS cache-csapda): a Next két különböző CSS-tartalmat is ugyanazon fájlnév alatt adhat ki (megfigyelve: d71139589bb5e92d.css) → immutable böngésző-/szerver-cache mellett a visszatérő látogatók RÉGIES CSS-t kaptak volna. Javítás az Export QA-ban (prepare-static-export.mjs): minden hivatkozott megosztott CSS tartalom-hashelt névre neveződik (alap-.8char-sha256), HTML-hivatkozások átírva, nem hivatkozott css/.gz törölve. TANULSÁG: deploy előtt ellenőrizd, hogy a CSS-fájlnév változott-e, ha a CSS változott.
- A beépítés sorrendje: jelölés → kis próba → mérés → live/rejected. A mérés nélküli beépítés tilos.
- 2026-10-02 18:06 radar: 8 live (4/5 ellenőrzött él), 5 jelölt
- 2026-10-02 18:53 radar: 8 live (4/5 ellenőrzött él), 5 jelölt
- 2026-10-02 19:11 radar: 8 live (4/5 ellenőrzött él), 5 jelölt
- 2026-10-02 20:31 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-02 20:40 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-02 21:14 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-02 21:24 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-02 21:29 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-02 21:35 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-02 22:42 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-02 22:57 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-02 23:06 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-03 06:14 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-03 06:27 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-03 06:58 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-03 07:22 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-03 07:38 radar: 9 live (4/5 ellenőrzött él), 7 jelölt
- 2026-10-03 08:20 radar: 9 live (4/5 ellenőrzött él), 9 jelölt
- 2026-10-03 08:39 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 09:22 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 09:36 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 09:51 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 10:16 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 11:22 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 11:33 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 11:42 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 11:48 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 11:56 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 12:10 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 12:22 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 12:30 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 12:46 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 12:50 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 12:54 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 12:57 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 13:00 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 13:03 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 13:04 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 13:09 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 13:12 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 13:36 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 13:58 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 13:59 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 14:05 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 14:53 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 15:31 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 16:00 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 16:10 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 16:47 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 16:52 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 17:00 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 18:37 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 19:02 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 19:08 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 19:59 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
- 2026-10-03 22:06 radar: 9 live (5/5 ellenőrzött él), 9 jelölt
