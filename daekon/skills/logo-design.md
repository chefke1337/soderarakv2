# Skill: logo-design (daekon-visual-master / designer)

## Forrás
Kutatás 2026-10-03 (user kérés: „profi grafikusként viselkedni, ne AI-logó"):
- mwhdesign.com — „5 Reasons AI logos are Terrible for Business" (Mike Hosier)
- lefthd.com — „Why Do AI Logos Look Alike?" (kategória-kliésekből rekombinált minták)
- corwindesign.com / LinkedIn (production: nem vektor, nem méretezhető)
- Recraft/Figma MCP ökoszisztéma (tech-registry: mcp-recraft, mcp-figma-devmode — candidate)

## Anti-AI checklist (mindegyik kötelező egy logódöntésnél)
1. **Kevesebb a több**: max 2-3 szín + 1 árnyalatlépcső; tiszta, vastag sziluett; NINCS mikrorészlet (tükrök, rács-lécek, felirat) — ami 16px-en eltűnik/sárrá olvad, az ki a markból. FENNTARTÁS (2026-10-03): a műfajhoz tartozó nagy elemek (ablak, perem, borda, rakat, kerék-agy) NEM mikrorészlet — 16px-en is olvasható méretben (>6px @96px viewBox) mehetnek be; a „kevesebb" a festési zajra vonatkozik, nem a sziluett sűrűségére.
2. **Nincs szöveg az SVG-ben**: a szöveg (wordmark) valódi tipó, külön eleme a rendszernek (HTML/H1), nem renderelt path/text. SVG <text> kis méretben olvashatatlan.
3. **Nem szó szerinti**: „hány autómárka logója maga az autó? Nulla." A mark a üzlet TÖRTÉNETÉT meséli (pl. dömper-rakat + kavics), nem a tárgy fotóját. Kategória-kliisé (kamion front-view + felirat) = generikus. FENNTARTÁS (2026-10-03): oldalsziluett-jármű/skip SŰRŰ, flat kialakítással műfaj-konvenció (Buda-Konténer-típusú ipari cégeknél ez a normális), nem automatikus kliisé — a kliisé a gradiens + 3D + SVG-szöveg kombináció.
4. **Vektor + méretezhetőség**: viewBox-alapú, favicon-teszt 16/32px-en, mono-teszt (1 színben is felismerhető sziluett).
5. **Jellem / szándékos „hiba"**: tökéletesen szimmetrikus, sablonos egyensúly = generikus. Enyhe aszimmetria, döntés, egyedi facet-vágás adja a kezi nyomot.
6. **Konzisztens fény**: EGY fényforrás (pl. bal-felső) — top-face legvilágosabb, oldal közepes, árnyék-oldal legsötétebb; a „3D" megoldás izometrikus/facettált árnyalatlépcső, NEM WebGL (LCP-gátló, lásd tech-registry: threejs-hero rejected).
7. **Rendszer, nem objektum**: logomark (SVG) + wordmark (valódi tipó) külön; favicon külön egyszerusitett változat lehet, de a sziluett közös.

## Műfaj-elemzés referencialogóból (2026-10-03-tól a folyamat része)
Ha a user meglévő logóhoz (saját cégcsoport vagy műfaj) igazít: (a) töltsd be a logót canvas-ra, számítsd ki a szín-palettát és %-os arányát; (b) 60×20 tónustérképpel vedd le a szerkezetet (mark vs. wordmark elrendezés, tónuszene karok); (c) ugyanezt a nyelvet vidd át ÚJ, saját rajzra — nem másolatra.

## Folyamat (így dolgozik a profi)
1. Kutatás + koncepció-irányok (min. 3, történetvezérelt).
2. **Logo-lab**: HTML-lap több mérettel (96/48/24/16) és hátterekkel (világos/sötét/brand), screenshot + iteráció MIELŐTT a kódba kerül. Screenshot helyett ha fagy: canvas-raszterizált MÉRÉS — coverage% + tónustérkép 96px-en 12×12 rácson és 16px-en 8×8 rácson (N=narancs, F=világos, s=sötét, .=átlátszó), invertált favicon-tile + WCAG-kontraszt. Döntési kritérium: 16px-en olvasható sziluett + mindhárom tónuszene kar jelen. Invertált tile-nál a színcsere KÖLCSÖNÖS egy-lépéses regex-alternációval (szekvenciális lánc önmagát üti).
3. A győztes mark beépítése (TruckLogo.tsx helyett LogoMark), favicon (icon.svg) egyszerusitett tile-változata.
4. Kapulánc + memória-visszaírás.

## MCP-k (kutatott, candidate a tech-registry-ben)
- Recraft MCP: valódi vektor-kimenetű képgenerálás — koncept-nyersanyagnak; telepítés user-engedéllyel.
- Figma Dev Mode MCP: design→kód kontextus, ha a user Figma-ban dolgozik.
- Ebben a környezetben egyik sem él (csak supabase + sentry) — a vektor-munka kézzel, lab-iterációval történik.
