# Design system

This documents the **existing, already-approved** visual system
(see `docs/brand-context.md` for its history) and proposes specific,
evidence-based refinements to close the gap to a "high-end agency" bar —
it is not a new visual language. Any point below marked **Proposed change**
is a judgment call for the user to confirm before Phase 6 implements it;
everything else is "as-built, keep."

# Creative direction

- **Visual thesis:** an industrial-but-warm bulk-materials merchant —
  concrete/gravel-world dark basalt and paper-cream sections punctuated by
  a confident construction-orange, not a generic "trustworthy blue SaaS"
  look.
- **Brand personality:** direct, fast, locally-rooted (Budafok), numbers-first.
- **Emotional target:** "these people will actually show up today with
  the right material" — competence and speed, not polish-for-its-own-sake.
- **Anti-direction:** must not read as a generic logistics/SaaS template
  (no blue gradients, no abstract corporate iconography, no stock-photo
  trucks) — the existing flat-illustration logomark and aurora-glow dark
  sections already serve this; don't dilute them with generic components.

# Typography

- Display: Space Grotesk (no italic — use `.em-accent`). Body: Inter.
  Both self-hosted. **Keep as-is** — a serif alternative was already tried
  and rejected.
- Type scale currently: `text-4xl`→`text-6xl` hero h1, `text-2xl`→`text-3xl`
  section h2, `text-base`/`text-sm` body — consistent across pages per spot
  check of Home/Árak/Kapcsolat.
- **Proposed change:** the home page mixes `font-display text-lg/xl/2xl/3xl`
  across different card titles (material cards, price groups, FAQ) without
  a single documented scale — worth collapsing to 3-4 named sizes
  (`heading-lg/md/sm`, `body`) as Tailwind `@theme` tokens so new pages stop
  guessing a size, rather than a visual change.

# Color

- Tokens as in `docs/brand-context.md`. Paper/ink for light sections, basalt
  for dark sections (hero, footer, final CTA), brand-orange as the one
  accent color reserved for CTAs and emphasis — petrol/moss are decorative
  (aurora blobs, conic ring) and should stay secondary, never used for text
  or buttons (this is already the convention; keep it explicit so future
  work doesn't promote them).
- Contrast: already axe-clean (WCAG A/AA, 45/45 routes, verified this audit).
- **Proposed change:** none to the palette itself. The one real color issue
  found (`docs/qa-report.md` item 2) is a *content* decision (whose logo
  appears in the header), not a token problem.

# Layout

- Grid: `max-w-6xl` content container, consistent across pages.
- Spacing: `Section.tsx` drives vertical rhythm (`py-10` mobile / `py-20`
  desktop after prior compaction rounds) — already tuned close to its
  floor; see CLAUDE.md "known fragile spots" before compacting further.
- **Proposed change:** none structural. The two-column `Kapcsolat` layout
  (content + sticky aside) is a good pattern already; consider reusing it
  for the Árkalkulátor page if that page currently stacks everything in one
  column — `[needs a direct look at ArkalkulatorForm.tsx's page layout
  before committing to this, not yet verified in this pass]`.

# Components

- **Buttons:** solid `bg-brand-dark` primary, outline secondary, `.glow-ring`
  spinning-border treatment reserved for the two highest-priority phone
  CTAs (hero, final section). **Proposed change:** apply (or deliberately
  not apply) `.glow-ring` consistently — right now one of three homepage
  phone CTAs is unstyled plain-outline (qa-report item 6); pick one rule
  and document it here instead of leaving it ambiguous.
- **Navigation:** 8-item desktop nav + phone CTA button; `<details>`-based
  mobile menu (no JS framework needed) — keep, it's accessible and simple.
- **Cards:** consistent `rounded-md border border-line bg-paper shadow-card`
  pattern across material/zone/guide cards — keep.
- **Forms:** `ArkalkulatorForm.tsx` already handles the mailto-failure
  state with a fallback phone CTA — keep this pattern for any future form.
- **Badges/labels:** `kicker` (small uppercase + `h-px w-8` line) pattern
  used consistently per `Section.tsx` — keep.
- **Icon usage:** line icons from `src/lib/ui.tsx` (no emoji) — keep, this
  is already an enforced rule (`daekon/skills/visual-direction.md`).
- **Image treatment:** flat SVG material textures, not photography — keep,
  consistent with the "not generic stock" anti-direction.

# Motion

- Purpose: feedback and continuity only — CSS scroll-driven `.rise`/`.reveal`
  entrances, `.glow-ring` spinning border on primary CTAs, header
  show/hide on scroll via cumulative-hysteresis (not per-frame delta, a
  documented past bug fix).
- Timing: 150-800ms range, all `prefers-reduced-motion`-guarded.
- **What must remain static:** body text, price tables, forms — already
  the case.
- **Proposed change:** none — the motion system is already restrained and
  measured (see perf-engineer memory: several heavier motion/preload ideas
  were A/B tested and rejected for performance). Don't add new animation
  without a repeat of that measurement discipline.

# Design guardrails (repo-specific, in addition to CLAUDE.md's generic list)

- Never hardcode a price, zone, phone number, or settlement name — always
  `src/content/site.ts`.
- Never introduce a new primary accent color — brand-orange is the only
  one used for CTAs/links; petrol/moss stay decorative.
- Never add an animation without before/after Lighthouse numbers (perf
  ceiling is already measured at ~95-97 on home).
- Never propose a new logomark/icon direction without reading
  `daekon/skills/logo-design.md` and running the `logo-lab.html` evaluation
  method — this team already burned two rejected rounds skipping that
  process.
