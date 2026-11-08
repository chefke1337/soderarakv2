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

## 2026-10-11 — V2.6: természetes anyagkupacok a hero anyagsorában
Ügyfél: a boltíves, egyenes oldalú kártyák „kapunak/sírkőnek" hatottak.
Két irányt mértünk össze: (A) az egész kártya alacsony kupac, rajta a
szöveg; (B) a kupac önálló sziluett, alatta név/ár/nyíl. **B** lett: a
szöveg kontrasztja anyagtól független (a homok/murva világos textúráján A
nem olvasható biztonsággal), és a sziluett valóban szabad formájú lehet.
Geometria: `src/lib/pile.ts` (tiszta TS) — h(t)=H·(1−|t|^a)^b profil,
aszimmetrikus csúcs, magassággal arányos anyagonkénti kontúr-egyenetlenség;
lágy anyag Catmull–Rom görbe, murva/bazalt egyenes élek. Egységes fény
balról-felülről, perem-fény, kontaktárnyék. A szemcsecsempe közös modulba
került (`src/lib/grain.ts`); a MaterialLedger mintái bájtpontosan azonosak
(ellenőrizve). Az SVG `dangerouslySetInnerHTML`-lel kerül be, de kizárólag
saját, determinisztikus adatból — nincs felhasználói bemenet.

## 2026-10-11 — Telephely/depó: maradék nyilvános hivatkozások, platós autó
A main-en lévő telephely/depó-eltávolítás után még nyilvános maradt: a
`public/llms.txt` depócíme, „telephelyi átvétel (depó)" sora és régi 4–23 m³
tartománya, valamint egy útmutató-válasz „átvételre vagy lerakásra" fordulata.
Mindhárom a hiteles kiszállítás/lerakodás szövegre igazítva. A „Platós autó"
a /szallitas „Mivel szállítunk?" listájából már kikerült; következetesen a
flottafelsorolásokból (site.ts képességek, /rolunk, útmutató) is kivettük,
hogy a két megjelenítés ne mondjon ellent egymásnak. A `depot` export belső
referencia marad (sehol nem importált, nem kerül a bundle-be). Nyitott: a
layout LocalBusiness JSON-LD `PostalAddress`-e a céges (impresszum) címet
közli — jogi/üzleti megerősítés kell, hogy maradjon-e. Az `llms.txt`
zóna-, anyag- és árlistája a site.ts 2026-10-11-i állapotához igazítva.

## 2026-10-28 — V3: bruttó anyagár, irányítószámos fuvar, 10 m³ egyfuvaros keret
Az árazás kettéosztott lett: az ANYAGÁR BRUTTÓ (ÁFÁ-val, `src/content/catalog.ts`),
a FUVARDÍJ NETTÓ (`src/content/freight.ts`), és a fuvarra 27% ÁFA jön
(jóváhagyott ügyfélválasz, 2026-10-27). A `src/lib/quote.ts` tiszta függvényei
kényszerítik ki, hogy a bruttó anyagárra ne kerülhessen még egyszer ÁFA, és hogy
a nettó fuvardíj ne adódjon közvetlenül a bruttó anyagárhoz végösszegként.

A három szállítási zóna megszűnt: a díj alapja mindig a konkrét irányítószám
(25 díjprofil), a kerület kiválasztása nem helyettesíti — eltérésnél hibát
jelzünk, és nem választunk automatikusan másik díjat. Egy fuvarban legfeljebb
10 m³ (korábban 20). Ahol nincs jóváhagyott tarifa (ismeretlen irányítószám,
profil feletti mennyiség, 10 m³ felett, ismeretlen Vár-engedélydíj), ott nincs
összeg — kitalált árat sehol nem mutatunk.

A Bazalt kategória helyére a Nógrádkövesdi andezit került; a régi
`/anyagok/bazalt/` útvonal noindex átirányító oldalként él tovább. Ellenőrzött
andezitfotó hiányában a korábbi bazaltfotót NEM adjuk ki andezit fotójaként.

Az éles e-mailküldés szándékosan NINCS aktiválva (nincs szolgáltatói
hozzáférés): a teljes backend megvan és tesztelt, lokálisan mock módban fut,
amit a felület egyértelműen jelez. Részletek, nyitott kérdések és az
ellenőrzés eredménye: `docs/v3-brief.md`, `server/README.md`.

## 2026-10-28 — V3 GitHub Pages előnézet: új, önálló cél-repó
A `v2` preview mintáját követve (`docs/github-pages-soderarak.md`,
`.github/workflows/deploy-v2-pages.yml`) létrejött egy új, kifejezetten a V3
előnézetnek szánt publikus repó: `chefke1337/soderarakv3` →
`https://chefke1337.github.io/soderarakv3/`. Ez a `chefke1337/soderarakv2`
(ahol maga a forráskód él) `v3` branch-éből épül, de **másik** repóba
publikál — nem a saját `gh-pages` ágra (azt a V2 build foglalja), hanem a
`chefke1337/soderarakv3` repó `gh-pages` ágára, SSH deploy key-jel
(`SODERARAKV3_DEPLOY_KEY` secret a forrás-repón, csak a cél-repóra kap írási
jogot — ugyanaz a minta, mint a `docs/github-pages-soderarak.md`-ben leírt
`SODERARAK_DEPLOY_KEY`).

Új workflow: `.github/workflows/deploy-v3-pages.yml` — `push` a `v3`
branch-re és kézi `workflow_dispatch`, `GH_PAGES_BASE_PATH=/soderarakv3`,
`NEXT_PUBLIC_SITE_URL=https://chefke1337.github.io/soderarakv3`, egyébként a
V2-workflow lépéseivel azonos (typecheck, lint, build + export-validátor,
`peaceiris/actions-gh-pages@v4` publikálás). A V3 `noindex` a layoutban
kódolt (nem env-függő), ezért a preview is noindex marad — keresőmotorok
nem indexelik, de a link ismerőinek látható, ugyanúgy, mint a V2 előnézet.

A `SODERARAKV3_DEPLOY_KEY` secret beállítását a titokkezelési jogosultság
miatt a felhasználó futtatta (`gh secret set`), nem az agent.

## 2026-10-31 — V3 újraellenőrzés új sessionben + export-validátor hiba javítva

**Talált és javított hiba:** `npm run build` a `GH_PAGES_BASE_PATH`/
`NEXT_PUBLIC_SITE_URL` CI-változókkal megegyező, tiszta újrabuildnél
megbízhatóan elhasalt: `scripts/prepare-static-export.mjs` `isNotFoundPage`
felismerése csak az `out/404.html`-re illesztett regexet, de Next
`trailingSlash: true` export mellett a 404-es oldal **mindkét** fájlként
kiíródik (`out/404.html` ÉS `out/404/index.html`, bájtazonos tartalommal).
A duplikátumot a validátor sima oldalként kezelte, ahol a megosztási kép
a főoldal (`soderarak-share-v4.png`) linkjére mutatott a saját 404-kártya
helyett → `fail("unexpected social image URL …")`. Javítás: a regex most a
`404/index.html` alakot is felismeri. Reprodukálva két független tiszta
(`.next`+`out` törlés utáni) buildnél, mindkét alkalommal ugyanott bukott;
a javítás után a CI-változókkal futó build a dokumentált 44 HTML-oldal / 44
saját OG-kép / 39 kanonikus eredményt adja, és az OG-hash regresszió is
egyezik a bázissal.

**Miért maradhatott rejtve korábban:** nem derült ki, melyik korábbi
ellenőrző futás nem ütközött bele — a jelenség kizárólag a fájlnév-
illesztéshez kötött, nem a `GH_PAGES_BASE_PATH`/`NEXT_PUBLIC_SITE_URL`
beállítástól függ, de a `node_modules`-ban rögzített Next-verzió
(`15.5.27`) megegyezik a lockfile-beli verzióval, tehát nem verziódrift
okozta.

**Teljes újraellenőrzés eredménye (ugyanaz a `v3` branch, külön session):**
`tsc --noEmit` OK, `next lint` 0 hiba (1 örökölt figyelmeztetés, mint
korábban), `tests/pricing.test.mjs` 170/170, `tests/freight.test.mjs`
3635/3635, `tests/quote.test.mjs` 440/440, `tests/order.test.mjs` 132/132,
production build (CI-változókkal) OK, `npm run test:mobile` 43/43 route
(valódi Playwright, 360px), `npm run test:a11y` 43/43 route (valódi
Playwright + axe, WCAG A/AA 2.0–2.2), `npm run test:smoke` 34/34 (valódi
böngészős kalkulátor- és rendelésiigény-folyam, mock háttérrel) — minden
szám pontosan egyezik a 2026-10-28-i `docs/v3-brief.md` 10. szakaszával,
tehát a dokumentált állapot ma is érvényes, a build-hiba kivételével.

**Nem végzett ellenőrzés:** a Claude-in-Chrome böngészőkiterjesztés nem
volt csatlakoztatva ebben a sessionben, ezért vizuális/manuális böngészős
bejárás nem történt — a fenti Playwright-alapú automatizált auditok
(mobil, a11y, smoke) futottak valódi Chromiumban, de képernyőképes emberi
átnézés nem.

**A `v3` branch ezidáig NEM lett pusholva** a `chefke1337/soderarakv2`
remote-ra (ellenőrizve `git ls-remote`-dal) — a `chefke1337/soderarakv3`
cél-repó `gh-pages` ága már létezik (korábbi manuális/egyszeri deployból),
de a forrás-ág hiánya miatt ez jelenleg nem a mai állapotot tükrözi. Push
jóváhagyásra vár.

## 2026-10-31 — V3.1: kalkulátor-első hero, területkereső, őszinte e-mailes átadás
Ügyfél-brief (V3 prémium web- és interaction design): a fő út anyag →
mennyiség → irányítószám → árösszesítő → rendelési igény. Döntések:
- A heróban a kalkulátor lett az elsődleges út (gyors ajánlat-szelvény, sima
  GET-űrlap), a telefon másodlagos; a mobil alsó sáv ugyanígy (Árkalkulátor +
  Hívás), a kalkulátoron élő tájékoztató összeggel.
- Végpont nélküli (publikus) buildben a beküldés nem zsákutca és nem álcázott
  siker: a felhasználó saját levelezőjében nyílik meg az összesítővel kitöltött
  e-mail (`mailto:`); a felület kimondja, hogy az igény az elküldéssel érkezik,
  és nem végleges megrendelés. Végponttal a korábbi viselkedés változatlan.
- A Területek oldalon a 23 kártya helyett kereshető, ékezetfüggetlen
  kerület/terület/irányítószám-kereső; csak jóváhagyott adatból — városrészt
  nem találtunk ki (a `telepulesek.txt` nem áll rendelkezésre).
- Az árazási logika, árak, szövegszabályok változatlanok. Részletek:
  `docs/v3.1-design.md`.

## 2026-10-31 — V3.2 „Material Precision": rendelőpult a heróban, motion-specifikáció
- A hero kupacsora a pult anyagválasztója lett (kiválasztott állapot: pipa,
  keret, felület — nem csak szín); a pult élő, tájékoztató becslést ad
  ugyanazzal a `quote.ts`-szel, mint a kalkulátor. Kitalált összeg nincs:
  ismeretlen irányítószám, 10 m³ felett és I. kerület (Vár) esetén a
  végösszeg helyén „—" és az egyeztetés oka áll. JS nélkül sima GET-űrlap.
- Motion (motion.dev) NEM került be: párhuzamos rendszer lenne a mért
  CSS-tokenes mozgás mellett, és minden szükséges átmenet CSS-sel megoldható.
  React Bits: SpotlightCard mintája átdolgozva (egy delegált figyelő, rAF
  nélkül), Stepper mintája saját CSS-sel; SplitText/BlurText/CountUp/
  AnimatedContent elvetve. Indoklás és tokenek: `docs/v3.2-motion.md`.
- Kavics: a jóváhagyott „Első osztályú, mosott kavics" jelölés a katalógus
  fejlécében is megjelenik, „a frakcionált tételekre" hatókörrel (a kulé nem mosott).

## 2026-10-31 — V3.3: szerkesztői főoldal
Önkritika a V3.2 után: a hero alatt az oldal sablonos volt (kicker + cím +
kártya ismétlődött), a legerősebb vizuális eszköz — a valódi anyagfotók —
80 px-es bélyegképként rejtőzött, a terrakotta kalkulátor-blokk a hero-pult
duplikátuma volt, a rendelés menete két képernyőnyi szöveg, a lefedettség
kérdésére térkép felelt a pontos irányítószám-válasz helyett. Döntések:
- Anyag-index valódi fotókkal (max. ~370 px csempe — a fotók ~400 px-esek),
  az andezitnél jelölt szemcse-illusztráció; a teljes 23 tételes, lenyitható
  lista az /arak oldalon (ott alapból nyitva).
- „Szállítunk a címére?" a főoldalon: kompakt irányítószám-kereső példa-
  keresésekkel; a térkép a /teruletek oldalon marad.
- Rendelés menete: a jóváhagyott öt lépés teljes szövege, desktopon
  vízszintes útvonal (CSS), mobilon függőleges sín.
- Kalkulátor-belépő blokk a főoldalról kivéve (a pult élőben végzi).
- „Miért hívjon minket?" a sötét lezárás első fele, számozott ígéretlistával;
  egyetlen hívás-CTA a záró blokkban.
Mért (helyi, azonos feltételek): főoldali HTML 492 → 334 KB, CLS 0.

## 2026-10-31 — V3.4: visszaállás az eredeti V3 dizájnra + célzott hangolás
Ügyfél-utasítás: „ne építsd át így merészen a meglévőt, tuningold" — a V3 a
V2 kinézete + az ügyféltől kapott adat. Döntések:
- A V3.1–V3.3 dizájn-átépítései (hero-pult, anyag-index, rendelési lépések,
  mobil kalkulátor-sáv, mailto-átadás, mozgás-token módosítások) visszavonva;
  a főoldal, a kalkulátor, a kupacsor és az árlista az eredeti V3 (5d7982c)
  állapotában van. Ez fölülírja a V3.1–V3.3 bejegyzéseket.
- Megmaradt: a kereshető területlista (AreaFinder) a /teruletek oldalon és a
  hosszú telefonszám-linkek `whitespace-nowrap` javítása (360 px tap-target).
- Új: az ügyfél kerület → városrész listája (`src/content/districts.ts`,
  szó szerint, kiegészítés nélkül). Kereshető ékezet nélkül; a megosztott
  városrészek (pl. Gellérthegy, Sashegy, Háros) minden megadott kerületnél
  szerepelnek, „a listán a … kerületnél is" jelöléssel. Városrészből NEM
  következtetünk irányítószámra vagy díjra; a lista statikus HTML-ben is
  benne van (prerenderelt `<details>`). Teszt: `npm run test:districts`.
- Új: a kalkulátor `?irsz=` paramétert is olvas (csak jóváhagyott
  díjprofilú irányítószámnál tölti elő a települést/kerületet/irányítószámot);
  számítás nem változott.
- Adatellenőrzés az ügyfél-specifikáció ellen: 23 anyagár, 25 díjprofil,
  minden irányítószám-lista és a 27%-os fuvar-ÁFA egyezik (0 eltérés).

## 2026-10-31 — V3.5: hibajavítás, optimalizálás, visszafogott finomítás
- Hibák: a „Ezzel a példával kezdem" gomb most a példa mennyiségével és
  irányítószámával nyitja a kalkulátort (`?m3`, `?irsz`, csak engedett
  értékre); a lefedettségi térkép szélső címkéi nem vágódnak le (aszimmetrikus
  fitBounds-padding); a Kapcsolat oldalon a rendelési gomb nem folyik bele a
  mondatba; a hosszú mosott-címke 390 px-en nem lóg rá a „Tételek" gombra.
- Mosott-jelölés egy helyről (`groupWashed`): Sóder → az egész csoport;
  Kavics → „· frakciók" hatókörrel (a kulé nem mosott). A kalkulátor sóder-
  változatain nem ismétlődik ötször a címke; a csoportcímke mondja meg a hatókört.
- Komolyabb részlet: a példaszelvény egyenesen áll (nincs döntés), felső
  perforált éllel.
- Mérés (helyi, 4× CPU-lassítás): LCP 320–356 ms, CLS 0 — gyorsabb, mint az
  élő V3.3. A kupac-SVG tömörítését kipróbáltam, ~1–2 KB nyereség → visszavonva.
- A díjlista kártyás marad (nem fix oszlopos táblázat): az I. kerület eltérő
  sávjai miatt fix oszloppal díj kerülhetne rossz sávfelirat alá.

## 2026-11-01 — V3.6: ügyfélkérések (kerületlista SEO, Rólunk, mosott jelölés)
Forrás: az ügyfél két üzenete (kerület/városrész-lista; Rólunk-szöveg, árak,
díjak). Ellenőrzés: mind a 23 anyagár, mind a 25 díjprofil és irányítószám-lista
egyezik az oldallal (0 eltérés) — az árakhoz/díjakhoz nem kellett nyúlni.
- Rólunk: a második bekezdés SZÓ SZERINT az ügyfélé („Minden általunk
  forgalmazott anyag vizes osztályozási eljáráson megy keresztül…") — a korábbi
  szűkítés helyett, kifejezett kérésre. „Ez legyen a bau-kontos helyett": a Rólunk
  oldalon a cégadat-blokk helyére a bemutatkozás került; a jogilag szükséges
  üzemeltetői adatok az Impresszumban (és a lábléc ©-sorában) maradnak.
- Mosott-jelölés: „Jó minőségű, mosott sóder" / „Jó minőségű, mosott kavics";
  minden sóder és minden kavics (a kulé is — az továbbra is méret szerint
  osztályozatlan). Homok, murva, andezit, föld: nincs mosott-címke. Az /anyagok és
  /arak oldalon minőségi blokk az ügyfél Rólunk-bekezdésével.
- Kerületlista SEO: /teruletek-en látható, kerületenkénti index (H3, horgony
  `#kerulet-N`), Service JSON-LD `areaServed` (kerület → városrészek), a kerületi
  területoldalakon a kerület városrészei, llms.txt. A keresőben a lenyitott
  városrész-lista helyett horgonylink (nincs duplikált szöveg). Díj továbbra is
  csak irányítószámból.
- Hero-szöveg: az ügyfél mondata nyelvtanilag javított alakban marad
  („Budapestre, Érdre és környékére").
- „Töltősóder vagy mosott sóder?" útmutató címe → „…rostált sóder?", mert a
  töltősóder is mosott.

## 2026-11-01 — V3 teljes audit (részletek: docs/v3-audit-and-fixes.md)
- Térkép: feliratok prioritásos ütközéskezelése (mobilon olvashatatlan volt).
- 20 új kerületi oldal (/teruletek/budapest-N-kerulet) a központi adatból; a
  meglévő XI./XXI./XXII. slugok maradnak; a térkép nem kapott új jelölést.
- Városrészenkénti oldal NEM készül (nincs saját díj/irányítószám → vékony tartalom).
- Hero H1 opacity nélkül úszik be (LCP), kupacok statikus SVG-fájlként (/kupac/*.svg).
- Lighthouse-harness base path javítás: a korábbi pontszámok érvénytelenek voltak.
- Indexelés: a V3 marad noindex (nincs élesítési jóváhagyás).
- Nyitott: időszakos React #418 (H-1), kalkulátor-CLS a szimulációban, főoldal Perf 86.

## 2026-11-02 — Ügyfél-visszajelzés: telefon, ötlépéses kalkulátor, árlista, mosottság, szállítás, tarifák
- Telefonszám: +36 30 852 8909 / `tel:+36308528909` — egyetlen forrás
  (`company.phone` a site.ts-ben); az útmutató szövegbe égetett régi száma is
  interpolált lett. Git history és archív audit-naplók érintetlenek.
- Kalkulátor: valódi, egyszerre EGY lépéses folyamat — 1 anyag → 2 mennyiség →
  3 cím → [Tovább] → 4 összesítés → [Megrendelem] → 5 személyes adatok és
  beküldés. Csak az aktuális lépés van a DOM-ban (a jövőbeli nem fókuszálható);
  a lépésjelző csak járt ÉS érvényes előzményű lépésre ugrik. Alapérték 1 m³
  (új indításkor és „Új kalkuláció" után); a piszkozat kulcsa v4-re váltott, a
  régi 8 m³-es piszkozat nem töltődik vissza. A dokumentált előválasztó link
  (`?anyag=&m3=&irsz=`, pl. a főoldali 8 m³-es példa) továbbra is működik.
  Anyagcsoport-váltáskor az érvénytelenné vált frakció kijelölése törlődik.
  I. kerületben a Vár-kérdés megválaszolása kötelező (a „Nem tudom" is jó).
- Árlista: saját hozzáférhető accordion (`LedgerAccordion`, gomb +
  aria-expanded + aria-controls + region), alapból minden zárt, egyszerre egy
  nyitott; a kattintott sor képernyő-pozíciója váltáskor megmarad. A natív
  `<details name>` kizárólagosság helyett — az nem kezeli a scrollugrást, és a
  brief kifejezetten gombos mintát kért.
- Mosottság: töltősóder „Nem mosott", kulé „Egyszer mosott" (teljes magyarázat
  a termékrészletben) — strukturált `washNote` mező, NEM `washed`; a sóder és a
  kavics csoportszintű mosott-állítása megszűnt (pontos `washSummary`). A Rólunk
  ügyfél-bekezdés („Minden általunk forgalmazott anyag…") ezzel ellentmondott,
  ezért szűkítve: a sóderfrakciók, kavicsok és homok; kivétel a töltősóder, a
  kulé egyszer mosott. → Ügyféllel megerősítendő megfogalmazás.
- Szállítás oldal: a „Saját flottával, irányítószám szerinti fuvardíjjal" blokk
  helyett a jóváhagyott „Szállítás" szöveg + „Amit kínálunk:" lista. Az „akár
  aznap" mellé kapacitás-függő megjegyzés került (nem garancia); a 10 m³/fuvar
  szabály ott marad.
- Nyilvános tarifák: a kereshető irányítószám × mennyiség díjtábla
  (PostalTariffTable) törölve az /arak és /szallitas oldalról; a kerületi
  oldalak díjsáv-blokkja, a díjsáv-/díjprofil-magyarázatok, a „-tól" fuvarárak
  (hero, OG-kártyák, meta) és az llms.txt díjlistája megszűnt. Helyette:
  „A pontos szállítási díjért használja az árkalkulátort, vagy kérjen telefonos
  egyeztetést." A belső tarifalogika (freight.ts) és a kalkulátor számítása
  változatlan; az összesítő továbbra is mutatja a nettó díjat, ÁFÁ-t, bruttót,
  a teljes összeget és az engedély-státuszt. FONTOS: a díjadatok a kliens
  JS-csomagban továbbra is benne vannak (a kalkulátor böngészőben számol) —
  valódi bizalmassághoz szerveroldali kalkuláció kellene; ehhez nem nyúltunk
  jóváhagyás nélkül.

## 2026-11-03 — Lábléc
- Ügyfélkérés: a „Bau-Kont Logisztik Kft." név lekerült a láblécről (a
  nyitvatartás feletti sor és a ©-sor: „© <év> Sóderárak."). A jogilag
  szükséges üzemeltetői adatok az Impresszumban maradnak (a láblécből linkelve).

## 2026-11-03 — Buda Konténer: önálló ajánló
- A főoldali sáv egyszerű reklám lett (jóváhagyott szöveg: „Konténerre is
  szüksége van?" / „Építkezik vagy felújít? Találjon konténert a hulladék
  elszállításához." / CTA „Megnézem a Buda Konténert" → https://budakontener.hu,
  változatlan cél). `<aside>` + kis „Ajánló" címke, a petrol szín megmarad
  megkülönböztetésnek. Az órákon belüli kiszállás ígérete kikerült.
- Összetartozást sugalló szövegek törölve: „külön üzletág" (főoldal, GYIK,
  llms.txt), a Rólunk „Két üzletág, két oldal" doboza, a lábléc kapcsolati
  oszlopának „Hulladék, konténer" sora, az OG „CÉGÜNK · ÜZLETÁGUNK". A
  `businessUnit` szöveg „üzletág" helyett: „Sóderárak — ömlesztett építőanyag
  értékesítése és szállítása" (Impresszum: „Tevékenység"). Sem „két külön cég",
  sem „partnerünk" nem került be. A kalkulátorban nincs konténeres tétel.

## 2026-11-03 — Telefonos elérhetőség és üzemeltető
- Telefonos elérhetőség H–P 07:00–16:00 (`company.hours`, + `sentence`).
  Mindenhol „telefonos elérhetőség" — nem nyitvatartás/ügyfélfogadás; a
  JSON-LD-ben ContactPoint.hoursAvailable (nem üzlethelyiségi
  openingHoursSpecification). A kiszállítás időpontját nem korlátozza.
- Üzemeltető (ügyféladat, a megadott formában, hatósági nyilvántartásban NEM
  ellenőriztük): Újhegyi Lajosné E.V., 1224 Budapest, Báthori utca 9., adószám
  61008203-2-43, egyéni vállalkozói nyilvántartási szám 4868853. A Kft.,
  cégjegyzékszám, cégállapot és a törökbálinti cím megszűnt az aktív oldalakon.
  A márkanév (Sóderárak) marad; JSON-LD: name = márka, legalName = vállalkozó.
  A székhely nem telephely: nincs térképpin, nincs személyes átvétel.
- Jogi felülvizsgálat javasolt: az adatkezelési tájékoztató általános
  (adatkezelő-csere után a tartalmat jogásznak érdemes átnéznie); ÁSZF nincs.

## 2026-11-04 — Rendelési igény: PHP-végpont a tárhelyre
- Hiba oka: a soderarak.hu-ra feltöltött statikus csomag
  `NEXT_PUBLIC_ORDER_API_URL` nélkül épült, és nem volt mellette futó
  beküldési végpont → a kliens (szándékosan) „nincs konfigurálva" állapotot
  mutatott, nem szimulált sikert.
- Megoldás: `server/php/api/rendeles.php` (PHP 8+), a tárhely-ZIP `api/`
  mappájában; a tárhely-build a `/api/rendeles.php` címre küld. A Pages-
  előnézet (nincs PHP) továbbra is „nincs konfigurálva".
- Küldés: alapból a tárhely PHP `mail()` függvénye (feladó info@soderarak.hu),
  vagy SMTP a webgyökér fölötti config-fájlból / SetEnv-ből. SMTP-adatot nem
  találtunk ki; a repóban csak titok nélküli minta van.
- Szerveroldali árújraszámolás a generált `rendeles-adatok.php`-ból (PHP-
  fájl, hogy a díjtábla ne legyen szövegként letölthető); a teszt elbukik, ha
  elavult. Fix címzett, Reply-To = beküldő, CR/LF-szűrés, Origin-szűrés,
  rate limit, idempotencia, csapda-mező, 16 KB korlát. Siker csak tényleges
  átvételkor.
- 10 m³ feletti igény a megjegyzés elején jelölve kerül a levélbe.

## 2026-11-07 — Redesign: „Anyag és szerkezet" (fejléc, hero, anyagkatalógus)
Branch: `redesign/anyag-es-szerkezet` (nem élesít; előnézet: `preview/redesign` → `preview-out`).
- Fejléc: tömör `--color-limestone` sáv, `border-ink/20` alsó vonal, kapcsolat-zóna
  függőleges vonallal leválasztva, szén (`.btn-ink`) telefongomb. Áttetszőség/blur ki.
- Véletlenszerű többszínű csík: a hero-kickerből és a mobilmenüből eltávolítva; a
  rétegrend-motívum a valódi anyagfotókból rakott hero-szelvénybe költözött.
- Mobilmenü: teljes szélességű lap a fejléc alatt; Tab-kilépésre is zár.
- Hero: `--color-mineral` alap, pötty/fényfolt nélkül; H1 változatlan; információs
  sor (`dl`) badge-ek helyett; telefon elsődleges, kalkulátor másodlagos (`btn-outline`).
  A korábbi ténysáv megszűnt: elemei az információs sorba / ármagyarázatba kerültek.
- Andezit: nincs ellenőrzött fotó → a hero-szelvényben nem szerepel, a katalógusban
  jelölt szemcse-illusztráció („illusztráció").
- Anyagkatalógus (`MaterialCatalog`): mobil lista → sm 2 hasáb → lg 3×2, hajszálvonalak,
  körbe tett nyilak nélkül; ármagyarázat a DISCLOSURE_* konstansokból.
- `MaterialHeaps` / `HeapRail` törölve (nem maradt hivatkozás).
Nyitott ármagyarázati kérdés: az anyagár bruttó, a fuvar nettó — a kettő nem adható
össze közvetlenül; ezt a szöveg jelzi, de ügyféldöntés, hogy a fuvart is bruttóban mutassuk-e.

### 2026-11-07 — Visszaállítás (ügyfél-utasítás)
„A felső szegmenst tedd vissza a régire, csak a hátteret kértem módosítani."
- Fejléc, mobilmenü, hero és az anyagsor (MaterialHeaps) a 0527c92 szerinti
  állapotra visszaállítva; a HeroStrata/MaterialCatalog kikerült.
- Egyetlen megtartott változás: a hero háttere egyszínű, a pöttyözött minta
  (`.grain`) és a radiális fényfoltok nélkül.
- Dupla/tripla hívógomb mobilon: a MobileCallBar elrejtőzik, amíg a hero
  telefon-gombja látszik, és amíg a mobilmenü nyitva van.
- (16:20) Ügyfél-irány: narancs horizont ki; a hero alját a térkő-rétegrend metszete
  zárja az ügyfél referenciaképe szerint (beton térkő → ágyazat 2/4 → teherhordó 0/22 →
  fagyvédő 0/56 → tömörített altalaj egyenes határral → természetes hullámos rétegek).
  Statikus SVG: `public/hero/terko-retegrend.svg` (generátor: `scripts/build-hero-ground.py`).
  A térkő feletti hero-háttér világos mészkő→homok átmenet; a hero szövegei, a
  kupackártyák és a terület-címkék ehhez igazítva sötét szövegre.
- (17:18) Ügyfél-irány: a térkövek kikerültek; csak a térkő alatti rétegrend absztrakt metszete marad, fele akkora magasságban (64/72/80 px).
- (17:24) „Gagyi” visszajelzés után: a talaj-sáv letisztult műszaki metszetrajz lett (pontozott ágyazat, rakott szögletes 0/22 és 0/56 szemek, 45°-os vonalkázású tömörített altalaj, hajszálvonalas réteghatárok), 80 px magas viewBox.
- (17:30) „Tudsz jobbat”: a metszet renderelt hatású lett (árnyalt, vetett árnyékos szemek, zaj-textúra, vágási mélységárnyék), md+ méreten műszaki rajz-szerű rétegfeliratokkal (HTML).
- (17:40) „Életszerűbb, mi ez a csíkos föld”: a rajzolt SVG helyett a rétegek a katalógus valódi anyagfotóiból készült, varratmentes csempék (public/hero/talaj-*.webp, scripts/build-hero-ground.py); ágyazat=sóder, teherhordó=murva, fagyvédő=kavics, altalaj/természetes=föld fotó. Vonalkázás megszűnt.
- (19:01) Ügyfél: „nem jó irány, maradj az absztraktnál, legyen grafika, kreatívan”: fotók ki; lapos „terrazzo + raszter” grafikus metszet (SVG), tömörített altalaj = lefelé ritkuló pontraszter (nem vonalkázás).
- (19:08) Ügyfél: a rétegfeliratok lekerültek; a sáv tisztán grafika. Alap: soderarak.hu élő verziója (hosting/v3 e804f92 = v3 0527c92 + hosting-workflow).
- (19:17) Kupacok valós léptékben (10 m³): kúp-közelítés + természetes rézsűszög (homok 34°, sóder 30°, kavics 35°, zúzott kő 40°, föld 35°; Engineering ToolBox, Wikipedia) → Ø 4,5–5,1 m, h 1,47–1,89 m; rajzlépték 33 egység/m. Szemcseméret a katalógus jellemző frakcióiból ugyanebben a léptékben (src/lib/pile.ts PILE_GRAIN); a MaterialGrain csempék (GRAIN_SHAPE) változatlanok.
- (19:56) Ügyfél: hero háttér sárgább/bézs (#f0e1c0→#e2cb9b); anyagcsempék üveghatásúak (áttetsző, backdrop-blur, fényél) — kifejezett ügyfélkérés, felülírja a brief „no glassmorphism” pontját; a terület-címkék és a nyíl-körök ehhez igazítva.
- (20:11) Ügyfél: csempék matt üveg (blur, nem tükröződés, nincs éles fényél; a kupac elmosott színe dereng át); a rétegsáv valós szemcsemérettel (1 egység ≈ 5,7 mm, ágyazat 2–4 mm, 0/22, 0/56 szemeloszlással, árnyalt zúzottkő); a sáv tetején építkezés-jelenet oldalnézetben (markoló, raklapon térkő, lerakott elemek) — public/hero/epitkezes.svg.
- (20:21) Ügyfél: markoló ki; térkő jobbról a szélesség 65%-án lerakva (szegélykővel); rajta teljes + megbontott, majdnem üres raklap térkő, homokkupac, odatámasztott seprű.
- (20:42) „Jobb elrendezés, fizika, grafika”: jelenet újrarendezve munkafront-logika szerint (megbontott raklap → homokkupac 1 m³/34° rézsű, lapáttal → teljes raklap → seprű a raklapélnek dőlve); egységes 0,8 egység/cm lépték, kontaktárnyékok jobbra (fény balról), beton- és homokszemcse-textúra, fa-erezet.
- (21:24) Ügyfél: a térkő és minden felette lévő elem lekerült; csak a rétegek maradnak, valós vastagsággal (ágyazat 4, teherhordó 20, fagyvédő 25, altalaj 10, talaj 6 cm; 80 px = 65 cm) és frakció szerinti szemcsemérettel (0/22 ≤ 2,7 px, 0/56 ≤ 6,9 px).
- (21:36) Ügyfél: a hero teteje túl egyszínű/fakó → két felső sarokban narancs/borostyán sarokfény, lassú CSS-lebegés (reduced-motion: áll). Kifejezett ügyfélkérés (felülírja a „no glow blob” pontot).
- (21:44) Ügyfél: rétegsáv fele akkora (32/36/40 px), arányok valós vastagság szerint maradnak; a talajrétegek a ténysor színébe fakulnak.
- (21:54) Ügyfél: vastagabb földrész (altalaj 15 + talaj 16 cm; sáv 80 egység = 80 cm); a hero háttere vissza sötétre (meleg bazalt átmenet), sötét matt üveg csempék, tompított sarokfények, halk horizont-derengés a rétegsáv fölött.
- (22:10) Ügyfél (globális): a lábléc színes csíkja helyett ugyanaz a rétegrend-sáv (a sötét láblécbe fakul); a szekció-kickerek kis ikonja (.label-strata) a 6 anyag kupac-textúrájával (scripts/build-material-textures.py → --tex-* CSS-változók).
- (22:10) Ügyfél: a térképen ne legyen név olyan településnél, ahová nem szállítunk; választás: „saját rajzolt térkép”. Az OSM-csempék helyett saját alaptérkép: OSM közigazgatási határok (23 kerület + környező települések), Duna, autópályák/főutak — egyszer letöltve CI-ben (tools/terkep-adat ág, scripts/terkep-adat.py), egyszerűsítve → public/terkep/alap.json (~104 KB, gzip ~23 KB). Rajta nincs felirat; csak a mi jelöléseink kapnak nevet. Kiszolgált (23 kerület + Érd, Diósd, Törökbálint, Tárnok, Sóskút, Pusztazámor) meleg kitöltés, többi semleges. OSM-attribúció marad (ODbL).
- (22:55) Ügyfél: a térképen csak a 23 kerület és Érd (Budafok a XXII. képviselője marad, 2026-11-01-i kérés szerint); városrészek és egyedi egyeztetéses települések jelölése le, az alaptérképen sem kiemeltek. Aloldalaik megmaradnak.
- (2026-11-08) Ügyfél: a kupacok textúrája „csíkos, rácsos” volt (pixel alatti szemek + kis csempe → moiré). Javítás: nagyított, jól látható szemek (≈1–3 px), 48×24-es csempe, közeli tónusok, feTurbulence felületi zaj; az anyagok egymáshoz viszonyított szemcsemérete megmarad.
- (2026-11-08) Ügyfél: a csempék háttere maradjon a régi → a .heap-bleed a korábbi kupac-grafika rögzített 200×72-es raszteréből készül (public/kupac-hatter/*.webp, ~1,5 KB/db), független az új kupac-textúrától.
