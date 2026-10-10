# QA report — 2026-10-04

Scope: full repo audit after the DAEKON→`.claude/agents` migration, on branch
`redesign/premium-v2`. All checks below were actually executed in this
environment; results are real tool output, not estimates.

## Critical

None found.

## High

1. **Lint has effectively never run in this project.** `npm run lint`
   invokes `next lint`, which requires an interactive ESLint setup prompt
   because no `.eslintrc*` / `eslint.config.*` exists anywhere in the repo
   (`package.json:19`). In a non-interactive environment this blocks
   rather than reports pass/fail — so "lint passes" has likely never been
   a true statement for this codebase. **NOT_VERIFIED**, not PASS. Needs
   an explicit choice (Strict vs Base Next.js ESLint config) before it can
   be enforced — a judgment call, not something to silently default.

2. **Brand inconsistency introduced today.** `src/components/Header.tsx`
   now shows the **sister company's** (Buda Konténer) truck illustration
   (`public/buda-kontener-logo-sotet-3.png`) next to the "Sóder/Árak"
   wordmark, replacing the purpose-built `LogoMark.tsx` mark that survived
   three design iterations and explicit user approval (see
   `docs/brand-context.md`). A first-time visitor has no way to know these
   are two separate, deliberately-separated brands (the sister site is
   only ever mentioned as a one-line text link in the footer/contact page,
   never visually). This needs an explicit decision, not a silent revert
   or a silent keep.

## Medium

3. **Orphaned files after today's header change.** `src/components/LogoMark.tsx`
   and `public/kamion-homok.png` are no longer imported anywhere in `src/`
   (confirmed via grep). Not deleted per the "don't remove without proving
   unused and documenting why" rule — flagging for an explicit decision
   alongside item 2.

4. **`.glow-ring` wrapper pattern is fragile — second bug found in it.**
   `globals.css`'s `.glow-ring` (used on the two primary phone CTAs on the
   homepage, `src/app/page.tsx`) already had one prior fix (a leaking
   conic-gradient border, fixed 2026-10-03 per `daekon/memory/mobile-auditor.md`).
   Today a second, distinct bug was found and fixed: the wrapping `<span>`
   stretches full-width in a `flex-col` mobile layout, but the inner
   `PhoneLink` button didn't, producing a half-filled button (reported by
   the user as "csak a fele van kitöltve narancssárgával"). Fixed by
   adding `w-full` to the inner element in both occurrences
   (`src/app/page.tsx`, hero + final-CTA sections). Any **new** use of
   `.glow-ring` should get a mobile screenshot check before shipping.

5. **A real bug in the project's own mobile-audit tooling was blocking Phase 4.**
   `scripts/mobile-layout-audit.mjs`'s `selectorFor()` helper produced an
   invalid CSS selector (`"div."`, trailing dot) for any out-of-bounds
   element with no `id` and no `class`, crashing the entire script with an
   uncaught `SyntaxError` the moment it hit such an element (it reached
   `/arkalkulator/` before crashing in this run). Fixed in this audit
   (now falls back to a bare tag-name selector when there are no classes).
   This means **the mobile-layout gate has likely been silently unable to
   complete a full run** whenever a route contained such an element —
   worth confirming how long this has been broken.

## Low

6. **Inconsistent CTA treatment on the homepage.** Two of the three phone
   CTAs on `/` use the `.glow-ring` spinning-border treatment (hero,
   final-CTA section); the third, in the "rendelés" steps section
   (`data-call-region="rendeles_cta"`, `src/app/page.tsx` ~line 261), is a
   plain outlined button. This may be intentional de-emphasis at that
   scroll depth, but it reads as inconsistent rather than deliberate —
   worth a design-system decision either way.

## Passed checks (real output, not estimated)

| Check | Command | Result |
|---|---|---|
| TypeScript | `npm run typecheck` | **PASS** — 0 errors |
| Production build | `npm run build` | **PASS** — 95/95 pages generated, Export QA: 45 HTML pages / 45 OG images / 41 canonical pages ↔ 41 sitemap URLs all matched |
| OG-card regression | (part of build) | **PASS** — 44/44 card hashes matched the baseline |
| Accessibility (axe WCAG A/AA) | `npm run test:a11y` | **PASS** — 45/45 routes, desktop + mobile + mobile-menu states, 0 violations |
| Mobile layout (360px) | `DAEKON_FULL_AUDIT=1 npm run test:mobile` (after fixing item 5) | **PASS** — 45/45 routes, no horizontal-scroll, clipping, or hit-target findings |
| Performance (Lighthouse) | `DAEKON_FULL_AUDIT=1 npm run perf:lighthouse` | **/ 96/100**, `/utmutatok/` `/anyagok/soder/` `/teruletek/erd/` all **100/100** — matches the documented 95-97 local-maximum ceiling; no regression from today's changes |
| Data discipline spot-check | manual read of `arak`, `kapcsolat` pages | **PASS** — no hardcoded `tel:`/price literals found; all interpolated from `src/content/site.ts` |

## Manual verification needed

- ESLint configuration choice (item 1) — needs a human decision on rule strictness, not an automatic default.
- Header logo direction (items 2-3) — needs explicit user sign-off before Phase 6 touches the header further.
- Subjective "premium agency" visual bar — addressed as concrete proposals in `docs/design-system.md`, not measurable by a script.

## 2026-10-04 — Hero/closing-CTA warm-palette change, re-verified

Added entry: the green-dominance reduction in the homepage hero and closing
CTA (see `docs/design-direction.md`, `docs/decisions.md`) was validated with
a full re-run, not assumed safe: typecheck PASS, lint PASS, build PASS
(95/95, OG-hash 44/44 unchanged), axe PASS 45/45 (forced full run — this is
the contrast check), mobile PASS 45/45 (forced full run), Playwright
screenshots at 375px/1280px confirm no new horizontal-scroll and clear text
legibility over the new terracotta/amber-glow backgrounds.
