# Mérési terv — GA4 + Search Console + call-tracking (Sóderárak)

> Nem webshop: a mérés célja a **hívások és ajánlatkérések** száma és forrása.
> Minden ár/tény a [site configból](../src/content/site.ts) jön; ez a dokumentum csak a mérést írja le.
> Biztonsági alapszabály: env var nélkül a site mérés nélkül fut — a kód nem tartalmaz azonosítót.

## 1. Előkészület (a tulaj teendői)

1. **GA4 property** létrehozása a Google Analyticsben (időzóna: Budapest, valuta: HUF).
2. **Web data stream** a `https://soderarak.hu` címre → a `G-XXXXXXXXXX` mérési azonosító kimásolása.
3. **Search Console**: a `soderarak.hu` property hozzáadása, verifikáció **HTML-tag** módszerrel → a meta tag `content="..."` értékének kimásolása (nem a teljes tag, csak a tartalom).
4. A GA4-ben a Google signals alapból tiltva marad — consent mode mellett nem szükséges.

## 2. Env varok (build időpontban égődnek be a statikus exportba)

| Változó | Példa | Hatás |
| --- | --- | --- |
| `NEXT_PUBLIC_GA4_ID` | `G-ABC1234567` | GA4 betöltés + consent banner megjelenik. Nélküle: nincs mérés, nincs banner. |
| `NEXT_PUBLIC_GA4_DEBUG` | `1` | GA4 debug_view jelzés (DebugView a GA felületen). |
| `NEXT_PUBLIC_GSC_VERIFICATION` | `google5e1f...` | `<meta name="google-site-verification">` a minden HTML-be kerül. |

Példa build:

```bash
NEXT_PUBLIC_GA4_ID=G-ABC1234567 NEXT_PUBLIC_GSC_VERIFICATION=google5e1f... npm run build
```

A sablonérték a `.env.example`-ben van.

### 2.1 Aktiválási folyamat — `.env.local` (2026-10-03 verifikált)

A javasolt út **Windows/PowerShell-barát, inline env szintaxis nélkül**:

1. A repo gyökerében lévő (gitignore-olt) `.env.local` fájlba írd be a
   `NEXT_PUBLIC_GA4_ID=G-...` értéket.
2. `npm run build` — a Next.js a `.env.local`-ból olvassa és a bundle-be égeti.
   **Verifikálva**: üres fájllal 0 `G-` a chunkokban és 0 `googletagmanager` a
   HTML-ekben; kitöltve a `G-` ID a chunkokban (mért build).
3. `npm run qa:regression` — a **9. GA4-ág** mindkét állapotot ellenőrzi:
   mért buildnél (G- beégetve) a consent-banner bundle-jelenlétét (ssr:false →
   sosem HTML-ben) + a debug-mentességet; méretlen buildnél a 0 analytics-
   hivatkozást. Hibainjekcióra (ál-gtag a HTML-be) blocker, exit 1.
4. `npm run daekon` → verdict PASS → `npm run deploy:package` → zip feltöltés,
   majd a §9-es ellenőrzőlista (Realtime, DebugView) élesítés után.

**Státusz (2026-10-03, user-döntés):** a GA4 property még nincs létrehozva —
addig üres `.env.local`-al fut a site (mérés nélküli, §9 szerint). Property létre-
hozása (§1) után az 1–4. lépés az egyetlen teendő.

## 3. Search Console — mit ellenőriz a bekapcsolás után

- Verifikáció: a telepített HTML-tag alapján a GSC "Ellenőrzés" gombja zöld.
- **Beadványok**: `sitemap.xml` benyújtása (a 7 útmutató URL automatikusan benne van).
- **URL-ellenőrzés**: főoldal + 3 új útmutató kézi indexeltetése.
- A GSC a **keresési lekérdezéseket** (query, CTR, pozíció) 2–3 nap késéssel mutatja — ez a consent-től független, szerveroldali adat.

## 4. GA4 eseményséma

Automatikus: `page_view` (SPA-navigációnál is, kézi küldéssel).

Egyedi esemény — **call_tracking**:

| Paraméter | Érték | Forrás |
| --- | --- | --- |
| `call_location` | gomb helye, lásd lejjebb | `[data-call-region]` DOM-attribútum |
| `phone_number` | a config `phone.raw` | `src/content/site.ts` |
| `link_text` | gombfelirat (max 80 karakter) | anchor szövege |
| `link_url` | `tel:` href | anchor attribútum |

Egyedi esemény — **quote_request** (ajánlatkérő mailto megnyitása, a lead gombra kattintva):

| Paraméter | Érték |
| --- | --- |
| `material` | anyag slug a kalkulátorból |
| `m3` | kért mennyiség |
| `settlement` | település slug |
| `zone` | szállítási zóna id-ja |

## 5. Call-tracking régiók (`data-call-region`)

| Régió | Hol | Miért számít |
| --- | --- | --- |
| `header_topbar` | fejléc felső sáv | a leggyakoribb aznapos hívások forrása |
| `header_nav` | fejléc asztali gomb | asztali konverziós jelző |
| `header_mobile_menu` | mobil menü | menü megnyitás után hívók |
| `mobile_call_bar` | fix alsó sáv mobilon | várhatóan a legnagyobb volumen |
| `hero` | főoldal hero (felső szekció) | hirdetett CTA hatékonysága |
| `zaro_cta` | főoldal záró CTA (alsó sötét szekció) | a teljes görgetés utáni döntő hívók |
| `contact_page` | kapcsolat oldal | legszűkebb szándékú hívók |
| `calculator_form` | kalkulátor eredménypanel | számítás után hívók |
| `calculator_error_recovery` | kalkulátor hibaállapot | meghibásodás utáni mentés |
| `quote_form_success` | mailto megnyitás után | hívás az ajánlatkérés után — másodlagos jelzés |
| `footer` | lábléc | alacsony szándék, tájékoztató |
| `not_found` | 404 oldal | elveszett forgalom mentése |
| `guide_body` | útmutató szövegből | tartalom→hívás átváltás |
| `faq_accordion` | GYIK accordion „hívjon” sora (főoldal + anyagoldalak) | anyag szerinti szándék |
| `rendeles_cta` | főoldal „négy lépés” CTA-sora (kalkulátor + hívás gomb) | a lépések után már döntő hívók |
| `arak_cta` | árlista záró CTA-sora (kalkulátor + hívás gomb) | árat látott, döntés előtti hívók |
| `rolunk` | rólunk oldal elérhetőség-tábla | információ utáni hívás |
| `szallitas` | szállítás oldal gyors-kiszállás doboz | időpont-szándék |
| `telepules_oldal` | település aloldal oldalsáv | helyi szándék, zóna szerint |

A régiók a `src/lib/analytics.ts` fejléc-kommentjében vannak számon; a jelölés
egyetlen `data-call-region` attribútum a legközelebbi közös ősön.

## 6. Konverziós definíciók (GA4-ben beállítandó)

| Konverzió | Esemény | Számít |
| --- | --- | --- |
| `call_click` | bármely tel: gomb | **elsődleges** — hívás-szándék |
| `quote_request` | ajánlatkérő mailto megnyitás | **elsődleges** — lead |
| `arkalkulator_submit` | kalkulátor számítás lefutása | másodlagos — mikro-konverzió |

A GA4 felületén: Rendszer → Konverziók → Új konverziós esemény → fenti nevek.

## 7. Riportok (heti 10 perces ellenőrzés)

1. **Tájékoztató → Konverziók**: `call_click` régió szerint — melyik gomb termel?
2. **Látogatók → Oldalak**: `/utmutatok/*` és `/anyagok/*` oldalak hívásrátája.
3. **GSC → Eredmények**: mely lekérdezésekre jelenik meg az oldal (CTR, pozíció).
4. **Tájékoztató → Oldal címe**: 404-re kerülők száma (`not_found` régió hívásai).

## 8. Biztonság és jog

- Consent mode v2: `analytics_storage` default `denied`; a GA4 script csak elfogadás után töltődik.
- Visszavonás: a `_ga*` cookie-k törlődnek (a banner újból megjelenik tárolás-törlés után).
- A call-tracking **nem** rögzít hívásokat és nem küld személyes adatot — csak a gomb-kattintás eseményt.
- Az [adatvédelmi tájékoztatóban](../src/app/adatvedelem/page.tsx) a mérés dokumentálva van.

## 9. Kapcsolási ellenőrzőlista (élesítés után)

- [ ] GA4 valós idejű riportban látszik a saját látogatás (elfogadás után).
- [ ] `call_click` esemény megjelenik DebugView-ban header topbar gombra.
- [ ] `quote_request` esemény a kalkulátor lead gombjára.
- [ ] GSC verifikáció zöld; sitemap benyújtva.
- [ ] A banner elutasítás után a következő oldalon nem jelenik meg újra.
- [ ] Env varok nélküli build: semmilyen analytics szkript nincs a HTML-ben (grep `googletagmanager` → 0 találat) — automatizálva: a qa:regression 9. GA4-ág.
- [ ] `scroll_depth` esemény megjelenik DebugView-ban görgetésre (25/50/75/90/100 sávok, route paraméterrel).

## 10. Scroll-mélység (2026-10-03)

**Esemény:** `scroll_depth` — paraméterek: `route` (normalizált pathname), `percent` (25 | 50 | 75 | 90 | 100), `mobil` (viewport < 640px, esemény-időpontban).

**Működés** (`initScrollDepthTracking` az analytics.ts-ben, az AnalyticsController mountolja):
- Passzív scroll-listener; minden eseménynél max-mélység = scrollY / (docHeight − viewport) × 100 (0–100, nem görgethető oldal = 100).
- Sávonként **egyszer** küld (a max-mélység nem csökken vissza), SPA-route-váltásnál a sávok nullázódnak (route-onként külön olvasási görbe).
- Consent-előtt némá (nincs window.gtag); GA_ID env nélkül a controller nem is mountol.

**CTA-igazítási használat:** GA4 Explore → scroll_depth esemény route + percent bontásban → ha egy route mobilon 75–100 sáv ritkán ért el, a mélyebben lévő CTA feljebb való; ha 25–50-nél tömegesen leáll az olvasás, a CTA-t fel kell hozni. A `call_click` esemény `call_location` paraméterével együtt mutatja, mely pozíció konvertál.

**Verifikálva** (teszt GA_ID-val, valós adatfolyamon): consent előtt 0 esemény 50%-os görgetésre is; consent után a sáv-szekvencia pontosan egyszer; SPA-váltásnál route-nullázás; 1280px-en `mobil: false`.

**2026-10-03:** a `percent` paraméter STRING-ként megy ("25"…"100") — a GA4 numerikus paramétert csak metrikaként tartja meg, törhető egyéni dimenzióként (route → percent bontás, Explore §11) csak a kis kardinalitású string él. dataLayer-ben verifikálva.

## 11. GA4 riport-terv — olvasási- és konverziós riport (2026-10-03)

> Cél: a scroll_depth (olvasási mélység) és a call_click (hívás-hely) adatait a CTA-igazításnál EGY AZ EGYBEN lehessen olvasni — copy-paste-kész riport-definíciók.
> Az események élnek és élőben verifikálva (dataLayer-probe a valós exporton): `scroll_depth` (route, percent, mobil), `call_click` (call_location, phone_number, link_text, link_url), `arkalkulator_submit` (material, m3, settlement, zone).

### 11.1 Egyszeri beállítás a GA4-ben (Admin → Egyéni definíciók)

Az event-paraméterek csak egyéni dimenzióként válnak riportolhatóvá:

| Egyéni dimenzió neve | Hatókör | Esemény-paraméter | Jegyzet |
| --- | --- | --- | --- |
| `olvasasi_route` | Esemény | `route` | csak a scroll_depth viseli |
| `olvasasi_melyseg` | Esemény | `percent` | string bucket: "25", "50", "75", "90", "100" |
| `hivas_helye` | Esemény | `call_location` | régiók: §5-ös tábla |
| `mobil_olvaso` | Esemény | `mobil` | "true" / "false" (scroll_depth) |

Konverziók (Admin → Események → jelölés konverzióként; lásd §6):
- `call_click` — elsődleges (hívás-szándék)
- `quote_request` — elsődleges (lead)
- `arkalkulator_submit` — másodlagos mikro-konverzió (első saját módosítás utáni teljes összegzés; oldalletöltésenként egyszer)

### 11.2 Riport 1 — „Olvasási mélység route-onként” (Explore → Szabad űrlap)

- Sorok (dimenziók): `olvasasi_route`, alá ágyazva `olvasasi_melyseg`
- Oszlop-megiszakítás: `mobil_olvaso` — mobil és asztal egymás mellett
- Értékek: `Eseményszám`, `Felhasználók`
- Szűrő: `Esemény neve` pontosan `scroll_depth`

Olvasható eredmény (példa):

| olvasasi_route | olvasasi_melyseg | true (mobil) | false (asztal) |
| --- | --- | --- | --- |
| / | 25 | 812 | 340 |
| / | 50 | 401 | 210 |
| /utmutatok/mennyi-soder-kell | 50 | 88 | 41 |
| /utmutatok/mennyi-soder-kell | 75 | 21 | 30 |

Olvasás: ha egy route mobilon a 25→50 lépcsőn az eseményszám a felére alá esik, az olvasás ott törik — a mélyebben lévő CTA-t fel kell hozni; ha 75–100 is él, a CTA-pozíció jó.

### 11.3 Riport 2 — „Hívások hely szerint”

- Sorok: `hivas_helye`
- Értékek: `Eseményszám` (= call_click konverzió), `Felhasználók`
- Szűrő: `Esemény neve` pontosan `call_click`

Ez megmutatja, melyik gomb termel — a régiók magyarázata a §5-ös táblában.

### 11.4 A kulcs-KOMBINÁCIÓ: scroll_depth × route × call_location egy nézetben

A GA4-korlát: az `olvasasi_melyseg` csak a scroll_depth, a `hivas_helye` csak a call_click eseményen él — egyetlen sorban csak az egyik telik. A kombináció kétszintű sor-töréssel olvasható:

**Explore → Szabad űrlap:**
- Sorok 1. szint: `olvasasi_route`
- Sorok 2. szint (ágyazott): `hivas_helye`
- Oszlop-megiszakítás: `mobil_olvaso`
- Értékek: `Eseményszám` (a route szintjén = scroll_depth-szám; a route-on belüli gomboknál = call_click-szám), `Felhasználók`
- Szűrő: `Esemény neve` benne van: `scroll_depth`, `call_click`

Egy route sora alatt rögtön látszik, mely gomb (mobile_call_bar? hero? footer?) viszi a hívásokat — és a route görgetési profilja mellett eldönthető: a CTA oda való, ahol az olvasás még tart, de a konverzió nincs.

### 11.5 Konverziós térfogat (a döntés zártláncához)

| Kérdés | Hol olvasható | Olvasat |
| --- | --- | --- |
| Hányan számoltak? | `arkalkulator_submit` eseményszám, `olvasasi_route` bontásban | mikro-konverzió, route szerint |
| Hány lead? | `quote_request` konverzió | kalkulátor → mailto átváltás |
| Árral a kézben hívók? | `hivas_helye = calculator_form` | erős szándék, értékes szegmens |

### 11.6 Heti olvasási rutin (10 perc)

1. Riport 1 (11.2): mely route törik mobilon 25→50-nél → legfeljebb 2 jelölt oldal.
2. Kombinált nézet (11.4): a jelölt route-on melyik `hivas_helye` él, melyik nincs.
3. Döntés: ahol sok olvasás van és csak a `mobile_call_bar` konvertál, ott a tartalmi inline hívás-sor felhozható; ahol 75–100 is él, a jelenlegi pozíció jó — másképp nem bántjuk, amíg 2 hét adat ezt nem támasztja.
4. Tölcsér: `arkalkulator_submit` → `quote_request` → `call_click(calculator_form)` — melyik lépés zsugorodik leginkább.

### 11.7 Határok és adatminőség

- A GA4 az egyéni dimenziót a BEÁLLÍTÁSTÓL kezdve tölti — a korábbi események „(not set)” dimenzióval jelennek meg.
- Kis forgalomnál a GA4 adatküszöb miatt sorokat rejthet — a heti rutin akkor is működik a nyers `Eseményszám`-okkal.
- A `percent` bucket szándékosan 5 érték: stabil, alacsony kardinalitású dimenzió; finomabb mélység a CTA-döntéshez nem kell.
- A `call_click` a GOMB-kattintást méri, nem a tényleges hívást — a valós hívásszám a telefonszolgáltató adataiból jön.

## 12. CTA-pozíciós térkép — mely CTA melyik percent-sávnál él (2026-10-03)

> Cél: a §11.2 scroll_depth adatot közvetlenül lehessen vetíteni a CTA-pozíciókra —
> route-onként, viewportonként megmérve, hogy mely gomb MELYIK sávnál jelenik meg először.
> Mérés: `npm run cta:map` (`scripts/cta-position-map.mjs`) — a build UTÁN futtalandó;
> artifact: `daekon/runs/cta-map-latest.json`. Méret feltételek: 360×800 és 1280×800,
> cv-auto override (valós magasságok, görgetés nélkül).

**Képlet:** firstSeen% = (elem alja − viewport magasság) / (docH − viewport) — az a sáv,
ahol a gomb legalja már látszik görgetés közben; fix/sticky elem: MINDEN sávnál él.

**Fix réteg — minden route-on él (mobil):** `tel@header_topbar` (topbar, görgetve kompakt sávban),
`tel@header_nav` (görgetve a kompakt fejlécben), `tel@mobile_call_bar` (alsó fix sáv).
Asztalon: `header_topbar` + `header_nav`; a mobile_call_bar sm:hidden → 0 route-on sem él.

### Mért tábla — mobil (360×800)

| Route | sáv25 | sáv50 | sáv75 | sáv90–100 |
| --- | --- | --- | --- | --- |
| / | tel@hero (0%), anyag@hero (1%), anyag@unknown (15%) | **tel@rendeles_cta (45%)** | — | tel@faq_accordion (82%), footer (90–93%) |
| /utmutatok/mennyi-soder-kell | anyag+tel@guide_body (25%) | — | footer (62–74%) | — |
| /utmutatok/mennyibe-kerul-a-soder | anyag@unknown (0%) | anyag+tel@guide_body (29–30%) | footer (65–75%) | — |
| /anyagok/soder | — | anyag@unknown (39%) | footer (59–71%) | — |
| /arak | — | — | **tel@arak_cta (58%)**, footer (69–78%) | tel+mailto@footer (78%) |
| /teruletek/erd | anyag@unknown (0%) | **tel@telepules_oldal (46%)** | footer (61–72%) | — |
| /kapcsolat | — | tel@contact_page (30%), mailto@unknown (37%) | footer (62–73%) | — |
| /rolunk | — | tel@rolunk (40%) | footer (58–70%) | — |
| /szallitas | — | — | tel@szallitas (53%), footer | — |
| /arkalkulator | — | — | footer (54–67%) | — |

### Mért eltérések — asztal (1280×800)

- A hero CTA-k korábban látszanak (minden egyéb sávodból): `tel@hero` és `anyag@hero` 0%,
  `tel@rendeles_cta` 40% (mobilon 45%); útmutatókon a guide_body 0–21% (mobilon sáv25–sáv50: 25–30%).
- **Mérési zaj:** a docH futások között ±0,9%-ot ingadozhat (animáció/frame-időzítés) —
  ezért a GA4-projekcióhoz mindig a BUCKET (sáv25/50/75/90/100) a mérték, az %-os
  firstSeen csak tájékoztató; bucket-határt eddig egyetlen CTA sem lépett át futások között.
  (E táblák a `daekon/runs/cta-map-latest.json` 2026-10-03T15:58 artifactját tükrözik.)
- A footer sávja rövidebb (docH 6852 vs 11189 a főoldalon) — a sávhatárok route-onként eltérnek,
  ezért a GA4-adatot mindig e térkép adott viewport-sorával együtt olvasd.

### Olvasat — hogyan vetítd a scroll_depth adatot erre a térképre

1. §11.2 riportból: route X mobilon a 25→50 lépcsőnél törik → nézd meg e térképen a route X
   sáv25-celláját: az ott élő CTA-k látják a legtöbb olvasót; ha konverzió nincs, a CTA-szöveg/pozíció a jelölt.
2. Ha a tömeges leállás 50→75-nél történik, a sáv50-cella CTA-i a döntőpontosak (pl. főoldal: tel@rendeles_cta).
3. `unknown` címke a térképen = jelöletlen régió a kódban — javítandó (data-call-region),
   mert a riportban is unknown-ként jelenik meg (jelenleg: főoldal anyag-hub linkek,
   anyagoldal CTA, /kapcsolat mailto, néhány útmutató-belső link).
4. A térkép a buildhez képest érvényes: layout-változás után `npm run cta:map` újrafuttatandó.

**Módszertani tanulság a mérésből** (a fejlesztés során javítva): a `display:none` ős
(mobile_call_bar asztalon) alatt a gyerek computed display-je VÁLTOZATLAN marad —
a tényleges render-állapotot a `getClientRects().length` mutatja. A fixed/sticky-t az
ősökön is keresni kell (a MobileCallBar wrapperén van a `fixed`).
