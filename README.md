# Sóderárak

Bulk building-material (gravel/sand/gravel-mix) delivery site for Budafok,
Budapest, Hungary. Next.js App Router, static export, Tailwind CSS 4.

## Stack

- Next.js 15 (App Router, `output: "export"`), React 19, TypeScript (strict)
- Tailwind CSS 4 (`@theme` tokens in `src/app/globals.css`)
- Leaflet for the service-area map
- All business data (prices, zones, settlements, phone, hours) lives in
  `src/content/site.ts` — the single source of truth; never hardcode a
  price or phone number in a component

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → static export in `out/`, plus Export QA and OG-card hash-regression check |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`next/core-web-vitals` + `next/typescript`) |
| `npm run test:a11y` | axe WCAG A/AA across every exported route (desktop + mobile + mobile-menu). Add `DAEKON_FULL_AUDIT=1` to force a full run instead of the cached/skip-if-unchanged default. |
| `npm run test:mobile` | 360px layout + tap-target audit, same `DAEKON_FULL_AUDIT=1` override |
| `npm run perf:lighthouse` | Lighthouse on key routes |
| `npm run og:gallery` | Renders every OG card to `og-gallery.html` for visual review (gitignored, regenerate on demand) |
| `npm run og:hash` / `og:hash:update` | OG-card pixel-regression check against `scripts/og-baseline.json`, and the command to intentionally update that baseline after a reviewed change |

See `CLAUDE.md` for the full governing process, brand-system history, and
known fragile spots; `docs/project-audit.md` and `docs/implementation-plan.md`
for current project status.

## Branches

- `master` — frozen baseline snapshot from before the 2026-10 audit/redesign
  work started; never force-pushed or rewritten.
- `redesign/premium-v2` — the active design/quality-polish line.
- `improvement/audit-and-quality-*` — dated working branches for audit passes,
  branched off `redesign/premium-v2`.

## Environment

Copy `.env.example` to `.env.local` and fill in real values to enable GA4 /
Search Console verification. Left empty, the site runs with no analytics and
no banner — this is the correct default until a real GA4 Measurement ID is
available. Never commit `.env*`.
