# Sóder Árak — GitHub Pages deploy

## Cél repository
`chefke1337/soderarak`

**Állapot (2026-10-04-i ellenőrzés):** a repó már létezik, 2026-09-13-án jött
létre, jelenleg **privát**, csak egy placeholder `README.md`-t tartalmaz,
alapértelmezett branch: `main`. Nincs rajta sem GitHub Pages beállítás, sem
`.github/workflows`.

⚠️ **Nyitott blokkoló:** a GitHub Pages privát repóból csak GitHub Pro/Team/
Enterprise csomagon publikálható — Free csomagon nem. Ugyanez a korlát
jelentkezett a `chefke1337.github.io` deploynál is (lásd ott: a megoldás egy
külön, kifejezetten erre a célra publikussá tett repó volt). Amíg a
`chefke1337/soderarak` privát marad, a `https://chefke1337.github.io/soderarak/`
URL nem fog működni — ezt a jóváhagyási döntésnél jelzem.

## Cél URL
`https://chefke1337.github.io/soderarak/`

## Elkülönítés
A `chefke1337.github.io` user-site repository **nem** része ennek a
deploynak — ahhoz ez a munka nem nyúlt (nincs rajta új commit, branch vagy
Pages-módosítás). A két deploy teljesen független workflow-fájlban és célban:

| | Root deploy (korábbi feladat) | Ez a feladat |
|---|---|---|
| Cél repo | `chefke1337/chefke1337.github.io` | `chefke1337/soderarak` |
| Cél URL | `https://chefke1337.github.io/` | `https://chefke1337.github.io/soderarak/` |
| Workflow fájl | `.github/workflows/deploy-pages.yml` | `.github/workflows/deploy-soderarak-pages.yml` |
| basePath | `""` (gyökér) | `/soderarak` |
| Deploy-key secret | `DEPLOY_KEY` | `SODERARAK_DEPLOY_KEY` (még nem létrehozva) |

## Framework beállítások
- **Framework:** Next.js 15 (App Router), statikus export (`output: "export"`).
- **Static output:** `out/` (ugyanaz, mint a root deploynál).
- **Base path:** `next.config.ts` a `GH_PAGES_BASE_PATH` környezeti változóból
  olvassa (`process.env.GH_PAGES_BASE_PATH ?? ""`) — alapértelmezetten üres
  (helyi fejlesztés, `npm run build`, a root deploy mind érintetlen), a
  workflow ezt a `GH_PAGES_BASE_PATH=/soderarak` env-vel állítja be csak a
  saját build lépésében.
- **Asset path:** `assetPrefix` ugyanabból az env-ből, Next-automatikusan
  minden `next/link`, `next/font` és `_next/*` asset elé illeszti. A néhány
  **raw, root-relatív** hivatkozást (amit Next nem kezel automatikusan) egy új
  segédfüggvény (`src/lib/basepath.ts` → `withBasePath()`) fedi le:
  - `src/components/Header.tsx` — fejléc-logó kép
  - `src/app/page.tsx` (2 hely) és `src/app/anyagok/page.tsx` — anyag-textúra
    ikonok
  - `src/app/manifest.ts` — `start_url` és a két ikon `src`
- **Routing megjegyzések:** a projekt saját export-validátora
  (`scripts/prepare-static-export.mjs`) több helyen a kiexportált HTML-ben
  talált abszolút útvonalakat vetette össze a lemezen lévő fájlokkal
  (stylesheet link, OG-kép útvonalak, 404-oldal social-kártya átirányítás) —
  ezek a basePath nélkül jól működtek, de `/soderarak` basePath mellett
  tévesen hibáztak, mert a lemezen a fájlok sosem kapnak `soderarak/` mappa-
  előtagot (azt a GitHub Pages adja hozzá kiszolgáláskor). Javítva egy közös
  `stripBasePath()` helperrel a validátorban — ez tiszta build/lint/typecheck
  mellett ellenőrizve mindkét módban (basePath nélkül és `/soderarak`-kal is).

## GitHub Actions
- **Workflow fájl:** `.github/workflows/deploy-soderarak-pages.yml` (új,
  ebben a repóban, a `soderarak-website` privát forrás-repóban fut — NEM a
  `chefke1337/soderarak` repóban, mert oda csak a kész statikus build kerül,
  forráskód soha).
- **Trigger branch:** jelenleg a `chore/soderarak-github-pages-20261004-1021`
  branch push-a, plusz kézi `workflow_dispatch`. Branch-összevonás után ezt
  frissíteni kell a végleges branch-re.
- **Artifact mappa:** `./out` (a `npm run build` statikus exportja),
  `peaceiris/actions-gh-pages@v4`-gyel pusholva a `chefke1337/soderarak` repó
  `main` branch-ére, SSH deploy key-jel (`SODERARAK_DEPLOY_KEY` secret —
  **még nem létrehozva**, a jóváhagyás utáni lépések része, ugyanazzal a
  mintával, mint a root deploynál: kulcs csak erre az egy célrepóra kap
  írási jogot).
- **Szükséges GitHub Pages beállítás:** a `chefke1337/soderarak` repóban
  Settings → Pages → Source: "Deploy from a branch", branch `main`, `/`
  (root) — VAGY ha a repó publikussá válik, a `<user>.github.io`-hoz
  hasonlóan GitHub ezt gyakran automatikusan felajánlja/bekapcsolja az első
  push után. Explicit API-hívással is beállítható, ez a jóváhagyás utáni
  lépés.

## Ellenőrzések
- **Lint:** PASS (0 hiba, a már ismert 3 `next/image` figyelmeztetés
  változatlan).
- **Typecheck:** PASS.
- **Build (basePath nélkül, a meglévő célokhoz):** PASS — 95/95 oldal,
  Export QA és OG-hash regresszió (44/44) változatlan, tehát ez a munka a
  root deployt és a helyi fejlesztést nem érintette.
- **Build (`GH_PAGES_BASE_PATH=/soderarak`):** PASS — 95/95 oldal, saját
  Export QA zöld a basePath-fix validátorral is.
- **Static export asset-ellenőrzés:** kézzel megnézve a kiexportált
  `out/index.html`-ben és `out/manifest.webmanifest`-ben — a logó, a
  textúra-ikonok, a stylesheet és a manifest ikonok mind helyesen
  `/soderarak/...`-ra mutatnak.
- **a11y (axe):** PASS 45/45 (a basePath-független root exporton futtatva —
  a basePath csak asset-URL-eket érint, a DOM-struktúrát nem).
