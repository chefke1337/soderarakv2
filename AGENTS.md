# DAEKON Agent Protokoll — soderarak.hu (ARCHIVÁLVA, 2026-10-04)

> **Ez a dokumentum és a 13-szerepes DAEKON perszóna/orchestrátor-réteg
> (`daekon/orchestrator.mjs`, `daekon/agents.json`, `daekon/memory/*.md`,
> `daekon/skills/*.md`) le van váltva a `CLAUDE.md` + `.claude/agents/`
> rendszerre, user-döntés alapján (2026-10-04).** A DAEKON *automatizálása*
> (a tényleges szkriptek: `scripts/*.mjs`, `daekon/agents/*.mjs`, az
> `og:hash`/`test:a11y`/`test:mobile`/`perf:lighthouse`/`cta:map` npm
> parancsok) **továbbra is él és kötelező** — ezeket az új agentek
> (`.claude/agents/quality-auditor.md`, `frontend-engineer.md`) hivatkozzák.
> A korábbi tanulságok (adatfegyelem, brand-tokenek, logó-folyamat, ismert
> törékeny pontok, mért teljesítmény-plafon) a `CLAUDE.md` "Inherited
> constraints from DAEKON" szekciójába lettek átemelve. Ez a fájl csak
> történeti referenciaként marad meg, nem törlődik.

---

Minden feladat — kis vagy nagy — ezen a folyamaton fut. Ez nem ajánlás, hanem kötelező minta.

## Alapszabályok
1. **Minden kérés indításkor**: olvasd `daekon/agents.json` (roster, kapuk) és a vállalt szerep memóriáját `daekon/memory/<agent>.md` — a memória a korábbi tanulságok összegzését tartalmazza, ne ismételj meg lezárt hibákat.
2. **Minden kérés lezárásakor**: `npm run daekon` (kapulánc + team). Verdict PASS nélkül a munka nincs kész.
3. **Tanulság-visszaírás**: minden a szokásostól eltérő felfedezés (root cause, mérési meglepetés, felhasználói korrekció) kerüljön a szerep memóriájába 1-2 sorban.
4. **Az elérhetetlen ellenőrzés NEM VERIFIKÁLT** — sosem PASS.
5. **Üzleti adat csak `src/content/site.ts`-ből.**

Új weboldal-projekthez a copy-paste-kész Freebuff-mission: `docs/freebuff-mission.md`.

## Dispatch-tábla — melyik agent melyik kérésre

| Kérés típusa | Első agent | Támogató | Kötelező kapuk utána |
|---|---|---|---|
| Vizuális/redesign/UI | visual-master | designer | og:gallery + pixel-scan |
| Szöveg/tartalom/cikk | content-writer | seo-specialist | a11y (heading-struktúra) |
| SEO (meta, sitemap, indexelés) | seo-specialist | content-writer | seo-audit executor |
| AEO/kérdés-válasz struktúra | aeo-specialist | content-writer | JSON-LD validáció (build QA) |
| OG-kártya | og-artwork | visual-master | og:gallery + pixel-scan |
| Teljesítmény | perf-engineer | a11y-auditor | perf kapu mérés előtte-utána |
| A11y/hit-target/kontraszt | a11y-auditor | mobile-auditor | axe + 360px |
| Mobil elrendezés | mobile-auditor | a11y-auditor | 360px audit |
| Üzleti adat/ár/zóna módosítás | data-guardian | seo-specialist | og:hash (kártyák!) |
| AI-szöveg-emberiesítés / zsargon | humanizer | content-writer | humanize-scan + teljes lánc |
| Technológia/elem/MCP kutatás-beépítés | tech-scout | designer + perf-engineer | tech-radar + teljes lánc |
| Hibajavítás/QA-találat | error-analyst | az érintett terület agentje | teljes lánc |
| Kompetitor/piaci kérdés | competitor-analyst | seo-specialist | competitor-watch executor |
| Deploy/release | release-certifier | — | DAEKON verdict PASS + checklist |

## Csapat-futtatás

```bash
npm run daekon              # kapulánc + team executors (5) + riport + LOG (RELEASE)
npm run daekon:fast         # gyors kör: build + og + qa (böngészős kapuk + team KIHAGYVA)
                            #   csak iterációhoz; fast PASS NEM release-verdict!
                            #   külön riport: daekon/daekon-report-fast.md
npm run daekon:seo          # csak SEO-audit executor
npm run daekon:humanize     # humanizer scan (--apply: csere)
npm run daekon:tech         # tech-scout radar
npm run daekon:competitors  # kompetitor-figyelő (lista engedéllyel bővítendő)
npm run daekon:watch        # háttér-őr indítása (periodikus Export QA)
npm run qa:regression       # független QA-executor (6. kapu, daekon-quality-master)
```

A team-executorok eredménye a riportba és a memóriákba íródik. A szerepek skilljei:
`daekon/skills/<nev>.md`; memóriák: `daekon/memory/<nev>.md`; futási rekordok: `daekon/runs/`.
A humanizer lexikona: `daekon/humanizer-lexikon.json`; a tech-nyilvántartás: `daekon/tech-registry.json`.
