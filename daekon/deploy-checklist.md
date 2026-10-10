# Deploy checklist — soderarak.hu (statikus export)

A weboldal tisztán statikus (`out/`): bármely statikus hosztra feltölthető. Nincs szerver-kód.

## 1. Certifikáció (kötelező, minden deploy előtt)

```bash
npm run daekon
```

- Verdict **PASS** nélkül nincs deploy. Ha FAIL: javítás → újrafuttatás.
- **Csak a teljes lánc számít:** a `npm run daekon:fast` (iterációs gyorskör, build + og + qa)
  PASS-ja nem igazol deploy-t, és a `daekon-report-fast.md`-be ír — ez a checklist a
  [daekon-report.md](daekon/daekon-report.md)-tól (teljes futás) várja a kapu-eredményeket
  és a Lighthouse-számokat.

## 2. Csomag

```bash
node scripts/package-deploy.mjs
```

→ `dist/soderarak-deploy-<idő>.zip` (a `.gz` ikertestvérekkel együtt — gzip_static kiszolgáláshoz).

## 3. Feltöltés (válassz egyet)

- **Netlify / Cloudflare Pages / Vercel**: húzd rá a zip-et vagy kösd a repót; build parancs `npm run build`, output dir `out`.
- **Saját szerver / cPanel (nginx)**: bontsd ki a zip-et a webroot-ba; nginx-hez engedélyezd a `gzip_static on;`-t (a `.gz` fájlokat ki fogja szolgálni).
- **Apache**: a sima fájlok önmagukban is működnek; a tömörítést a szerver dinamikusan végzi (mod_deflate).

## 4. Post-deploy ellenőrzés (5 perc)

| Ellenőrzés | Elvárt |
|---|---|
| `https://soderarak.hu/` | 200, hero renderel |
| `https://soderarak.hu/utmutatok/` | 200, 11 kártya |
| `https://soderarak.hu/sitemap.xml` | 200, 41 URL |
| `https://soderarak.hu/robots.txt` | 200, Sitemap sorral |
| `https://soderarak.hu/opengraph-image.png` | 200, 1200×630 PNG |
| `https://soderarak.hu/nemletezo-oldal/` | 404 dokumentum a saját hibakártyával (noindex) |
| Facebook Sharing Debugger / X Card Validator | a főoldal OG-kártya jelenik meg |
| Search Console | domain tulajdon megerősítése; sitemap beküldése |

## 5. GSC-ellenőrzés (első éles deploy után)

A `.env.example` szerint: `NEXT_PUBLIC_GSC_VERIFICATION` kitöltése után `npm run build` — a meta-tag beégődik az exportba.

## Rollback

Statikus hosztnál a rollback = az előző zip újra-feltöltése. Ezért: minden deploy-csomag maradjon meg a `dist/`-ben (időbélyeges név).
