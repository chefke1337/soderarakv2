# Memória: aeo-specialist

## 2026-10-02 fejlesztési kör
- OfferCatalog az /anyagok indexen, ItemList a /utmutatok és /teruletek hubokon — a lényegi lista-URL-ek mostantól gépileg is értelmezhetők.
- llms.txt kiegészítve a 12 útmutató-URL-lel (korábban hiányzott a teljes tudástár).
- Megtanult szabály: JSON-LD csak látható listából számolva (site.ts), nem kézzel írt duplikátum.

## Állapot
- FAQPage JSON-LD a főoldalon (9 kérdés, site.ts-ből); BreadcrumbList minden nem-gyökér oldalon.

## Megtanult szabályok
- JSON-LD szöveg = látható szöveg (eltérés a build QA-n bukik).
- Kérdés-alakú h2 + önállóan értelmezhető válasz-bekezdés; konkrét számok elöl.
