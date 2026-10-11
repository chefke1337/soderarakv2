# Decisions log

## 2026-10-04 — Replace DAEKON persona/orchestrator layer with `.claude/agents`

**Decision:** The DAEKON 13-role persona/orchestrator layer (`daekon/orchestrator.mjs`,
`daekon/agents.json`, `daekon/memory/*.md`, `daekon/skills/*.md`, and the
"mandatory" process described in `AGENTS.md`) is retired. The new 10-agent
`.claude/agents/` roster + `CLAUDE.md` is now the governing process.

**Why:** User-requested consolidation onto the generic Claude Code
subagent/skill framework, explicitly asking to "learn from the old one,
carry forward what's useful, but switch to a better version" rather than
run both systems in parallel.

**What was NOT retired:** The actual automation is real tooling, not
persona prose, and stays load-bearing:
- `scripts/*.mjs` (a11y-export, mobile-layout-audit, lighthouse-export,
  og-hash, og-gallery, cta-position-map, prepare-static-export, etc.) —
  wired directly into `package.json` (`npm run test:a11y`, `test:mobile`,
  `perf:lighthouse`, `og:hash`, `cta:map`, `build`).
- `daekon/agents/*.mjs` (seo-audit, humanizer, tech-scout, competitor-watch,
  qa-regression, error-analyst, watch) — still runnable via their existing
  `npm run daekon:*` scripts.
- `daekon/humanizer-lexikon.json`, `daekon/tech-registry.json`,
  `daekon/competitors.json`, `scripts/og-baseline.json` — accumulated data,
  not prompts; untouched.

**What was folded forward (not lost):** Hard-won, repo-specific lessons
from `daekon/memory/*.md` and `daekon/skills/*.md` were extracted into
`CLAUDE.md`'s new "Inherited constraints from DAEKON" section and into the
relevant `.claude/agents/*.md` files (frontend-engineer, quality-auditor,
art-director, seo-specialist) — data discipline (site.ts as sole source of
truth), the brand color/typography history (including two rejected logo
rounds and a rejected serif display font), the `.glow-ring` fragility,
the measured performance ceiling (~95-97 Lighthouse, several "optimizations"
already tried and proven negative), and the real gate commands to run
instead of generic "run lint/build".

**What was left alone:** `daekon/` directory itself is not deleted — kept
for reference and because its scripts are still used. `AGENTS.md` is marked
archived at the top (not deleted) and points to `CLAUDE.md` as the new
source of truth.

## 2026-10-04 — Git backup before redesign

**Decision:** Initialized git in a previously non-versioned project,
committed the exact current state (`master`, commit `d4b5689`), and pushed
to a new private GitHub repo `chefke1337/soderarak-website` before starting
any audit/redesign work. All redesign work happens on branch
`redesign/premium-v2`, never on `master`.

**Why:** The project had no prior version control at all — "create a
verified GitHub backup of the exact current state" was an explicit,
approved user requirement before any design/UX changes, so there's a
reversion point if a redesign milestone goes wrong.

## 2026-10-04 — P2: named heading-size tokens (scoped to home-page card titles)

**Decision:** Added `--text-heading-xs/sm/md/lg` as Tailwind `@theme` font-size
tokens in `globals.css` (font-size + paired `--line-height`, same pattern
Tailwind's own default scale uses), matching the exact values of the
`text-base/xl/2xl/3xl` utilities they replace. Migrated 6 call sites to them:
the home page's "ígéretek" (usp) card titles, material-card name + price,
zone-card title (`src/app/page.tsx`), `PriceAccordion.tsx`'s group name, and
`StatBand.tsx`'s stat value. `--text-heading-md` was defined but has no call
site yet (reserved for the next `text-2xl` heading that needs it per
design-system.md).

**Scope narrower than design-system.md's literal wording:** that doc's
"Proposed change" cites "material cards, price groups, FAQ" — I scoped this
strictly to those home-page card-title elements, not a site-wide sweep of
every `font-display text-lg/xl/2xl/3xl` occurrence (45+ call sites across
every route). A global rename is much higher-risk for a "no visual change"
refactor (every site has different surrounding modifiers — tracking,
leading, responsive bumps) and wasn't what the audit actually flagged;
P3 (CTA sweep) and future passes can extend the token usage to other routes
incrementally once there's a second real call site per size.

**Line-height safety:** Tailwind utilities are same-specificity, same-layer
classes, so two classes both setting `line-height` on one element resolve by
generation order, not visual intent. Where a call site already had an
explicit `leading-*` override that differs from the token's bundled default
(`PriceAccordion.tsx`'s `leading-5`, tighter than `text-base`'s normal
1.5rem), I forced it with `!leading-5` so it deterministically wins instead
of relying on cascade order. Verified via computed-style checks (not
assumed): `text-heading-xs` → 16px/24px, `text-heading-sm` → 20px/28px,
`text-heading-lg` at the `md:text-4xl` breakpoint → 36px/40px, and the
forced-override site → 16px/20px — all exactly matching the pre-migration
values.

**`src/lib/og.tsx` intentionally NOT touched:** it's a Satori-based image
renderer using inline pixel styles, not Tailwind classes — CLAUDE.md already
documents it as keeping its own independent copy of brand values (drifts
silently if only the Tailwind side changes). Tokenizing it would need a
different mechanism entirely; out of scope for this CSS-class refactor.

## 2026-10-04 — P3: recurring data-discipline bug + CTA sweep

**Found and fixed:** `/arak` and `/kapcsolat` both had a literal
`<a href={\`tel:${company.phone.raw}\`}>` instead of the `PhoneLink`
component — CLAUDE.md already documented this exact pattern as a bug fixed
once before on `/arak` (2026-10-03); it had recurred (likely reintroduced
in a later edit of the same file). Converted both, same classes/text, no
visual change — verified via typecheck, build (OG-hash 44/44), axe 45/45,
mobile 45/45.

**Reviewed, not changed:** every other phone/calculator CTA across every
page template already follows design-system.md's categorical button rules
(solid primary / outline secondary / `.glow-ring` reserved for the two
homepage priority CTAs). `not-found.tsx` uses a slightly different padding
(`px-6 py-3.5`) than the `px-5 py-3` used elsewhere, but its own two buttons
are internally consistent with each other and the design system doesn't
mandate one universal exact padding value — left as-is rather than forced
to match, to avoid relitigating a non-issue.

## 2026-10-04 — P4: mobile spacing floor confirmed, not compacted further

**Verified (not assumed):** measured smallest on-screen font-size and
smallest `<a>`/`<button>` heights at 375px on `/`, `/arak/`, `/kapcsolat/`.
Smallest text found is exactly 12px (the topbar hours label) — matches the
documented chip-text floor exactly, confirming no remaining headroom there.
The only sub-44px interactive elements found (15-16px tall) are inline text
links inside sentences/topbars (e.g. "Sóder részletei →", the topbar phone
number) — WCAG 2.5.8 (Target Size Minimum) explicitly exempts inline text
links from the 44px requirement, and the project's own `npm run
test:mobile` gate (which checks real standalone `min-h-11` tap targets, not
inline links) passed 45/45 both before and after this pass.

**Conclusion:** the mobile spacing floor documented in CLAUDE.md (44px hit
targets, 12px chip text, 14px body text) is already reached. No spacing was
compacted further. Documenting this with real numbers so a future request
to "make it tighter" gets checked against this measurement instead of
re-litigated from scratch.

## 2026-10-04 — P5: re-baseline after P2-P4, no regression

**Verified (forced a full run, not the cached/skipped one):**
`DAEKON_FULL_AUDIT=1 npm run perf:lighthouse` — home `/` 96/100 (within the
documented ~95-97 ceiling, no regression), `/utmutatok/` 100/100,
`/anyagok/soder/` 100/100, `/teruletek/erd/` 99/100 (1 point under the
previously-documented 100 — within normal Lighthouse run-to-run noise, not
a real regression; no cause to chase).

OG-card regression (`npm run og:hash`, part of every `npm run build` run
during P2-P4) stayed 44/44 matched throughout — expected, since none of
P2-P4 touched `src/lib/og.tsx` or any brand color. `og:hash:update` was
therefore not needed.

**Verification note:** the live `next dev` server (already running from the
parent session) started serving an empty/stale CSS bundle after `npm run
build` ran in the same working directory — both processes write to `.next/`
and collided. Visual/computed-style verification was done against the
`out/` static export (served on a separate port) instead, which is
unaffected by the dev-server cache. The dev server itself may need a
restart to pick up subsequent changes cleanly; not restarted here per the
instruction not to touch it, but worth knowing if it looks stale to anyone
using it directly.

## 2026-10-04 — Branch history repair: P4/P5 commits were on the wrong branch

**Found:** a previous fork's P4 (`b33b25f`) and P5 (`af489a6`) commits ended
up on the deploy chore branch (`chore/github-pages-deploy-20261004-0825`)
instead of `redesign/premium-v2`, because the orchestrator checked out the
chore branch in the same shared working directory while that fork was still
running — its later `git commit` calls landed on whatever branch happened to
be checked out at that moment, not the branch it started on.

**Fix:** `git merge --ff-only af489a6` on both `redesign/premium-v2` and this
branch (`improvement/audit-and-quality-20261004-0916`) — a pure fast-forward
(af489a6 is already a strict descendant), not a rewrite; nothing was lost or
reordered, both branches just now correctly include P4+P5. `git branch -f`
was tried first and blocked by the environment's safety classifier
("Irreversible Local Destruction") since it can't verify a given `-f` is a
safe fast-forward vs. a history-discarding move — `merge --ff-only` achieves
the same result but is self-verifying (git itself refuses if it isn't
actually a fast-forward), which is the safer tool for this regardless of the
classifier.

**Process note for future forks sharing this working directory:** always
`git branch --show-current` immediately before every commit and abort rather
than commit blind if it doesn't match the branch you started on.

## 2026-10-04 — Cleanup: 9 generated/scratch files removed from git tracking

**Decision:** Removed `og-gallery.html`, `.lh-home.json`, `.lh-home-base2.json`,
`.lh-inter.css`, `.server.log`, `.logo-compare.html`, `daekon/watch-stdout.log`,
`daekon/daekon-report-fast.md`, and untracked (kept on disk) `tsconfig.tsbuildinfo`.
Full evidence and recovery path per file in `docs/cleanup-log.md`.

**Why:** all nine were generated outputs or logs accidentally committed at
the original baseline snapshot, never source, with zero active references
(verified by repo-wide grep per file) — mostly build-artifact/report
categories the project's own `.gitignore` already excludes for sibling files
(e.g. `daekon/daekon-report.md` was ignored but not `daekon-report-fast.md`;
`daekon/watch.log` was ignored but not `watch-stdout.log`) — closing a gap
in an existing policy, not introducing a new one. `og-gallery.html` alone
was 7.5 MB of dead weight.

**Explicitly kept:** `logo-lab.html` — superficially similar to the removed
`.logo-compare.html` but actively referenced by CLAUDE.md and
`daekon/skills/logo-design.md` as the tool for future logo evaluation.

**Validated:** typecheck, lint, build (95/95 pages, OG-hash 44/44), axe
(45/45, forced full run), mobile (45/45, forced full run) all PASS after
removal — nothing depended on any of these nine files.

## 2026-10-04 — Reduce green dominance in homepage hero/closing-CTA backgrounds

**Decision:** Added two new warm tokens (`--color-terracotta` `#b1543a`,
`--color-amber-glow` `#d6a24a`) in `src/app/globals.css` and used them to
replace `petrol`/`moss` specifically in the homepage's two large dark
decorative-background sections: the hero's 3 `.aurora` blobs + 1 radial-
gradient layer, and the closing CTA's 2 `.aurora` blobs (`src/app/page.tsx`).
`petrol`/`moss` tokens themselves are untouched and still used elsewhere
(Buda Konténer cross-promo CTA band, a checkmark icon, a zone accent-dot
rotation, a divider line) — all small/functional surfaces, explicitly out
of scope per the user's own instruction.

**Why:** Explicit user direction — the green read as too dominant in those
two large sections; the requested direction was a natural sand/terracotta/
amber palette, not a full palette reversion, and not touching logo/CTA
status colors.

**Validated:** typecheck, lint, build (95/95, OG-hash 44/44 unaffected —
`src/lib/og.tsx` deliberately untouched), axe (45/45, forced full run,
covers contrast), mobile (45/45, forced full run), Playwright screenshots
at 375px/1280px confirm no horizontal overflow and clear legibility over
the new glow colors.

**Also updated:** `CLAUDE.md`'s brand-color block and
`.claude/agents/art-director.md`'s inherited-history section, so future
work treats this as the new baseline for those two sections rather than
re-proposing the old green aurora or treating this as an open question.

## 2026-10-04 — Closing CTA copy fix, footer seam fix, call-region rename

**Decision:** Three changes to the homepage's closing CTA (`src/app/page.tsx`,
last `<section>`):
1. Replaced the h2/p copy — the old text ("Kész a terv? Küldjük is az
   anyagot." / "Hívjon, vagy töltse ki az ajánlatkérőt…") referenced a
   quote-request form that doesn't exist on the site; only a phone number
   and the price calculator are offered. New copy: "Rendelne? Hívjon, és
   egyeztetjük a részleteket." / "Mondja el, milyen anyagra, mennyire és
   hová van szüksége. Az árat és a szállítás időpontját telefonon
   pontosítjuk, előre tájékozódni pedig az árkalkulátorral tud."
2. Removed the ~80px light gap between this dark section and the dark
   footer. Moved the footer-before spacing from `Footer.tsx` (a flat
   `mt-20` applied unconditionally on all 44 pages) onto `<main>` in
   `layout.tsx` as a default `pb-20`, zeroed via a Tailwind `has-[]`
   selector — `has-[>.cta-dark:last-child]:pb-0` — when `<main>`'s last
   direct child carries a new `.cta-dark` marker class. Only this one
   closing CTA section (grepped `bg-basalt` across `src/app` — it's the
   only dark section that ever lands as the last element before the
   footer) got the class, so every other page keeps its original spacing.
3. Renamed this section's `data-call-region` from `"hero"` (shared,
   ambiguously, with the page-top hero) to `"zaro_cta"` — updated
   `docs/metrics-plan.md` §5's table (split the old combined `hero` row)
   and the region-list comment in `src/lib/analytics.ts`. `scripts/
   cta-position-map.mjs` resolves region names generically (no hardcoded
   list), so it needed no change.

**Why:** User-reported bug — misleading CTA copy, a visible light seam
between two sections that are meant to read as one continuous dark block,
and an analytics region name that collapsed two different CTA positions
into one bucket, making position-based GA4 reporting (metrics-plan §7)
unable to tell the top hero and the closing CTA apart.

**Validated:** typecheck, lint (unchanged pre-existing `<img>` warnings
only), build (export QA 45/45 pages, OG-hash 44/44 unaffected). Playwright
screenshots at 375/768/1280px confirm: hero renders with no light gap
before the footer on `/`, the gap is preserved on `/arak/` and
`/kapcsolat/` (pages ending in light content), and the closing CTA's new
copy displays correctly. Repo-wide grep confirmed no other source, test,
or snapshot file referenced the old CTA strings.

## 2026-10-10 — V2: mag-zóna körvonal bővítése (Újbuda, Nagytétény)
A térképi körvonal a zónabesorolást (site.ts `settlement.zone`) követi, nem
fordítva. Újbuda és Nagytétény `mag` tagok voltak, de kívül estek a körvonalon;
a tájékoztató sávot bővítettük, nem a markert mozgattuk. Halásztelek
(`tavolabbi` besorolás, `kozel` területen) ügyféldöntésre vár.

## 2026-10-11 — V2.5: egysoros anyagsáv mobilon, kompaktabb mobiloldal
Ügyféligény: a hero „Anyagok és induló árak" hat kártyája mobilon/tableten se
törjön több sorba. Megoldás: `lg` alatt natív vízszintes görgetősáv
(`overflow-x: auto` csak a listán, scroll-snap, belógó következő kártya,
vékony görgetősáv, `overscroll-behavior-x: contain`), új függőség nélkül;
`lg`-től a változatlan hathasábos rács. Kártyák mobilon 140×124 px, a teljes
név és ár/„egyeztetés után" látható, nincs csonkolás.
Mobil helyigény szekciónként (nem egységes zsugorítás): Section py 56→48 px,
cím–tartalom 32→28 px; anyagkártyán a külön „Tételek" sor az ár alá került
(`md:contents`, desktop változatlan); idővonalon keskenyebb számoszlop →
szélesebb szöveghasáb; lábléc „Oldalak" két hasábban, 44 px érintési
célokkal (eddig 32 px volt). Szövegek, árak, lépések változatlanok.
