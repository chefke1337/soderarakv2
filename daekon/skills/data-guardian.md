# Skill: data-guardian

Cél: a látogató sosem lát kitalált vagy ellentmondó üzleti adatot.

## A forrás
Minden ár, zóna, fuvaridő, település, cégadat **kizárólag** `src/content/site.ts`-ből. A felület renderel, nem tud.

## Szabályok
- Új oldal/kártya/szöveg csak meglévő site.ts-adatokból számolhat (pl. StatBand: settlements.length, allMaterials.length).
- Új üzleti tény (pl. új ár) → a site.ts-be kerül ELSŐKÉNT, onnan mindenhol frissül.
- Két megjelenítés sosem mondjon ellent same adatról — ha találatsz ellentmondást: azonnali javítás + memória-bejegyzés.
- Példaszámítások (8 m³ példa, 20 m²-es kocsibeálló) → az oldal + FAQ + útmutató ugyanazt a számot mondja.

## Ellenőrzés
`npm run daekon:seo` (og/meta-adatok) + gondos kereszt-olvasás; az OG-kártyák szövege is az adatokból épül (og:hash kapu védi).

## Memória
Munka előtt: `daekon/memory/data-guardian.md`; talált ellentmondás mindig visszaírva.
