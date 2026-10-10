# Sitemap & page architecture

This refines the *existing* information architecture (45 static routes,
8-item nav) — it is not a new product structure. Dynamic routes
(`/anyagok/[anyag]`, `/teruletek/[telepules]`, `/utmutatok/[slug]`) share one
template each; they're documented once below rather than per-instance.

## Global navigation (`src/content/site.ts: nav`)

Anyagok · Árak · Árkalkulátor · Szállítás · Területek · Útmutatók · Rólunk · Kapcsolat
— 8 items, already confirmed to fit the 1024px breakpoint without wrapping
(`daekon/memory/seo-specialist.md`). Persistent header phone CTA + fixed
mobile call bar on every page except `/kapcsolat` (which has its own CTA).

## Home (`/`)

1. **Visitor intent:** "Can this company deliver what I need, fast, near me?"
2. **Primary conversion goal:** phone call.
3. **Secondary goal:** start the price calculator.
4. **Section order (as built):** Hero (badge + h1 + lead + phone/calculator CTA) → StatBand (trust numbers) → Anyagaink (6 material cards) → Árlista (accordion) → Így működik (3-step process + CTA) → Miért mi (3 USPs) → Hol szállítunk (zone cards + settlement chips) → final dark CTA (phone/calculator repeat) → GYIK (9-question accordion).
5. **Why that order works:** proof-then-ask pattern — establish what's sold and what it costs before asking for the call, then a second call-to-action after the trust/zone section for visitors who scrolled past the first one. The two `.glow-ring` phone CTAs (hero + final) bracket the page; a plain-styled third phone link sits mid-page in the steps section (flagged in `docs/qa-report.md` item 6 as a minor inconsistency, not necessarily wrong).
6. **Primary CTA:** phone (`company.phone.display`, `tel:` link).
7. **Trust evidence present:** delivery zone/time specifics, minimum/maximum order volume, own fleet + depot, same-day claim for the core zone. **Trust evidence absent:** no testimonials, no review count, no "years in business" badge beyond the capabilities bullet list — any addition here needs real client input, not invented numbers.
8. **Mobile adaptation:** hero CTAs stack full-width (`flex-col`, now correctly filled after today's fix); fixed bottom call bar persists across scroll; sections already compacted to a measured accessibility floor (see CLAUDE.md "known fragile spots") — further mobile density reduction should be checked against that floor, not applied blindly.

## Árak (`/arak`)

1. **Intent:** "What does my material actually cost?"
2. **Primary goal:** start calculator or call.
3. **Secondary goal:** none — this page is itself often the secondary step from Home.
4. **Sections:** per-material-group price tables (6) → zone delivery-price cards (3) → disclosure note → calculator/phone CTA row.
5. **Why:** full transparency builds trust for a price-sensitive, comparison-shopping visitor; CTA only after all numbers are visible.
6. **Primary CTA:** Árkalkulátor; phone as equal-weight secondary (not `.glow-ring`-styled — plain outline, correctly de-emphasized since this page is already price-focused).
7. **Trust evidence:** explicit "nettó, ÁFA nélkül" + "tájékoztató ár" disclosure — sets expectations rather than oversells.
8. **Mobile:** tables are in `overflow-x-auto` regions with `role="region"` — acceptable pattern, already a11y-labeled.

## Anyagok hub + `/anyagok/[anyag]` (6 pages)

1. **Intent:** "Which material do I actually need?" (education-first visitor).
2. **Primary goal:** route to Árak or Árkalkulátor once the material is identified.
3. **Secondary goal:** internal link into relevant Útmutatók guides.
4. **Sections (per-material page):** description → use cases → price table slice → related guide links.
5. **Why:** this is the top-of-funnel educational entry point for search traffic ("milyen sódér kell X-hez") — should bridge to a conversion page within 1-2 clicks, not dead-end.
6. **Primary CTA:** Árkalkulátor / Árak link.
7. **Mobile:** material texture SVGs already compacted (per mobile-auditor memory).

## Árkalkulátor (`/arkalkulator`)

1. **Intent:** "Give me an exact number before I call."
2. **Primary goal:** micro-conversion (`arkalkulator_submit` GA4 event already instrumented, dormant until GA4 is activated) ending in a `mailto:` summary — **not** a server-side lead form (static export has no backend).
3. **Secondary goal:** fallback to phone if the mail client doesn't open (`ArkalkulatorForm.tsx` already handles this failure state).
4. **Primary CTA:** submit → email client; phone as explicit fallback.
5. **Trust evidence:** real zone/price data driving the live estimate.
6. **Mobile:** controlled form inputs already verified against React 19 controlled-input quirks (per data-guardian memory).

## Területek hub + `/teruletek/[telepules]` (15 pages)

1. **Intent:** "Do you deliver to my town, and how fast/much?"
2. **Primary goal:** phone call once zone/time is confirmed.
3. **Sections (per-settlement page):** zone assignment + price range + lead time → FAQ (JSON-LD only, no visible accordion on this template — confirmed in mobile-auditor memory, not a bug) → phone CTA.
4. **Why:** hyper-local SEO landing pages; the visitor already knows their town, so the zone/price answer should be above the fold.
5. **Mobile:** zone map component (`ZonaTerkepLazy`) is lazy-loaded — good for LCP on a page where the map isn't the primary conversion element.

## Útmutatók hub + `/utmutatok/[slug]` (11 guides)

1. **Intent:** informational/how-to search traffic (AEO-oriented: question-shaped H2s with self-contained answers, per `aeo-specialist` memory).
2. **Primary goal:** bridge to Anyagok/Árak/Kapcsolat via bidirectional cross-links (an existing, enforced rule — every new guide links to ≥2 existing ones and vice versa).
3. **Mobile:** inline phone link already confirmed present after a prior gap was found and fixed (data-guardian memory, 2026-10-03).

## Kapcsolat (`/kapcsolat`)

1. **Intent:** ready-to-convert visitor looking for the fastest path.
2. **Primary goal:** phone call (large, first-visible phone CTA).
3. **Secondary goal:** email / calculator / map / settlement list.
4. **Sections:** map + served-settlements chips (left) → phone card, email card, waste-sister-brand note (sticky right rail on desktop).
5. **Why:** this page deliberately has its own call CTA and therefore suppresses the fixed mobile call bar (`MobileCallBar` returns `null` on `/kapcsolat`) — correct, avoids a duplicate.

## Rólunk, Szállítás

Supporting/trust pages; not separately audited for IA changes in this pass — `[CLIENT INPUT NEEDED: confirm no changes requested here before Phase 6 touches them]`.
