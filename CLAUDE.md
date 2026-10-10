# Premium Web Agency Operating System

## Mission

Build exceptionally polished, conversion-oriented, accessible and production-ready websites.

The standard is not “a working website”.
The standard is a high-end digital agency delivery:
- clear strategy
- intentional visual hierarchy
- distinctive but restrained art direction
- excellent responsive behavior
- fast performance
- accessible interaction
- maintainable component architecture
- no generic AI-looking output

## Core workflow

Before implementation, create or update:

1. `docs/brief.md`
2. `docs/brand-context.md`
3. `docs/sitemap.md`
4. `docs/design-system.md`
5. `docs/implementation-plan.md`
6. `docs/decisions.md`

Do not begin major UI implementation until the design system and implementation plan exist.

## Source of truth hierarchy

When information conflicts, follow this order:

1. Explicit user instructions
2. Existing production code and brand assets
3. `docs/brand-context.md`
4. `docs/design-system.md`
5. `docs/implementation-plan.md`
6. Agent recommendations

Never silently invent client facts, testimonials, awards, metrics, legal claims, addresses or product capabilities.

Use clearly marked placeholders when required information is missing.

## Design quality bar

Avoid generic templates and predictable AI layouts.

Do not automatically use:
- purple gradient hero sections
- excessive glassmorphism
- oversized empty hero areas
- random floating cards
- too many rounded rectangles
- generic stock-style wording
- excessive animation
- arbitrary shadows
- tiny low-contrast text
- multiple competing primary CTAs

Every page must have:
- one clear primary action
- clear visual hierarchy
- intentional spacing rhythm
- accessible color contrast
- mobile-first layout behavior
- semantic HTML
- meaningful loading, empty and error states where applicable

## Technical standards

Use:
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- reusable components
- semantic HTML
- accessible keyboard navigation
- responsive images
- optimized fonts
- minimal client-side JavaScript
- server components by default

Do not introduce a dependency without a concrete reason.
Do not modify package versions unless necessary.
Do not expose secrets or API keys.
Never commit `.env` files.

## Performance targets

Aim for:
- Lighthouse performance: 90 or higher
- accessibility: 95 or higher
- best practices: 95 or higher
- SEO: 95 or higher

Avoid layout shift.
Reserve image dimensions.
Use dynamic import only where it genuinely improves startup performance.
Use animation only if it supports hierarchy, feedback or storytelling.

## Collaboration rules

All agents must:
- read the relevant docs before acting
- write decisions to `docs/decisions.md`
- state assumptions explicitly
- work only within their delegated responsibility
- avoid overwriting unrelated work
- return concise findings, changed files and unresolved questions

The orchestrator alone approves:
- architectural changes
- dependency additions
- large refactors
- final design direction
- production-release actions

## Inherited constraints from DAEKON

This project already shipped through a bespoke QA/orchestration system called
DAEKON (`daekon/`, `AGENTS.md`). Its 13-role persona/orchestrator layer
(`daekon/orchestrator.mjs`, `daekon/agents.json`, the per-role memory/skill
prompt files) is retired in favor of the agents in `.claude/agents/`. Its
**automation is not retired** — the real gate scripts under `scripts/` and
`daekon/agents/*.mjs` are still load-bearing and are the actual checks every
agent must run (see each agent file for which ones). The rules below are
hard-won lessons extracted from `daekon/memory/*.md` and `daekon/skills/*.md`
that remain true regardless of which persona layer is running.

**Data discipline**
- All business data (prices, zones, settlements, phone, hours, company name)
  comes from `src/content/site.ts` only. Never hardcode a literal
  `tel:+36...` or price in a page component — always interpolate from
  `company.phone.raw` / site.ts. A literal `tel:` href on `/arak` was found
  and fixed this way once already (2026-10-03) — treat a recurrence as a bug.
- Two renderings of the same fact (price, zone range) must never disagree.
  Example calculations (8 m³ 0/24 = 132 000 Ft anyag + 12–22e fuvar) must
  stay numerically identical everywhere they appear.
- GA4 is intentionally not activated yet (no real Measurement ID from the
  client) — don't invent or wire one up; `.env.local` stays empty until the
  client provides a real `G-` ID.

**Brand system already in place — extend, don't relitigate without reason**
- Color tokens (`src/app/globals.css`): paper `#faf6ef`, ink `#1c1917`,
  brand `#f97316` / brand-dark `#c2410c` / brand-deep `#9a3412` / brand-soft
  `#ffedd5`, petrol `#0f766e` / `#134e4a` / `#99f6e4`, moss `#3f6212`,
  basalt `#1a1614`. These replaced an earlier amber palette after explicit
  user direction — don't drift back to that.
- **2026-10-04 update, also explicit user direction:** petrol/moss had come
  to dominate the homepage's two large dark sections (hero top, closing CTA
  bottom) via the blurred `.aurora` glow blobs and the hero's radial-gradient
  wash — user felt the green read as too heavy there. Those two sections'
  glows now use new warm tokens `--color-terracotta` (`#b1543a`) and
  `--color-amber-glow` (`#d6a24a`) instead. This is a narrow, surgical swap,
  not a palette reversion: petrol/moss themselves are **not removed** and
  stay correct everywhere else they already appear with a functional or
  secondary role — the Buda Konténer cross-promo band's teal CTA (a
  deliberate visual distinguisher from the sister brand, see
  `src/app/page.tsx`'s "Hulladék promo" section), the trust-section
  checkmark icon, the zone-card accent-dot rotation, and the thin
  `rendelés`-section divider line. Don't extend the warm swap to those, and
  don't reintroduce petrol/moss as a *dominant* large-surface color on new
  sections without the same direction being restated.
- Display font is **Space Grotesk** (`--font-grotesk`), body is Inter — a
  serif display face (Fraunces) was tried and explicitly rejected by the
  user as "weird/buggy". Space Grotesk has no italic; emphasis uses
  `.em-accent` (brand-soft color + underline), not `<em>`/italic.
- The truck logomark (`src/components/LogoMark.tsx`) went through two
  rejected rounds (an abstract gravel-bucket mark, then a trapezoid v2) —
  user feedback both times was "very weak" — before landing on the current
  flat industrial dump-truck silhouette. Before proposing any new mark or
  icon system, read `daekon/skills/logo-design.md`'s anti-AI checklist and
  reuse its evaluation method (`logo-lab.html` canvas tone-map measurement
  at 96/48/24/16px) rather than judging by eye alone.
- Motion is deliberately CSS-first/zero-JS where possible (scroll-driven
  `.rise`/`.reveal` animations, `.glow-ring` conic border), always guarded
  by `prefers-reduced-motion`.

**Known fragile spots**
- `.glow-ring` (globals.css) had one prior fix (mask-composite ring instead
  of a leaking conic disc) and a second distinct bug fixed today
  (2026-10-04): a `<span class="glow-ring inline-flex ...">` wrapper inside
  a `flex-col` parent stretches full-width via `align-items: stretch`, but
  the inner button only matched its content width unless it also had
  `w-full` — producing a half-filled button on mobile. Any new `glow-ring`
  usage needs `w-full` (or equivalent) on the inner element.
- `content-visibility: auto` sections need an explicit
  `contain-intrinsic-size`, or axe reports false-positive contrast issues.
- Mobile spacing has already been compacted multiple times down to its
  accessibility floor (44px hit targets, 12px chip text, 14px body text).
  A request to "make it smaller/tighter" again should be checked against
  that floor, not applied blindly.
- Performance is already at a measured local maximum (~95-97 Lighthouse on
  home) after a documented A/B series — font-preload, blocking CSS, and
  `font-display: optional` were all tried and measured *worse*. Don't
  re-attempt those without a new measurement.
- Any color/token rename must be grepped globally across `src/**` and
  `src/lib/og.tsx` — the OG-card renderer keeps its own copy of brand
  colors and drifts silently otherwise.

**Still-valid automation (use these, don't recreate them)**
- `npm run og:hash` / `npm run og:gallery` — OG-card pixel-regression gate;
  any visual change that touches `src/lib/og.tsx` or brand colors needs a
  gallery review + `npm run og:hash:update` after.
- `npm run test:a11y`, `npm run test:mobile`, `npm run perf:lighthouse`,
  `npm run cta:map` — real browser-driven audits (Playwright/axe/Lighthouse),
  not just lint/build.
- `npm run daekon:fast` — quick static gate (build + OG regression) for fast
  iteration; **a fast PASS is never a release verdict**, only the full
  `npm run daekon` (or the equivalent full manual check) is.

## Definition of done

A task is complete only when:
- it satisfies the brief
- it passes type checking
- it passes linting
- it builds successfully
- it works on mobile, tablet and desktop
- accessibility issues are addressed
- SEO metadata is present when relevant
- design is reviewed against the design system
- no placeholder or debug content remains unless explicitly approved
