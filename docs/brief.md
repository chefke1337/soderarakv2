# Brief

## Business

**Sóderárak** (soderarak.hu) — the bulk-material delivery business unit of
**Bau-Kont Logisztik Kft.**, based in Budapest XXII. kerület (Budafok),
1221 Budapest, Arany János út 152. Source: `src/content/site.ts`.

Sister business: **Buda Konténer** (budakontener.hu) — construction-waste
container rental, deliberately kept as a separate brand/domain, only
cross-linked (never merged into this site's content or pricing).

## What it sells

Bulk aggregate materials by net Ft/m³, delivered by truck:
- Sóder (gravel-sand mix): töltősóder, 0/4, 0/8, 0/16, 0/24
- Homok (sand): natúr, 0/1
- Kavics / Kulékavics (gravel): 4/8, 8/16, 16/32, 24/40, 30/65
- Murva (crushed stone): 2/5, kerti 5/12, kerti 12/20, 0/20, 20/55
- Bazalt (basalt) — `needsQuote: true`, no fixed price
- Föld (soil): natúr, darált

6 material groups, ~20 priced items (`src/content/site.ts`). Minimum order
4 m³, up to 23 m³ per delivery. Also offers on-site pickup at the depot.

Delivery (fuvar) is priced separately by zone, not by material:
- **Mag** (Budafok és környéke): 12–22k Ft, often same-day
- **Közeli** (Érd, Diósd, Törökbálint, Csepel, Szigetszentmiklós…): 18–32k Ft, scheduled
- **Távolabbi**: 25–45k Ft, scheduled

15 served settlements, each with its own `/teruletek/<slug>` page.

## Audience (inferred from content, not researched)

Homeowners and small contractors in southwest Budapest and the surrounding
settlements doing foundation work, driveways (kocsibeálló), concrete work,
or garden/landscaping projects — people who know roughly what material they
need (or can be told via the guides) and want a fast price + fast delivery.
`[CLIENT INPUT NEEDED: confirm whether B2B/contractor volume is a distinct
segment worth its own messaging, or if the site should stay homeowner-first]`.

## Primary conversion action

**Phone call.** Every page carries a `tel:` CTA; the fixed mobile bar
(`MobileCallBar`) is call-only. The price calculator (`/arkalkulator`) is
the secondary conversion path — it ends in a mailto: summary, not a form
submission to a backend (no lead-capture database exists in this project).

## Required pages (already built, 45 static routes)

Home, Árak (price list), Anyagok (material index + 6 detail pages),
Árkalkulátor, Szállítás, Területek (hub + 15 settlement pages), Útmutatók
(hub + 11 guide articles), Rólunk, Kapcsolat, Impresszum, Adatvédelem, 404.

## Constraints

- Static export (Next.js `output: export`-style build via
  `scripts/prepare-static-export.mjs`) — no server runtime, no database,
  no form backend. Any "submit a lead" feature needs a third-party service
  or `mailto:`/`tel:` fallback, not a custom API route.
- No real analytics yet — GA4 Measurement ID intentionally left empty
  (`.env.local`) until the client provides a real one. Don't activate or
  fabricate one.
- All prices/zones/settlements/company facts must come from
  `src/content/site.ts` only (see CLAUDE.md "Inherited constraints").
- No testimonials, reviews, certifications, or team-member content exist
  anywhere in the codebase — any of those in a future design must be
  `[CLIENT INPUT NEEDED: ...]` placeholders, never invented.
- Language: Hungarian only; no i18n routing exists.

## Assumptions (not verified with the client)

- The "15+ év tapasztalat" (15+ years experience) claim in
  `company.capabilities` is treated as an existing, already-approved claim
  (it predates this audit) — not something this audit should question
  further without evidence either way.
- No stated launch deadline; this audit treats the work as iterative
  polish on a live-ish site, not a from-scratch build under time pressure.
