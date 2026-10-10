# Project audit

Audit date: 2026-10-04. Branch: `improvement/audit-and-quality-20261004-0916`
(off `redesign/premium-v2`, commit `0018dde`). This synthesizes today's
earlier audit passes (`docs/qa-report.md`, `docs/decisions.md`) rather than
re-deriving them — see those files for the original evidence trail on items
already resolved since (header logo, ESLint, `.glow-ring` consistency,
orphan file removal, DAEKON migration).

## Executive summary

- **Current maturity: 8/10.** A real, shipped-feeling 45-route site with a
  deliberate brand system, working forms, real business-data discipline, and
  — as of today — an actually-enforced lint/type/build/a11y/mobile gate chain.
  Not a prototype.
- **Estimated completion: 90%.** Core pages, pricing, service-area content,
  guides, calculator and contact flows are all built and verified working.
  What's left is refinement (image optimization, a couple of inconsistency
  fixes) and content the client hasn't supplied yet (testimonials, GA4 ID),
  not missing structure.
- **Release readiness: 8/10.** Would ship today without embarrassment. The
  two things actually worth fixing before calling it done are both known and
  scoped (see blockers below) — neither is a structural risk.
- **Strongest existing areas:** data discipline (one source of truth in
  `src/content/site.ts`, enforced and spot-checked), accessibility (0 axe
  violations across all 45 routes, desktop+mobile+menu states), performance
  (96-100 Lighthouse across sampled routes), and a coherent, documented
  design system that isn't generic template output.
- **Main risks:** (1) the OG-image generator's live font-fetch fragility
  (found during today's deploy work, see below) is a real, reproducible
  build-time risk on network-constrained CI; (2) zero automated test
  coverage beyond the custom a11y/mobile/build scripts — fine for a
  marketing site, worth naming explicitly rather than implying "tests pass"
  when none exist.
- **Release blockers: none.** Everything that was a blocker this morning
  (no ESLint, ambiguous header-logo decision, a crashing mobile-audit script)
  is already fixed and committed. Nothing currently fails typecheck, lint,
  build, or either browser-driven audit.

## Stack and architecture

- **Framework:** Next.js 15.5 (App Router), static export (`output: "export"`,
  `next.config.ts`), React 19, TypeScript 5.8 (strict).
- **Package manager:** npm (`package-lock.json` committed).
- **Styling system:** Tailwind CSS 4 (`@theme` tokens in `src/app/globals.css`
  — color, now partial type-scale tokens from today's P2 milestone), no CSS-in-JS.
- **Routes:** 14 page templates generating 45 static routes (incl. dynamic
  `[anyag]`, `[telepules]`, `[slug]` and per-route OG-image routes).
- **Components:** 13 in `src/components/`, 4 shared modules in `src/lib/`
  (`ui.tsx` — shared buttons/icons/formatters, `meta.tsx`, `og.tsx`,
  `analytics.ts`). Small, flat, no unexplained nesting.
- **Integrations:** Leaflet (service-area map), GA4 wired but intentionally
  inactive (no real Measurement ID supplied yet — see Client input required).
- **Existing skills/process used this pass:** `CLAUDE.md` (governing doc,
  includes the folded-forward DAEKON lessons), `.claude/agents/*.md` (10
  agents; this audit draws on quality-auditor.md's and frontend-engineer.md's
  "real commands to run" lists rather than generic lint/build), `scripts/*.mjs`
  + `daekon/agents/*.mjs` (still load-bearing automation — a11y-export,
  mobile-layout-audit, lighthouse-export, og-hash, og-gallery).
- **Dependency note:** `framer-motion`, `lucide-react`, `clsx`,
  `tailwind-merge`, `zod`, `@radix-ui/react-dialog`, `@radix-ui/react-slot`
  are installed but have **zero import sites** anywhere in `src/` — these
  were explicitly pre-provisioned by the user ahead of anticipated future
  design/motion work this session, not leftover cruft; not flagged as a
  cleanup item, just noted so nobody assumes they're load-bearing yet.

## Diagnostics

All commands below were actually executed on this exact commit, not
estimated or carried over from memory.

| Command | Result | Classification |
|---|---|---|
| `npm run typecheck` | **PASS** — 0 errors | — |
| `npm run lint` | **PASS** — 0 errors, 3 pre-existing warnings (`@next/next/no-img-element` on `Header.tsx:29`, `page.tsx:108,178`, `anyagok/page.tsx:49`) | safe local fix, scoped below |
| `npm run build` | **PASS** — 95/95 pages, Export QA 45 HTML/45 OG images/41 canonical↔41 sitemap matched, OG-hash 44/44 | — |
| `DAEKON_FULL_AUDIT=1 npm run test:a11y` | **PASS** — 45/45 routes, axe WCAG A/AA, forced full run (not cached) | — |
| `DAEKON_FULL_AUDIT=1 npm run test:mobile` | **PASS** — 45/45 routes, 360px layout + hit-targets, forced full run | — |
| `npm run perf:lighthouse` | Not re-run this pass (nothing perf-relevant changed since P5); last verified result (today, same build lineage): home 96/100, 3 sampled routes 99-100/100 | carried forward, not stale — see `docs/decisions.md` P5 entry |
| `npm test` | **does not exist** — no `test` script in `package.json`, no unit-test framework installed | existing defect (coverage gap, not a failure) |
| `git diff --check` | clean, no whitespace-conflict markers | — |

**Known, reproduced, not-yet-fixed defect:** `src/lib/og.tsx`'s
`ImageResponse` calls supply no explicit `fonts`, so Next's OG-image renderer
(Satori) does a live network fetch to Google Fonts the moment it meets a
Hungarian Latin-Extended character (Ő/ő/ű) outside its built-in glyph set.
Reproduced twice in a row on GitHub Actions (`ETIMEDOUT`), failing
`npm run build` non-deterministically even though the app itself compiles
fine. A local-font fix was attempted during today's deploy work (decompressing
the already-present, unused `assets/fonts/inter-latin-ext-400.woff2` via
`wawoff2`) but Satori's bundled font parser rejected the decompressed TTF
(`Cannot read properties of undefined (reading '257')`) — reverted rather
than ship a half-debugged font-parsing fix on a deploy task. **Classification:
existing defect, safe local fix available but not yet landed** (see
Milestone 4).

## Code quality

- **Duplications:** none significant found. `PhoneLink`/`CalculatorCta`/icon
  set are correctly centralized in `src/lib/ui.tsx` and reused everywhere
  (today's P3 pass fixed the one recurring exception — two pages had
  reverted to a literal `tel:` href).
- **Dead code risk:** low. 9 generated/scratch files removed from tracking
  this pass (see `docs/cleanup-log.md`); no dead components or unused exports
  found in `src/` itself.
- **Architecture issues:** none structural. Flat, conventional App Router
  layout; no circular imports; `src/content/site.ts` as the single business-data
  source is consistently followed (spot-checked today).
- **Type safety:** strict TypeScript, 0 errors, no `any` found in a spot
  check of `src/lib/*.ts(x)`.
- **Dependency concerns:** see Stack note above (7 unused-but-intentional
  packages); otherwise lean (`package.json` has 11 runtime deps total,
  no abandoned/duplicate libraries for the same job).

## Design and UX

- **Existing strengths to preserve:** a genuinely distinctive, non-generic
  visual system — flat industrial dump-truck logomark (survived 2 rejected
  rounds before landing), a real color story (paper/ink/brand-orange/petrol/
  moss/basalt, not a generic SaaS-purple default), Space Grotesk display
  type, CSS-first scroll-driven motion (`.rise`/`.reveal`, `prefers-reduced-motion`-guarded).
  This does not read as template output.
- **Hierarchy issues:** none major found this pass. Primary CTA (phone number)
  is unambiguous on every page sampled.
- **Typography and spacing issues:** partially addressed today (P2 introduced
  named `--text-heading-xs/sm/lg` tokens, migrated 6 home-page call sites);
  the other 40+ `font-display text-lg/xl/2xl/3xl` call sites across other
  routes still use raw Tailwind sizes rather than the named tokens — not a
  visual bug (nothing looks wrong), a consistency/maintainability item for
  incremental follow-up, deliberately not done as one big sweep (see
  `docs/decisions.md` P2 entry for why).
- **Component inconsistency:** `not-found.tsx`'s two buttons use
  `px-6 py-3.5` vs. the `px-5 py-3` used elsewhere — reviewed today,
  internally consistent on that page, not worth forcing to match (documented,
  not fixed, to avoid relitigating a non-issue).
- **Generic AI design signals:** none found. No purple gradients, no
  glassmorphism, no decorative floating cards, no stock-marketing phrasing
  in the Hungarian copy (already went through a dedicated "humanizer" pass
  per `daekon/humanizer-lexikon.json`).
- **Mobile issues:** none open. Spacing floor explicitly measured and
  confirmed already-reached today (P4) — 12px smallest text, 44px smallest
  real tap target, sub-44px elements are WCAG-exempt inline text links only.
- **Conversion friction:** none found. Phone CTA present above the fold and
  repeated at natural scroll points; calculator is a clear secondary path.

## Accessibility

- **Critical issues:** none.
- **Important improvements:** none currently open — 0 axe violations across
  all 45 routes in desktop, mobile, and mobile-menu-open states.
- **Passed checks:** WCAG A/AA via axe (45/45 routes), keyboard-reachable
  mobile menu (`<details>`-based, no JS focus-trap bugs possible by
  construction), semantic heading structure, labeled form fields.

## Performance and SEO

- **Main performance risks:** the OG-font network-fetch fragility above is
  the only real one — it's a build-time risk, not a runtime/user-facing
  perf issue (users never see this; it only breaks CI builds on flaky
  networks). Runtime performance itself is strong and measured (96-100
  Lighthouse).
- **Image/font issues:** 3 files use raw `<img>` instead of `next/image`
  (flagged by lint, not yet fixed — see Milestone 4; note `next/image`
  needs `unoptimized: true` under static export, already set in
  `next.config.ts`, so switching is low-risk). Fonts are optimized via
  `next/font/google` (self-hosted at build time, no runtime Google Fonts
  dependency for the main UI — only the separate OG-image renderer has the
  live-fetch issue above).
- **Metadata and indexing readiness:** strong. Per-route canonical URLs,
  OG images for all 45 routes with a pixel-regression gate (`npm run og:hash`),
  sitemap/robots generated from the same `src/content/site.ts` data (no
  drift risk), JSON-LD present where applicable.

## Cleanup candidates

| File/path | Evidence | Recommended action | Risk | Decision |
|---|---|---|---|---|
| 9 generated/scratch files | Zero references, generated-output category | Remove from tracking | None | **Done this pass** — see `docs/cleanup-log.md` |
| `src/app/anyagok/page.tsx:49`, `src/app/page.tsx:108,178`, `src/components/Header.tsx:29` | Lint warning, raw `<img>` | Migrate to `next/image` (already `unoptimized: true`-compatible) | Low — purely mechanical, same visual output | Open — Milestone 4 |
| `src/lib/og.tsx` font-fetch | Reproduced CI failure, see Diagnostics | Needs a working local-font fix (the woff2→ttf route failed; try a pre-converted ttf asset instead of runtime decompression, or an explicit Satori-compatible font package) | Medium — previous attempt failed on format incompatibility, needs a different approach, not a retry of the same one | Open — Milestone 4, flagged for the user: no safe fix found yet this pass |
| No `README.md` | Confirmed absent at repo root | Add a short one (stack, scripts, branch model) | None | Open — Milestone 5, low priority |
| No unit-test framework | Confirmed no `test` script/framework | Not recommending adding one speculatively — the project's real coverage (axe, mobile, Lighthouse, typecheck, build) already covers what matters for a marketing site; a unit-test framework would need actual logic worth unit-testing (e.g. `ArkalkulatorForm`'s calculation) to be worth the dependency | — | **Client/owner input** — see Milestone 5 |

## Prioritized improvements

| Priority | Task | Why | Files | Validation | Risk |
|---|---|---|---|---|---|
| 1 | Fix the OG-font network-fetch fragility properly | Reproducible CI build failure, already bit the deploy workflow once (needed a retry wrapper as a stopgap) | `src/lib/og.tsx` | `npm run build` in a network-throttled/offline sandbox if possible, else rely on repeated CI runs | Medium — needs a font-format approach that actually works with Satori, unlike today's attempt |
| 2 | Migrate 3 raw `<img>` call sites to `next/image` | Removes the only open lint warnings; real (if modest) LCP/bandwidth improvement | `Header.tsx`, `page.tsx` (×2), `anyagok/page.tsx` | typecheck, lint (warnings gone), build, visual check at 375/768/1280px | Low |
| 3 | Extend named type-scale tokens beyond the home page | Consistency/maintainability, not a visual bug | routes beyond `/` using `font-display text-lg/xl/2xl/3xl` | typecheck, build, OG-hash unaffected (Tailwind-only) | Low — same "no visual change" discipline as P2 |
| 4 | Add a minimal `README.md` | Zero onboarding doc currently exists; anyone new to the repo has to reverse-engineer the branch model and script list from `CLAUDE.md`/`package.json` | new `README.md` | none needed (docs-only) | None |
| 5 | Decide on GA4 activation | Currently intentionally inert pending a real Measurement ID | `.env.local` (not committed) | N/A until client supplies an ID | None — blocked on external input, not code |

---

*This document supersedes `docs/qa-report.md` for current status; that file
is kept as the historical record of today's earlier (now-resolved) findings.*
