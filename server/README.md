# Rendelési igény backend (V3)

A Sóderárak frontend **statikus export** (GitHub Pages), ezért nem tud
szerveroldali route-ot kiszolgálni. A rendelési igény beküldését külön
backend fogadja.

## Állapot — ÉLES E-MAILKÜLDÉS NINCS AKTIVÁLVA

Jelenleg **nincs** a projektben e-mail-szolgáltatói hozzáférés (API-kulcs,
hitelesített feladó domain), ezért:

- a kód teljes, tesztelt és futtatható;
- lokálisan **mock módban** fut (`npm run mock:order`), ahol a valódi
  handler dolgozik, de **e-mail nem megy ki** — a levelek a `.mock-mail/`
  mappába kerülnek;
- az éles küldés addig **nem tekinthető késznek**, amíg a lenti adatok
  meg nem érkeznek.

## Mi kell az éles aktiváláshoz?

1. **Transzakciós e-mail szolgáltató** (pl. Resend / Postmark / Mailgun) —
   fizetős szolgáltatás bevezetése **jóváhagyást igényel**.
2. **Hitelesített feladó domain**: a `soderarak.hu`-ra SPF/DKIM DNS-rekord
   kell. **DNS-módosítás jóváhagyást igényel.**
3. **API-kulcs** a szolgáltatótól — kizárólag Worker/function secretként,
   soha nem a frontendben és soha nem a repóban.
4. A választott szolgáltató pontos JSON-mezőneveinek illesztése a
   `createHttpEmailSender()`-ben (`server/worker.ts`).

## Architektúra

| Fájl | Szerep |
| --- | --- |
| `src/lib/order.ts` | Megosztott séma + validáció (kliens és szerver ugyanezt futtatja) |
| `src/lib/quote.ts` | Árszámítás (bruttó anyag + nettó fuvar + fuvar ÁFA) |
| `src/server/order-handler.ts` | Keretfüggetlen handler: validáció, rate limit, idempotencia, hiteles újraszámolás, levélszöveg |
| `server/worker.ts` | Cloudflare Worker HTTP-adapter (CORS, méretkorlát, secretek) |
| `scripts/mock-order-server.mjs` | Lokális mock backend — a valódi handlerrel, mock küldővel |
| `src/lib/order-client.ts` | Kliensoldali POST: timeout, idempotencia-kulcs, hibaállapotok |

## Biztonsági garanciák a kódban

- **Szerveroldali validáció**: `validateOrderRequest()` — a kliens
  validációja csak kényelmi.
- **Hiteles árazás**: `recomputeOrderQuote()` a központi katalógusból
  számol. A kliens által küldött `clientTotalGross` **csak eltérés-jelzésre**
  szolgál, a levélben a szerveroldali összeg szerepel.
- **Rate limit**: IP-alapú, 10 perces ablakban max. 5 beküldés
  (`createMemoryRateLimiter`). Több példány esetén osztott tárat
  (KV/Redis) kell injektálni.
- **Dupla beküldés**: `idempotencyKey` — ugyanaz a kulcs másodszor nem
  küld levelet, a válasz `duplicate: true`. KV-tárral példányok között is.
- **Injection**: minden szabad szöveges mező `sanitizeLine` /
  `sanitizeBlock` szűrésen megy át (CR/LF és vezérlőkarakterek kiszűrve),
  így nincs e-mail-fejléc-injekció. Az ügyfél címe **reply-to**, nem feladó.
- **Biztonságos hibakezelés**: a szolgáltatói választörzs soha nem kerül a
  válaszba; a kliens általános magyar hibaszöveget és telefonos
  alternatívát kap.
- **Adatminimalizálás**: személyes adat nem kerül URL-be (minden a POST
  törzsében megy), és a szerver logja csak a tárgyat írja ki, tartalmat nem.
- **Méretkorlát**: 16 KB (`MAX_BODY_BYTES`) a parse előtt.

## Lokális futtatás

```bash
# 1) mock backend (külön terminál)
npm run mock:order

# 2) a frontend tudja, hová POST-oljon
echo 'NEXT_PUBLIC_ORDER_API_URL=http://127.0.0.1:8788/order' >> .env.local

# 3) frontend
npm run dev -- --port 3100
```

Hibaszimuláció a végponton:

- `?simulate=fail` → a küldő hibát dob (502-es válasz, „nem sikerült")
- `?simulate=timeout` → a válasz 20 s-ot vár, a kliens 12 s-os timeoutja aktiválódik

## Worker telepítés (ha a fenti adatok megvannak)

```bash
npx wrangler deploy server/worker.ts
npx wrangler secret put EMAIL_API_KEY
# változók: ORDER_RECIPIENT, ALLOWED_ORIGINS, EMAIL_API_URL, EMAIL_FROM
# opcionális KV: ORDER_KV (idempotencia több példány között)
```

Majd a frontend buildhez: `NEXT_PUBLIC_ORDER_API_URL=https://<worker-url>/order`.
