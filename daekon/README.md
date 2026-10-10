# DAEKON Agent Orchestrator

Futtatható DAEKON-minőségrendszer: 13 agent-szerep, kapulánc, team-executorok,
memóriák és tanuló napló. Minden kérés az [AGENTS.md](../AGENTS.md) folyamán fut.

```bash
npm run daekon              # kapulánc + team executors + riport + LOG (release-lánc)
npm run daekon:fast         # gyors iterációs kör: csak a `fast: true` kapuk
                            #   (gate-static + gate-og + gate-qa-regression);
                            #   böngészős kapuk és team-executorok KIHAGYVA
npm run daekon:seo          # csak SEO-audit executor
npm run daekon:competitors  # kompetitor-figyelő (lista engedéllyel bővítendő)
npm run daekon:watch        # egyszeri export-őr; háttérben: node daekon/agents/watch.mjs 10
npm run deploy:package      # deploy-zip a dist/ alá
```

## Roster (13 szerep)

| Agent | Szerep | Skill | Memória |
|---|---|---|---|
| visual-master | Root: irány + orchestráció | skills/visual-direction.md | memory/visual-master.md |
| designer | Art-directed UI-kompozíció | skills/designer.md | memory/designer.md |
| content-writer | Magyar tartalom | skills/content-writer.md | memory/content-writer.md |
| seo-specialist | Meta, sitemap, linkgráf | skills/seo-specialist.md | memory/seo-specialist.md |
| aeo-specialist | Kérdés-válasz struktúrák | skills/aeo-specialist.md | memory/aeo-specialist.md |
| og-artwork | OG-kártyák + pixel-QA | skills/og-artwork.md | memory/og-artwork.md |
| perf-engineer | Lighthouse, LCP/TBT | skills/perf-engineer.md | memory/perf-engineer.md |
| a11y-auditor | WCAG A/AA | skills/a11y-auditor.md | memory/a11y-auditor.md |
| mobile-auditor | 360px élmény | skills/mobile-auditor.md | memory/mobile-auditor.md |
| data-guardian | site.ts-adatfegyelem | skills/data-guardian.md | memory/data-guardian.md |
| error-analyst | Hibaminták → szabályok | skills/error-analyst.md | memory/error-analyst.md |
| competitor-analyst | Piaci megfigyelés | skills/competitor-analyst.md | memory/competitor-analyst.md |
| release-certifier | Független verdict | skills/release-certification.md | memory/release-certifier.md |

## Kapuk (daekon/agents.json)

1. **gate-static** — typecheck + build + Export QA (a build része az OG-drift kapu).
2. **gate-og** — OG sha256 regresszió a `scripts/og-baseline.json` bázishoz képest.
3. **gate-a11y** — axe WCAG A/AA minden exportált route-on (desktop + mobil + mobilmenü).
4. **gate-mobile** — 360px elrendezési és hit-target audit.
5. **gate-perf** — Lighthouse a kulcsroute-okon (advisory: a MIN_SCORE alatti eredmény riportba kerül).

## Verdict-szabály (release-certifier)

- Minden **blocker** kapu PASS → **PASS**.
- Bármely blocker FAIL → **FAIL**.
- Bármely blocker NOT_VERIFIED (a kapu eszköze nem futott) → **NOT_VERIFIED**.
  *A nem elérhető ellenőrzés NEM VERIFIKÁLT — sosem PASS.*
- Üres blocker-halmaz → **NOT_VERIFIED** (vacuous PASS tilos — a `--fast` módban
  ezért hibázik, ha nincs `fast: true` kapu a manifestben).

## FAST mód (`npm run daekon:fast`)

- Cél: **iteráció** — a `daekon/agents.json`-ban `"fast": true` jelölt kapuk futnak
  (build + og + qa), a böngészős kapuk (a11y/mobile/perf) és a team-executorok nem.
- A riport külön fájlba megy: `daekon/daekon-report-fast.md` — a
  `daekon-report.md` mindig a legutóbbi **teljes** futás eredménye marad
  (a deploy-checklist arra hivatkozik).
- A runs-rekord `mode: "fast"` mezőt kap, a LOG-be `*(fast)*` jelölés kerül.
- **A fast PASS NEM release-verdict.** Release előtt kötelező a teljes
  `npm run daekon` (deploy-checklist 1. lépés).

## Szerepek

A `visual-master`, `quality-master` és `release-certifier` szerepek skill-fájljai a
`daekon/skills/` alatt vannak: minden agent-session (emberi vagy gépi) ezeket követi.
A quality-master sosem hagyja jóvá a saját implementációját; a certifier csak a kapu-
kimenetekből dönt.

## Bővítés

Új kapu = új bejegyzés a `daekon/agents.json` `gates` listájában (`command` + `risk`).
A riport és a LOG minden futásnál frissül; a kapu-eredmények gépileg is olvashatók
a JSON-futási rekordból (`daekon/runs/`).
