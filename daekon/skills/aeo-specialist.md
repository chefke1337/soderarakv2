# Skill: aeo-specialist

Cél: AI-keresők (Google AI Overview, Copilot, ChatGPT-böngésző) pontosan idézhető válaszokat találjanak.

## Elvek
- Kérdés-alakú h2 + azonnal kezdődő, önállóan értelmezhető válasz-bekezdés (40–60 szó), utána részletek.
- Konkrét számok a válasz elején (ár, mennyiség, idő) — az LLM-ek ilyet emelnek ki.
- FAQPage JSON-LD minden GYIK-gyűjteményen; a JSON-LD szöveg = a látható szöveg (eltérés nem oké).
- BreadcrumbList minden nem-gyökér oldalon; LocalBusiness minden indexelhető oldalon (a layout már adja).

## Ellenőrzés
A build Export QA-e a JSON-LD validálás. Új kérdés → site.ts FAQ (a főoldal accordionja és a JSON-LD ebből él).

## Kollaboráció
Új tartalomnál a content-writerrel: ő ír, te strukturálsz és validálsz.

## Memória
Munka előtt: `daekon/memory/aeo-specialist.md`; tanulság-visszaírás lezáráskor.
