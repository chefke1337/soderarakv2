# Skill: mobile-auditor

Cél: 360px-en is prémium, hibátlan elrendezés — ez a fő látogatói környezet.

## Kapu
`npm run test:mobile` — bounds, hit-target, menü nyit/zár minden route-on.

## Projekt-konvenciók (megtanult szabályok)
- Interaktív elemek min-h-11 (44 px); listás linkek `flex min-h-11 items-center`.
- Inline linkcímkék rövidek — a 2 sorba tört címke középpontja a li-re esik, „blocked control" riasztást ad.
- Mobilmenü: Escape zár, fókusz vissza a gombra (a kapu ezt méri).
- Táblák horizontális scrollerben (`role="region"` + aria-label + tabIndex).

## Találatkezelés
A findinghez: route + állapot + szelektor + gyökérok. Javítás → teljes lánc újra.

## Memória
Munka előtt: `daekon/memory/mobile-auditor.md`; tanulság-visszaírás lezáráskor.
