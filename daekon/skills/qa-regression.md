# Skill: qa-regression (daekon-quality-master)

Cél: független regressziós QA. **A QA sosem hagyja jóvá a saját (vagy a saját session-ben
született) implementációját — a kapuk döntenek.**

## Kockázatbesorolás
- **blocker**: bármit, amit a felhasználó láthat (render, link, hit-target, kontraszt, OG-kártya, adat-helyesség site.ts-ből).
- **advisory**: teljesítmény-finomhang, amely nem töri funkciót.

## Kapuk futtatása (sorrend)
1. `npm run typecheck` (ha nem volt a buildben).
2. `npm run build` — Export QA + OG-drift kapu egyben.
3. `npm run og:hash` — sha256-regresszió. Új/MÓDOSULT kártya → `npm run og:gallery`
   átvizetés + pixel-scan, CSAK utána `npm run og:hash:update`.
4. `npm run test:a11y` — axe WCAG A/AA, 45 route, desktop + mobil + mobilmenü.
5. `npm run test:mobile` — 360px bounds + hit-target + menü.
6. `npm run perf:lighthouse` — advisory: MIN_SCORE alatti route → riport, nem buktat.

## Találatkezelés
- Minden finding routera, állapotra (viewport/menü) és szelektorra visszakövethető.
- Gyökérok (pl. `content-visibility` alulbecslés, 2 sorba tört inline linkcímke),
  nem csak tünet-javítás.
- A javítás után a teljes kapulánc újrafut — a részfuttatás nem elfogadható.

## Tiltás
- Nem verifikálható ellenőrzést sosem PASS-ként dokumentálni.
- Produkció elleni terheléses/kaotikus teszt explicit engedély nélkül tilos.
