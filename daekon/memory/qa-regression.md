# Memória: qa-regression (daekon-quality-master)

## Állapot
- 2026-10-03: bekötve a rendszerbe — roster-tag + 6. kapu (`gate-qa-regression`, blocker, `npm run qa:regression` → daekon/agents/qa-regression.mjs).
- Független ellenőrzés az out/ exportból: meta-készlet (title/canonical/og:*/lang/viewport), og:image → létező 1200×630 PNG, hash-bázis-lefedettség, sitemap↔oldal, robots.txt, JSON-LD értelmezhetőség, üzleti adat (cégnév + telefon a site.ts-ből) a kapcsolat/impresszum oldalakon.

## Megtanult szabályok
- A független QA NEM futtatja újra a kapukat — az export artificekből önállóan validál, így elkapja, ha egy kapu üreget PASS-olt.
- Üzleti adatot NEM beégetve ellenőriz: site.ts-ből regex-szel kinyert cégnév/telefon megy a HTML-vizsgálatba (source-of-truth elv).
- A 45/44 nem hiba: Export QA az OG-hivatkozással bíró oldalakat számolja (45), az og-hash a tényleges opengraph-image.png fájlokat (44).
- Blocker találatnál exit 1 + pontos router/szelektor-szintű üzenet; a javítás után a TELJES kapulánc újrafut (részfuttatás nem elfogadható).
