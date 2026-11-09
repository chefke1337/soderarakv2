# Deploy checklist — soderarak.hu (statikus export)

A weboldal tisztán statikus (`out/`): nincs szerver-kód, nem igényel Node.js
futtatást a célkörnyezetben. **Kivétel:** a rendelési igény beküldése külön,
saját futó backendet igényel (`server/php/api/rendeles.php` vagy
`server/worker.ts`, lásd `server/README.md`) — ha a `NEXT_PUBLIC_ORDER_API_URL`
build-env nincs beállítva (jelenleg nincs), a kalkulátor űrlapja ezt
dokumentáltan jelzi ("a beküldési végpont nincs beállítva") és telefonos
alternatívát ajánl — ez NEM hiba, ez a tervezett, bekötés nélküli viselkedés.

## 2026-11-09-i státusz — melyik ZIP használható

- ❌ `dist/_SUPERSEDED_DO_NOT_UPLOAD/soderarak-deploy-2026-11-09T19-58-38.zip`
  — **NE töltsd fel.** Kikapcsolt indexeléssel készült (`noindex, follow`),
  és a teljes `npm run daekon` ellenőrzés nem futott le rajta igazoltan.
- ✅ `dist/soderarak-deploy-2026-11-09T20-23-15-VERIFIED.zip` — SHA-256
  `bf37275bc4056c89f466707132c7b8e1daee1df5e6d47728f95090635b450c48`,
  19 192 kB, 569 fájl. Indexelhető build (`NEXT_PUBLIC_PREVIEW=false`),
  teljes `npm run daekon` **PASS**, a kicsomagolt ZIP-tartalomból önállóan
  is lefuttatva: böngészős smoke teszt 74/74 OK. Részletek:
  `docs/decisions.md` 2026-11-09 20:36–21:24-i bejegyzése.
- Minden következő kiadáshoz **új, egyértelmű nevű ZIP** kell (lásd 2.
  szakasz) — a régi fájlt ne írd felül, ne töröld jóváhagyás nélkül.

## 1. Certifikáció (kötelező, minden deploy előtt)

```bash
# Mock rendelési backend a smoke teszthez (külön terminálban):
npm run mock:order

# Teljes, nem cache-elt lánc — a három env nélkül HAMIS eredményt ad:
DAEKON_FULL_AUDIT=1 LH_ALL=1 \
  NEXT_PUBLIC_ORDER_API_URL=http://127.0.0.1:8788/order \
  NEXT_PUBLIC_PREVIEW=false \
  npm run daekon
```

- Verdict **PASS** nélkül nincs deploy. Ha FAIL: javítás → újrafuttatás.
- **`DAEKON_FULL_AUDIT=1` KÖTELEZŐ.** Nélküle a `test:a11y`/`test:mobile`/
  `perf:lighthouse` gate csendben **cache-skip**-pel tér vissza változatlan
  fán, és a riport PASS-nak látszik anélkül, hogy valódi ellenőrzés futott
  volna (2026-11-09-i auditpassz megállapítása).
- **`NEXT_PUBLIC_PREVIEW=false` KÖTELEZŐ production kiadáshoz.** Ez a
  tényleges, valódi kapcsoló a `noindex` meta-mezőre (`src/content/
  site.ts` `IS_PREVIEW`, 2026-11-09-ig hardkódolt literál volt a
  `layout.tsx`-ben, ettől függetlenül — azóta javítva). Nélküle a build
  a GitHub Pages demo-deploy-kal azonos, szándékosan noindex állapotban
  készül — ez helyes a demo-khoz, de NEM az éles `soderarak.hu`-hoz.
- **Csak a teljes lánc számít:** a `npm run daekon:fast` (iterációs gyorskör,
  build + og + qa) PASS-ja nem igazol deploy-t, és a `daekon-report-fast.md`-be
  ír — ez a checklist a [daekon-report.md](daekon-report.md)-tól (teljes
  futás) várja a kapu-eredményeket és a Lighthouse-számokat.
- A certifikáció helyi, nem destruktív, nem publikál és nem push-ol semmit.

## 2. Csomag

```bash
node scripts/package-deploy.mjs
```

→ `dist/soderarak-deploy-<idő>.zip` (a `.gz` ikertestvérekkel együtt — gzip_static
kiszolgáláshoz). **Minden kiadáshoz új fájl keletkezik** (időbélyeges név) —
soha ne írd felül kézzel egy korábbi ZIP-et, és ne törölj korábbi
deploy-csomagot jóváhagyás nélkül (rollback-forrás, lásd lent).

**A csomagolás után, feltöltés előtt ajánlott önálló ellenőrzés** (nem csak
az `out/` mappát, a ténylegesen átadott ZIP-et):

```bash
sha256sum dist/soderarak-deploy-<idő>.zip
tar -tf dist/soderarak-deploy-<idő>.zip | wc -l   # bejegyzésszám
mkdir -p /tmp/release-check && tar -xf dist/soderarak-deploy-<idő>.zip -C /tmp/release-check
diff -rq out /tmp/release-check   # a csomagolás hűséges-e (0 eltérés az elvárt)
```

A kibontott mappa gyökerén közvetlenül az `index.html`, `robots.txt`,
`sitemap.xml` stb. legyen (NE egy `out/` nevű almappában) — ez a FTP
feltöltési célkönyvtár tartalma, nem a mappa maga.

## 3. Feltöltés (válassz egyet)

- **Netlify / Cloudflare Pages / Vercel**: húzd rá a zip-et vagy kösd a repót;
  build parancs `npm run build`, output dir `out`. A `_headers` fájl
  (cache-policy) ezeken a platformokon automatikusan érvénybe lép.
- **Saját szerver / cPanel / egyszerű FTP (nginx)**: bontsd ki a zip-et a
  webroot-ba; nginx-hez engedélyezd a `gzip_static on;`-t (a `.gz`
  fájlokat ki fogja szolgálni). A `_headers` fájl ezen a platformon **NEM**
  érvényesül automatikusan — ismeretlen a tényleges nginx-konfiguráció,
  ezért a cache/biztonsági fejlécek kézi nginx-konfigot igényelnek, ha
  ezek fontosak; ez külön, szerver-hozzáféréssel rendelkező feladat.
- **Apache / sima FTP tömörítés nélkül**: a sima fájlok önmagukban is
  működnek; a tömörítést a szerver dinamikusan végzi (mod_deflate), vagy
  marad tömörítés nélkül — mindkét eset funkcionálisan helyes, csak a
  sávszélesség-megtakarítás marad ki `.gz` kiszolgálás nélkül.
- **FTP-s feltöltés nem atomi**: amíg a feltöltés tart, a szerveren
  **vegyes régi/új fájlállapot** lehet látható (régi HTML új CSS-sel,
  stb.) — ha ez kockázat, töltsd fel egy ideiglenes alkönyvtárba, majd
  egy műveletben (átnevezéssel/symlink-váltással) cseréld a webroot-ot,
  ha a hosting ezt támogatja.
- **Régi fájlok/törölt oldalak kezelése**: ha korábbi kiadásból maradt
  fájl a szerveren, amit az új ZIP nem tartalmaz (pl. egy már törölt
  terület-aloldal), azt a feltöltés **nem** törli automatikusan (sima
  FTP-másolás nem szinkronizál, nem töröl). Törlés előtt egyeztesd, mely
  fájlok maradhatnak (pl. `.htaccess`, egyéni szerver-config) — vak,
  teljes webroot-törlés NEM ajánlott.
- **Backup/visszaállítás**: töltsd le vagy archiváld a jelenlegi éles
  webroot tartalmát feltöltés ELŐTT, ha a hosting nem ad natív
  verziózást/rollback-et.
- **Cache/CDN invalidálás**: ha a domain előtt CDN vagy proxy van
  (ismeretlen ezen a projekten), a feltöltés után szükség lehet manuális
  cache-purge-ra — ezt a tényleges hosting-konfiguráció ismerete nélkül
  nem lehet előre szkriptelni.

## 4. Post-deploy ellenőrzés (5 perc)

| Ellenőrzés | Elvárt |
|---|---|
| `https://soderarak.hu/` | 200, hero renderel, `<meta name="robots" content="index, follow">` |
| `https://soderarak.hu/utmutatok/` | 200, 11 kártya |
| `https://soderarak.hu/sitemap.xml` | 200, **59 URL** (nem 41 — a korábbi szám elavult) |
| `https://soderarak.hu/robots.txt` | 200, `Sitemap: https://soderarak.hu/sitemap.xml` sorral |
| `https://soderarak.hu/opengraph-image.png` | 200, 1200×630 PNG |
| `https://soderarak.hu/nemletezo-oldal/` | 404 dokumentum a saját hibakártyával, `<meta name="robots" content="noindex">` |
| `https://soderarak.hu/impresszum/` | 200, `<meta name="robots" content="noindex">` (szándékos, B kategória) |
| Facebook Sharing Debugger / X Card Validator | a főoldal OG-kártya jelenik meg |
| Search Console | domain tulajdon megerősítése; sitemap beküldése; indexelés kérése |

Ezek a sorok csak a tényleges feltöltés UTÁN tekinthetők elvégzettnek —
helyi ellenőrzés nem helyettesíti őket.

## 5. GSC-ellenőrzés (első éles deploy után)

A `.env.example` szerint: `NEXT_PUBLIC_GSC_VERIFICATION` kitöltése után
`npm run build` (a `NEXT_PUBLIC_PREVIEW=false`-lal együtt) — a meta-tag
beégődik az exportba.

## Rollback

Statikus hosztnál a rollback = az előző, **jóváhagyottan feltöltött** zip
újra-feltöltése. Ezért: minden deploy-csomag maradjon meg a `dist/`-ben
(időbélyeges név) — ne törölj korábbi, egyszer már élesített csomagot.
