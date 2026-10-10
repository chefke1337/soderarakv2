# Brand context — what already exists

This is not a greenfield brand. Significant, already-approved design
decisions exist; treat them as the baseline to refine, not invent.

## Visual identity history (from `daekon/memory/designer.md`, `visual-master.md`)

- An earlier amber palette and a serif display font (Fraunces) were tried
  and explicitly replaced after user feedback ("szecessziós szerifs
  fura/bugos" — the serif looked weird/buggy).
- The logomark went through **three** iterations before landing on the
  current one: an abstract "Rakat" (gravel-bucket) mark — rejected
  ("nagyon gyengék" / very weak) — then a trapezoid v2 — also rejected —
  then the current flat industrial dump-truck silhouette
  (`src/components/LogoMark.tsx`), chosen via an objective canvas tone-map
  evaluation at 96/48/24/16px (`logo-lab.html`, documented in
  `daekon/skills/logo-design.md`).
- 2026-10-04 (today): a second logo mark, `buda-kontener-logo-sotet-3.png`
  (the sister company's truck illustration, navy + orange, transparent
  PNG), was added to the header per direct user request, replacing the
  `LogoMark` SVG + `kamion-homok.png` decorative truck image that were
  there before. `LogoMark.tsx` and `kamion-homok.png` are still in the
  codebase but no longer referenced from `Header.tsx` —
  `[CLIENT INPUT NEEDED / DECISION: confirm this is the intended permanent
  direction, since it reuses the sister brand's mark on this brand's site;
  if not, LogoMark.tsx is the previously-approved, purpose-built mark]`.

## Current design tokens (`src/app/globals.css`)

Colors:
| Token | Value | Role |
|---|---|---|
| `--color-paper` | `#faf6ef` | page background |
| `--color-ink` | `#1c1917` | body text |
| `--color-ink-soft` | `#57534e` | secondary text |
| `--color-brand` | `#f97316` | accent |
| `--color-brand-dark` | `#c2410c` | buttons, links |
| `--color-brand-deep` | `#9a3412` | hover state |
| `--color-brand-soft` | `#ffedd5` | tinted backgrounds |
| `--color-petrol` | `#0f766e` / `#134e4a` / `#99f6e4` | secondary accent, dark-section motion |
| `--color-moss` | `#3f6212` | tertiary accent |
| `--color-basalt` | `#1a1614` / `#292524` | dark sections (header topbar, footer) |

Typography: Space Grotesk (`--font-grotesk`, display/headings — no italic,
emphasis uses `.em-accent` = brand-soft color + underline, not `<em>`),
Inter (`--font-sans`, body), both self-hosted (`assets/fonts/`).

Motion: CSS-first (`.rise`, `.reveal-l/r`, `.line-draw` scroll-driven
animations; `.glow-ring` conic-gradient border on primary phone CTAs),
all guarded by `prefers-reduced-motion`.

## Tone of voice (from existing Hungarian copy)

Direct, practical, number-forward — leads with concrete figures (m³, Ft,
delivery time) rather than adjectives. Avoids corporate-brochure language.
A "humanizer" pass already ran once to strip internal jargon (e.g.
"magövezet" → "Budafok és környéke") in favor of the terms customers
actually search for. Any new copy should match this register, not a more
generic "agency" voice.

## What this means for a redesign

The brand is not weak or generic — it's a deliberately art-directed system
that already survived several rounds of user rejection and correction. The
premium-upgrade work here should mean: tightening hierarchy, consistency,
and conversion flow on top of this system — not replacing the palette,
font, or logomark without a concrete, evidenced reason (see CLAUDE.md).
