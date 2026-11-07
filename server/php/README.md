# Rendelési igény — PHP-végpont (tárhelyre)

A soderarak.hu statikus export (HTML/JS), ezért magától nem tud levelet
küldeni. A rendelési igényt a tárhelyre feltöltött **`/api/rendeles.php`**
fogadja és továbbítja az **info@soderarak.hu** címre. A címzett a kódban
rögzített; a böngésző nem írhatja felül. További fix címzett (pl. egy
másolat-cím) csak szerveroldalon adható meg: `ORDER_EXTRA_RECIPIENTS` a
webgyökér fölötti config-fájlban — a címet ne írd a repóba.

## Feltétel

A tárhelynek **PHP 8.0+**-t kell futtatnia. Ellenőrzés feltöltés után:
`https://soderarak.hu/api/rendeles.php?allapot=1` → `{"ok":true,...}`.
Ha ehelyett a PHP forráskód töltődik le vagy 404 jön, a tárhely nem futtat
PHP-t — ilyenkor külön backend kell (lásd `server/README.md`, Worker).

## Telepítés

A tárhely-ZIP (`hosting/**` ág → GitHub Release) már tartalmazza az
`api/` mappát (`rendeles.php` + generált `rendeles-adatok.php`), és a
kalkulátor a `/api/rendeles.php` címre küld.

Küldési mód:

1. **Alapértelmezés — PHP `mail()`**: a tárhely saját levelezője küld,
   feladó: `info@soderarak.hu`. Nincs szükség jelszóra. Ha a tárhely
   letiltja vagy a levél nem érkezik meg, használj SMTP-t.
2. **SMTP**: a `soderarak-rendeles-config.example.php` mintát
   `soderarak-rendeles-config.php` néven a **webgyökér fölé** másold, és add
   meg a szolgáltató SMTP-adatait (host, port, titkosítás, felhasználó,
   jelszó). Alternatíva: `.htaccess` `SetEnv` sorok. A jelszó soha nem kerül
   a repóba vagy a frontendbe.

## Ellenőrzés

- Automata teszt (valódi levél nélkül): `npm run test:order-php`
- Éles próba: csak **jóváhagyott** tesztlevéllel. A `X-Soderarak-Teszt: 1`
  fejlécű kérés tárgya `[TESZT]` jelölést kap. A sikerüzenet azt jelenti,
  hogy a küldő **átvette** a levelet — a postafiókba érkezést az
  info@soderarak.hu fiókban kell megnézni.

## Védelem

Szerveroldali validáció és árújraszámolás, 16 KB méretkorlát, saját
domainre szűkített Origin, IP-alapú korlát (5 / 10 perc), dupla beküldés
szűrése (24 óra), rejtett csapda-mező, CR/LF-szűrés (nincs fejléc-
injekció), a beküldő címe csak Reply-To. Hibánál 502 + magyar üzenet
telefonszámmal — sikert csak tényleges átvételkor jelez.

Az árazási adat (`rendeles-adatok.php`) generált:
`node --experimental-strip-types scripts/build-order-data.mjs`
(a teszt eltérés esetén elbukik).
