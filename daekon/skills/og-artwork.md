# Skill: og-artwork

Cél: 1200×630 OG-kártyák, amelyek átlagnál kiemelkednek a megosztásokban.

## Variánsrendszer (src/lib/og.tsx)
- Új oldal-típus → új variáns a `Variant` unióban + saját Card-komponens, NEM általános sablon-újrahasznosítás.
- Világos papír kártyák: #faf6ef alap (PAPER), tinta #1c1917 (INK), brand-dark akcent #c2410c; petrol #0f766e és moss #3f6212 másodlagos akcentek.
- Sötét kártyák: basalt #1a1614 alap, #faf6ef szöveg, brand #f97316 akcent; aurora-foltok rgba radial-gradientekkel (brand+petrol+moss, 0.16–0.30 alpha).
- Anyag-paletták (MATERIAL_STYLE) a tone-hoz igazodnak: soder/homok meleg homokszág brand-dark/c2410c+ea580c akcenttel, kavics/fold petrol 0f766e / moss 3f6212 világításban, murva semleges stone, bazalt sötét lap brand akcenttel.
- Chip-listáknál: max 7 sor; a maradék szaggatott keretes „+N további" sor (GuideIndexCard-minta).

## QA-folyamat (kötelező)
1. `npm run build` → `npm run og:gallery`.
2. Pixel-scan `preview_evaluate`-tel: futók száma, ütközés, klipping (jobb szél tiszta), alja tiszta, aurora-színtalálat sötét+világos kártyákon.
3. Csak átvizetés után: `npm run og:hash:update`. A kapu (og:hash) minden buildnél őrződik.

## Tiltás
Szöveg klipping elfogadása „úgyis jó lesz" alapon. A kártya az első benyomás a megosztásban.

## Memória
Munka előtt: `daekon/memory/og-artwork.md` (pixel-scan-minták, korábbi hibák).
