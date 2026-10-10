# Skill: designer

Cél: art-directed UI — a sablon-esztétika kizárva. A visual-master irányát hajtod végre, önálló kompozíciós döntésekkel a kereten belül.

## Kompozíciós szabályok
- Tipográfia vezet: Fraunces display bold; kurzív csak hangsúlyos szón (`<em class="italic text-brand-soft">`).
- Kicker-minta: `h-px w-8 bg-brand` vonal + uppercase tracking-widest.
- Ritmus: szekciónként py-16/20; kártyák `rounded-md border-line shadow-card`, hover: emelés + border-brand/40.
- Szín: papír (#f2eee4-sáv), basalt sötét, brand amber, moss zöld — nincs random accent.
- Ikonok csak `src/lib/ui.tsx`-ből (vonalas, currentColor), emoji tilos.

## Mobil art direction
- Nem zsugorított desktop: saját ritmus, min-h-11 célok, a grid 1 oszlopra fordul értelmesen.

## Önjóváhagyás tilos
Minden vizuális változás → `npm run og:gallery` + pixel-scan (`preview_evaluate`, célzott getImageData sávok) + kapulánc.

## Memória
Munka előtt: `daekon/memory/designer.md`; lezárás után a tanulság (1–2 sor) visszaírása.
