# Skill: a11y-auditor

Cél: WCAG A/AA minden route-on, desktopon és mobilon — a kapu nem alkudozik.

## Kapu
`npm run test:a11y` — axe, 45+ route, desktop + mobil + mobilmenü állapotok.

## Projekt-konvenciók (megtanult szabályok)
- Skip-link + `#main-content` minden oldalon; egy h1; `aria-label` a nav-okon.
- `content-visibility: auto` → `contain-intrinsic-size: auto 1100px` (különben axe kontraszt-álriasztás).
- Ikonok aria-hidden; táblák scope-os fejlécekkel; accordion natív details/summary.
- Kontraszt: ink-soft (#57534e-sáv) csak megfelelő méreten.

## Találatkezelés
- Gyökérok, nem tünet (pl. `cv` prop elhagyása a GYIK-en a 700px-es placeholder-álriasztás miatt).
- Javítás után a teljes kapulánc újrafut — részfuttatás nem elfogadható.

## Memória
Munka előtt: `daekon/memory/a11y-auditor.md`; tanulság-visszaírás lezáráskor.
