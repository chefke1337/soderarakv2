# Implementation plan

Supersedes the previous version of this file (its "needs sign-off" items —
header logo, ESLint level, `.glow-ring` consistency — are all resolved; see
`docs/decisions.md` and `docs/qa-report.md` for that history). Grounded in
`docs/project-audit.md`, audit date 2026-10-04, branch
`improvement/audit-and-quality-20261004-0916`.

## Milestone 1 — Release blockers

None open. Everything that qualified this morning (no ESLint config, an
ambiguous header-logo state, a crashing mobile-audit script) is already
fixed and committed (`0018dde` and earlier on this branch). Typecheck, lint,
build, axe (45/45), and mobile (45/45) all currently PASS on real, forced
(non-cached) runs.

## Milestone 2 — Design-system and visual quality

- [x] **Reduce green (petrol/moss) dominance in the homepage hero and
      closing-CTA decorative backgrounds, shift to a warm sand/terracotta/
      amber direction** (2026-10-04, explicit user direction)
  - Files: `src/app/globals.css` (new `--color-terracotta` `#b1543a` /
    `--color-amber-glow` `#d6a24a` tokens), `src/app/page.tsx` (3 hero
    `.aurora` blobs + 1 radial-gradient layer, 2 closing-CTA `.aurora` blobs)
  - Why: user felt the green read as too dominant in the two large dark
    sections; logo/brand color and CTA status colors explicitly untouched;
    petrol/moss kept everywhere else (small/functional uses)
  - Validation: typecheck PASS, lint PASS, build PASS (95/95, OG-hash
    unaffected 44/44 — `src/lib/og.tsx` deliberately not touched), axe
    PASS 45/45 (forced full run, covers contrast), mobile PASS 45/45
    (forced full run), Playwright screenshots at 375/1280px confirm no
    horizontal overflow and clear text legibility over the new glows
  - Risk: Low — decorative-only change, same opacity/blur mechanism reused,
    no layout/structural change
  - See `docs/design-direction.md` for the full color rationale and exact
    before/after values.

- [ ] Extend named type-scale tokens (`--text-heading-xs/sm/md/lg`) beyond
      the home page to the other 13 route templates
  - Files: any route/component still using raw `font-display text-lg/xl/2xl/3xl`
    outside `src/app/page.tsx`, `PriceAccordion.tsx`, `StatBand.tsx` (already
    migrated)
  - Why: consistency/maintainability only — current rendering is correct,
    this just finishes naming what P2 started
  - Validation: `npm run typecheck`, `npm run build` (OG-hash should stay
    44/44 — Tailwind-only change), computed-style check that pixel sizes are
    unchanged (same method as P2: before/after getComputedStyle, not assumed)
  - Risk: Low — mechanical, same "no visual change" discipline as the
    already-landed P2 commit

- [x] Add a minimal `README.md` — done in a prior pass this branch (see
      `docs/decisions.md`).

## Milestone 3 — UX, responsiveness and accessibility

None open. Accessibility is 0 violations / 45 routes (desktop + mobile +
mobile-menu states, forced full axe run this pass). Mobile spacing floor
explicitly measured and confirmed already-reached (P4, 2026-10-04 — see
`docs/decisions.md`). No broken routes, forms, links, or responsive defects
found in this pass's diagnostics. Nothing to schedule here until a future
audit finds a real regression.

## Milestone 4 — Performance and SEO

- [ ] Fix the OG-image generator's network-dependent font fetch properly
  - Files: `src/lib/og.tsx`
  - Why: reproducible, non-deterministic `npm run build` failure on
    network-constrained CI (hit twice in a row on GitHub Actions during
    today's deploy work; currently only mitigated with a 3x retry wrapper
    in `.github/workflows/deploy-pages.yml`, not actually fixed). Root
    cause: no explicit `fonts` array passed to `ImageResponse`, so Satori
    live-fetches a fallback font for any Hungarian Latin-Extended character
    (Ő/ő/ű) outside its built-in set.
  - Validation: `npm run build` must succeed without network access to
    Google Fonts (test via a firewalled/offline run if possible); OG-hash
    gate must still pass for all 44 cards once a real fix lands
  - Risk: **Medium, needs real investigation, not a retry of today's
    approach** — decompressing the existing `assets/fonts/inter-latin-ext-400.woff2`
    via `wawoff2` produced a TTF Satori's bundled parser rejected
    (`Cannot read properties of undefined (reading '257')`); next attempt
    should try a pre-converted `.ttf`/`.otf` asset (avoid the runtime
    decompression step entirely) or confirm which exact font format/version
    Satori's bundled `@resvg`/font-parser actually accepts before trying
    again. Flagging as open rather than re-attempting blind in this pass.

- [ ] Migrate 3 raw `<img>` call sites to `next/image`
  - Files: `src/components/Header.tsx:29`, `src/app/page.tsx:108,178`,
    `src/app/anyagok/page.tsx:49`
  - Why: only open lint warnings in the repo; real (if modest) LCP/bandwidth
    win; `next.config.ts` already has `images.unoptimized: true` so this is
    compatible with the static export, not blocked by it
  - Validation: `npm run lint` (warnings gone), `npm run typecheck`,
    `npm run build`, visual check at 375/768/1280px (image dimensions
    preserved, no CLS introduced)
  - Risk: Low

## Milestone 5 — Final quality assurance

- [ ] Re-run `npm run perf:lighthouse` (forced, `DAEKON_FULL_AUDIT=1`) after
      Milestones 2 and 4 land, to confirm no regression from the accumulated
      changes
  - Files: none (verification only)
  - Why: both milestones touch render-affecting code (`next/image` swap,
    OG font fix) even though neither should regress perf
  - Validation: home should stay within the documented 95-97 ceiling; any
    drop needs investigation before calling the milestone done
  - Risk: None (verification step)

- [ ] `npm run og:hash:update` + `npm run og:gallery` review, only if the
      OG font fix changes any card's actual rendered pixels
  - Files: `scripts/og-baseline.json`
  - Why: a legitimate, expected baseline update (not drift) once the font
    rendering is intentionally fixed — must be a reviewed, deliberate update,
    not an automatic one
  - Validation: visual review of `og-gallery.html` before updating the hash
    baseline
  - Risk: Low, but requires a human look at the gallery before committing
    the new baseline — don't automate this step away

## Client input required

- [ ] Real GA4 Measurement ID
  - Why: `.env.local` is intentionally empty; analytics stays fully inert
    (no banner, no GA4 calls) until a real `G-` ID is supplied — this is
    correct current behavior, not a bug
  - Safe fallback: none needed — current inert state is the correct safe
    default until the client provides a real ID

- [ ] Decision on adding a unit-test framework
  - Why: no `test` script/framework exists; the project's real coverage
    (axe, 360px mobile audit, Lighthouse, typecheck, build, OG-hash
    regression) already covers what matters for a marketing/lead-gen site —
    adding Jest/Vitest speculatively would be dependency growth without a
    concrete target (the one piece of actual business logic worth unit
    testing, `ArkalkulatorForm`'s price calculation, could reasonably get
    one focused test suite if the client/owner wants that specific
    confidence; not recommending a general framework install without that
    call being made first)
  - Safe fallback: leave as-is; the existing gate chain is real coverage,
    just not unit-test-shaped
