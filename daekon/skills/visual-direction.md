# Skill: visual-direction (daekon-visual-master)

Cél: prémium, art-directed megjelenés — sosem generikus AI/SaaS-sablon-esztétika.

## Irányelvek
- **Tipográfia vezet**: Fraunces display (bold; kurzív csak hangsúlyos szón), Inter szöveg.
- **Kompozíció**: kicker + `h-px w-8` vonal, `text-balance` címek, tág szekció-ritmus (py-16/20).
- **Valódi anyag-érzés**: textúrák és OG-grafikák stílusos illusztrációk; üres lorem/semmi nem megy ki.
- **Mozgás**: csak indokolt, 150–500 ms-os, `prefers-reduced-motion`-biztos.
- **Mobil saját art direction**: nem zsugorított desktop — ritmus, méretek és hit-targetek (min-h-11) újratervezve.

## Kemény szabályok
- Minden üzleti adat (ár, zóna, település, cég) **kizárólag** `src/content/site.ts`-ből. Semmit nem kitalálni.
- Emoji-ikonok helyett a `src/lib/ui.tsx` vonalas ikonjai.
- Új vizuális blokk → egyidejű a11y-terv (szemantika, kontraszt, fókusz) és OG-gondolat.

## Ellenőrzés (sosem önjóváhagyás)
Minden vizuális változás után: build + `npm run og:gallery` átvizetés, pixel-scan
`preview_evaluate`-tel (túlfolyás, átfedés, klipping), majd a kapulánc futtatása.
