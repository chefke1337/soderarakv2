# Memória: og-artwork

## Állapot
- 44 OG-kártya a bázisban (scripts/og-baseline.json); 12 variáns (standard…notFound, guideIndex).
- A 404 OG-retarget a prepare-static-exportban történik.
- 2026-10-02: TELJES OG-refresh a petrol+aurora design-világra (44 kártya, új hash-bázis). og.tsx-ben minden régi amber (#a96234/#bd7440/#e4a354/#202625/#211d19) cserélve: INK #1c1917, PAPER #faf6ef, brand #f97316 / brand-dark #c2410c, petrol #0f766e, moss #3f6212, basalt #1a1614.

## Megtanult szabályok
- Új kártya → kapu „MÓDOSULT/ÚJ"-ként megállítja a buildet → og:gallery + pixel-scan → og:hash:update. Ez rendes menet, nem hiba.
- Pixel-scan minták: chip-futók x=900 oszlopon; sötét kártyákon cream #faf6ef cím + brand #f97316 kicker sávok; darkBottom=0 az alsó 25–30 px-ben; jobb szél (x≥1184) 0 kiszaladással mindkét tónuson (világoson L<110, sötéten L>185 a szennység-mérő).
- GuideCard splitOrphanTitle: ≤38 kar, >2 szó, utolsó ≤4 kar → utolsó két szó új sor 66px-en.
- Aurora-foltok a kártyákon rgba radial-gradientek: sötét alapon 0.16–0.30 alpha (főoldal StandardCardon a petrol 0.30 → mélység-árnyalat a basalt fölött, nem tiszta petrol-színpixel — a szín-szkenner főoldalon brandet talál, petrollt nem; ez szándékos art-direction).
- PRICE_TONE amber=brand-dark #c2410c, olive=moss #3f6212, stone=petrol #0f766e — árak, zónák, lépések világos kártyákon.
- ZONE_STYLE: mag brand-dark c2410c, kozel ea580c, tavolabbi f97316 — a térkép brand narancs-rámpájával fut egybe.
