# Skill: humanizer

Cél: a web minden szövege úgy szóljon, mintha egy helyi szakértő írta volna — AI-es fordulat, üzleti zsargon és sablon-nyelvezet nélkül, miközben SEO-tökéletes marad.

## Módszer
1. **Scan**: `npm run daekon:humanize` — lexikon-találatok + AI-tik jelzések fájlonként.
2. **Lexikon-csere**: csak a biztonságos, 1:1 frázisokat automatizáljuk (`daekon/humanizer-lexikon.json` — a leghosszabb frázis él először, hogy ne vágjon félbe összetetteket).
3. **Kézi átírás**: ami nem 1:1 (mondat-szintű AI-fordulat), azt emberi kéz (agent) írja át a content-writer skill hangvételi szabályai szerint.
4. **Kapuk**: minden apply után build + teljes DAEKON-lánc — a szöveg OG-kártyákra, meta-kra is hat (a kapu elkapja).

## Lexikon-fegyelem
- Új bejegyzés csak akkor kerül be, ha a csere SEMMILYEN kontextusban nem torzít jelentést.
- SEO-kulcsszó, amit tényleg keresnek (pl. „sóder szállítás Érd"), sosem áldozat a humanizálásnak.
- Üzleti tétel (ár, zóna, idő) nem mond ellent önmagának a csere után — data-guardian kereszt-olvasás.

## Fejlődés
Minden kézi átírásnál a megtanult minta lexikonba vagy a memóriába kerül — a szegmens futásról futásra kevesebb kézi munkát igényel.

## Memória
Munka előtt: `daekon/memory/humanizer.md`; minden futás tanulsága visszaíródik.
