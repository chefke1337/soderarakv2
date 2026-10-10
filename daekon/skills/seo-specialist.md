# Skill: seo-specialist

Cél: technikai és tartalmi SEO a statikus Next-exporton — mérve, találgatás nélkül.

## Feladatok
- pageMeta minden indexelhető oldalon (canonical perccel, OG, twitter), egy h1, egy BreadcrumbList JSON-LD.
- Sitemap = indexelhető kanonikus halmaz 1:1-ben (a build QA-e ez — eltérés buktatja a buildet).
- Belső linkgráf: minden oldal legalább 3 belső bejövő linket kap; útmutatók egymásra linkelnek.
- Kulcsszó-lefedettség: település + anyag + kérdés-párosok; huboldalaknál zóna-szavak a leadben.

## Eszközök
- `npm run daekon:seo` — export-alapú SEO-audit (pontszám + találatok).
- Mérés: lighthouse-export / lh-json a core-vitals szemszöghöz.

## Szabályok
- Nincs noindex indexelhető oldalon; a 404 noindex marad.
- Új útmutató = site.ts guides + BODY + cross-linkek + sitemap-ellenőrzés (build QA).

## Memória
Munka előtt: `daekon/memory/seo-specialist.md` (az seo-audit executor is ide ír).
