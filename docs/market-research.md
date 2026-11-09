# Piac- és versenytárskutatás — soderarak.hu (2026-11-09)

Ez a dokumentum a `CLAUDE.md`/projektutasítás 8. szakaszának (**Piackutatás**)
önálló munkafázisát rögzíti. A korábbi auditkörök (`docs/v3-audit-and-fixes.md`,
`docs/decisions.md`) technikai SEO-ra, tartalomra, teljesítményre és
akadálymentességre koncentráltak — **versenytárs- és piackutatás korábban
egyáltalán nem történt** ebben a projektben (ellenőrizve: `grep -ri ambrus
docs/` 0 találat a kutatás megkezdése előtt). Ez a dokumentum ezt a hiányt
zárja.

## 0. Módszer, hozzáférés, korlátok

| Eszköz | Szerep | Korlát |
|---|---|---|
| `WebSearch` | SERP-mintavétel, szereplők azonosítása | Nem Google-fiókos, helyhez kötött, valódi keresés — **nem egyezik szükségszerűen azzal, amit egy budapesti felhasználó böngészőben lát**. Nincs dátum/eszköz-specifikus rögzítés Google oldalán, csak a kapott találati lista. |
| `WebFetch` | Versenytárs-oldalak tartalmának kinyerése | A tartalmat egy kisebb modell **összefoglalja**, nem szó szerinti nyers HTML-t ad — számokat, árakat ezért a kutatás a tényleges árlista-oldal külön lekérésével kereszt-ellenőrizte, de egy-egy számjegyhiba nem kizárható. Kliensnek szánt végleges árhasonlításhoz ajánlott egy második, kézi ellenőrzés. |
| Search Console / fizetős kulcsszóeszköz | — | **Nincs hozzáférés** — keresési volument, CPC-t, nehézségi pontszámot ez a dokumentum **nem állít és nem becsül**. |
| Mobilos UX-teszt a versenytársaknál | — | **Nem történt** — a mátrix "mobilos élmény" oszlopa ezért "nem ellenőrzött", nem pedig értékelt. |

Bizonyossági szintek (a `CLAUDE.md` 4. szakasza szerint): **A** élőben
ellenőrzött (közvetlen HTTP/HTML-lekérés), **E** következtetés, **F** még
ellenőrizendő. Minden állításhoz jelölve.

---

## 1. Azonosított szereplők (8.1)

### 1.1 Közvetlen helyi versenytárs (kiemelt — a megbízás szerint)

**Ambrus Fuvar** — a megbízásban névvel megjelölt versenytárs. Vállalkozás és
domain azonosítva és ellenőrizve (nem feltételezve): `ambrusfuvar.hu`,
tartalma és kínálata (termőföld, sóder, murva, homok, kavics, homokos
kavics, bazalt/andezit szállítása Budapest és környékére) a megbízásban
leírt piaci szegmenssel egyezik. **Bizonyosság: A** (közvetlen `WebFetch`,
2026-11-09, élő oldal, 2 aloldal lekérve: főoldal + `/info/arlista`).

### 1.2 Organikus versenytársak (ugyanazokra a kereskedelmi keresésekre jelennek meg)

Két mintakeresésre (`"sóder ár Budapest szállítással"`,
`"sóder szállítás XI. kerület ár"`, `WebSearch`, 2026-11-09, nyelv: hu,
régió: nem rögzíthető) megjelent, releváns szereplők:

| Domain | Megjegyzés |
|---|---|
| soderexpress.hu | Mindkét mintakeresésben megjelent; külön ellenőrizve (lásd 1.3) |
| soderguru.hu | Mindkét mintakeresésben megjelent |
| soderkiszallitas.hu | — |
| soderbirodalom.hu | — |
| kavicsszallitas.hu | — |
| soderhaz.hu | — |
| homokszallitas.hu | — |
| goltsepker.hu | Kerület-specifikus aloldal (`/soder-rendeles-11kerulet`) jelent meg |
| soder-futar.hu | — |
| kovicsfuvar.hu | — |
| soderszallitas.hupont.hu | Ingyenes (hupont.hu) oldal — gyanúsan alacsony árakkal (lásd korlát lent), **adatminősége kérdéses** |

**Bizonyosság: F** (keresési találati megfigyelés, nem Google-helyezés —
a brief 8.3 szerint ez NEM nevezhető pontos helyezésnek). Ez a lista a piac
**szélességét** mutatja (legalább 10 aktív, SEO-tartalmat építő szereplő
ugyanabban a szegmensben), nem rangsort.

A `soderarak.hu` **nem jelent meg** semelyik mintakeresésben — ez **nem új
hiba**, hanem a dokumentált, szándékos `noindex, follow` állapot közvetlen,
most elsőként ténylegesen megfigyelt következménye (korábban ez csak
Lighthouse `is-crawlable` bukásként volt dokumentálva, SERP-szintű hatása
most van először rögzítve).

### 1.3 Mélyebben ellenőrzött organikus versenytárs

**Sóder Express** (`soderexpress.hu`) — mindkét mintakeresésben megjelent,
külön lekérve (`/soder-szallitas/`, `WebFetch`, 2026-11-09). Fő üzenete
**"árgarancia"** + aznapi szállítás ígérete mind a 23 kerületre + néhány
agglomerációs településre. **Bizonyosság: A** (közvetlen lekérés) a tartalom
meglétére; **E** (következtetés) a WebFetch-összefoglalás pontosságára.

### 1.4 Információs / gyűjtőoldalak

A mintakeresésekben nem jelent meg önálló piactér vagy gyűjtőoldal (pl.
árösszehasonlító portál) — ezért ilyet **nem jelölünk meg** szereplőként
(a brief szerint kategóriát nem szabad összemosni, és kitalált szereplőt
nem szabad felvenni).

---

## 2. Kereslet és keresési szándék (8.2)

Adatforrás: a projekt saját, kódban élő tartalma (`src/content/site.ts`
útmutató-címei, `src/app/utmutatok`), a két mintakeresés "People also ask"-
szerű visszajelzése a `WebSearch`-ből, és a versenytárs-oldalak tartalmi
hangsúlyai. **Keresési volument, trendet nem állítunk** — hozzáférés
hiányában.

| Témacsoport | Megfigyelt szándék | soderarak.hu jelenlegi lefedettség | Megjegyzés |
|---|---|---|---|
| Ár és költség | "sóder ár Budapest", bruttó/nettó elkülönítés kérdése | `/arak`, `/utmutatok/mennyibe-kerul-a-soder-...` (bruttó anyagár / nettó fuvar útmutató) | Erős lefedettség — a bruttó/nettó szétválasztás **ritkaság** a versenytársaknál (ld. 4. mátrix) |
| Rendelés és kiszállítás | "mennyi idő alatt szállítanak", folyamat | `/utmutatok/mennyi-ido-a-soder-szallitas-...`, `/arkalkulator` (5 lépés) | Lefedett |
| Anyag/frakció | "sóder vagy murva", "milyen sóder kell betonhoz/térkő alá" | 5 külön útmutató anyagválasztásra | Erős, frakció-szintű lefedettség |
| Mennyiségszámítás | "mennyi sóder kell m³-ben" | `/utmutatok/mennyi-soder-kell-...` + kalkulátor | Lefedett |
| Helyi elérhetőség | "szállítanak-e X kerületbe/településre" | `/teruletek` kereső + 23 kerületi oldal + településrész-oldalak | Erős — ld. 4. mátrix, ez a legtisztább különbség az Ambrus kerületi oldalaihoz képest |
| Rendelés előtti bizonytalanság | "mi van ha nincs otthon senki", "hogyan mérjem ki az adatot", Vár (I. kerület) egyedi eset | Kalkulátor Vár-GYIK, `/teruletek/budapest-1-kerulet` | Lefedett a kódban ellenőrzött korábbi audit szerint |
| **Hiányzó/gyengén lefedett** | Árgarancia-jellegű bizalmi üzenet (a Sóder Express ezt hangsúlyozza) | Nincs ilyen állítás a `MIERT_HIVJON` szövegben | **Nem javasolt másolni** kiderítetlen alapon — csak ha az ügyfél valóban vállal ármegtartást, az adatbekérő listára kerülhet eldöntendő kérdésként |

---

## 3. SERP-mintavétel (8.3)

| # | Lekérdezés | Dátum | Nyelv/régió | Eszköz | Megfigyelt találattípus | Releváns szereplők | Tanulság |
|---|---|---|---|---|---|---|---|
| S-1 | `sóder ár Budapest szállítással` | 2026-11-09 | hu / nem rögzíthető | `WebSearch` | Organikus listázás, egyik oldal sem a soderarak.hu | 9 szereplő (1.2) | Kereskedelmi fejkulcsszóra zsúfolt a mező; `soderarak.hu` a noindex miatt nincs jelen |
| S-2 | `sóder szállítás XI. kerület ár` | 2026-11-09 | hu / nem rögzíthető | `WebSearch` | Organikus + 1 kerület-specifikus versenytárs-aloldal (Golts Épker) | 9 szereplő | Kerület-szintű fejkulcsszóra is van dedikált versenytárs-tartalom — megerősíti, hogy a soderarak.hu 23 kerületi oldala releváns stratégiai irány, nem felesleges |
| S-3 | `Ambrus Fuvar sóder szállítás Budapest` | 2026-11-09 | hu / nem rögzíthető | `WebSearch` | Csak `ambrusfuvar.hu` aloldalak (10/10) | Ambrus Fuvar | A domain/márka egyértelműen azonosítva, nincs névazonosság-kockázat |

**Korlát (kiemelve a brief 8.3 kérése szerint):** ez **nem helyhez kötött,
valódi Google-helyezés** — böngészős, bejelentkezés nélküli, nem
geolokalizált lekérdezés. Piaci részesedésre, "ki nyer melyik kulcsszóra"
típusú állításra ez a 3 lekérdezés **nem elég és nem alkalmas**; a listák
kizárólag a szereplők *létét* és *tartalmi hangsúlyát* igazolják.

---

## 4. Versenytársi mátrix (8.4)

| Szereplő | Releváns URL | Kínálat | Terület | Ártranszparencia | Rendelési folyamat | Tartalom | Bizonyítékok | Mobilos élmény | Hiányosság | soderarak.hu lehetőség | Forrás | Bizonyosság |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Ambrus Fuvar** | ambrusfuvar.hu, `/info/arlista` | Termőföld, sóder, murva, homok, kavics, homokos kavics, bazalt/andezit — nagyon széles választék (≈80+ tételsor) | "Budapest és környéke" + nevesített agglomerációs települések (Biatorbágy, Budaörs, Érd, Diósd, Tököl stb.) | **Csak nettó anyagár**, explicit felirattal: "nem tartalmazza a szállítás árát"; fuvardíj-sávok NEM nyilvánosak az árlista-oldalon | Telefonos (2 szám); nincs online űrlap/kalkulátor az árlistán | Sok, de sekély — termékfelsorolás, érdemi magyarázat/útmutató-tartalom nélkül ezen az oldalon | Nincs értékelés/tanúsítvány megjelenítve | **Nem ellenőrzött** | Nettó-only árazás elrejti a tényleges fizetendő összeget vásárlás előtt; nincs írott útmutató-tartalom | A bruttó/nettó szétválasztás + irányítószám-alapú fuvarkalkulátor **valódi, bizonyított különbség** — ezt lehet (már meglévő, jóváhagyott) üzenetként hangsúlyozni, versenytárs rosszhírezése nélkül | `WebFetch` 2026-11-09 (főoldal + árlista) | A (létezés, kínálat, árazási modell) / E (WebFetch-összefoglalás pontossága) |
| **Ambrus Fuvar — kerületi aloldal** | `/soder/soder-szallitas-21` | ua. | 21. kerület néven, de a díjsávok és területlista azonos minden kerületi aloldalon | Kalkulátor **van**: anyag + mennyiség (1–10 m³) + zóna → nettó/áfa/bruttó bontás | Kalkulátor + telefon | **Egy másik AI-eszköz (WebFetch) értékelése szerint** sablonos, kerületre nem specifikus tartalom ("doorway jellegű") | — | Nem ellenőrzött | Ha a WebFetch-megfigyelés pontos: a kerületnév csere érdemi helyi tartalom nélkül — ezt a brief (9. szakasz) kifejezetten tiltja másolásra | A soderarak.hu 23 kerületi oldala (korábbi audit, `tests/area-pages`, kódban ellenőrzött) **valódi, kerületenkénti** díjsávot, irányítószámot, mennyiségi korlátot és városrész-listát ad — ezt a különbséget NEM kell módosítani, csak tudatosan megtartani | `WebFetch` 2026-11-09, **egyszeri, nem kereszt-ellenőrzött megfigyelés** | **F** (egyetlen forrás, AI-összefoglaló — nem publikálható kemény állításként az ügyfélnek kereszt-ellenőrzés nélkül) |
| **Sóder Express** | soderexpress.hu, `/soder-szallitas/` | Hasonló alapanyag-kínálat | Mind a 23 kerület + nevesített agglomerációs települések | Nettó ár + sávos, nevesített nettó fuvardíj (15 000–30 000 Ft) **területenként közzétve** | Kalkulátor + telefon (munkaidőben) + e-mail | Közepes, kissé sablonos, de érdemi | Nincs értékelés megjelenítve | Nem ellenőrzött | Nincs bruttó/ÁFA-bontás az árazásban kiemelve úgy, mint a soderarak.hu-nál | Explicit "árgarancia" + aznapi szállítás ígéret — **erős bizalmi üzenet, amit a soderarak.hu NEM állíthat jóváhagyás/valós alap nélkül** (csak ha az ügyfél tényleg vállalja) | `WebFetch` 2026-11-09 | A / E |
| **Golts Épker Kft.** | goltsepker.hu, `/soder-rendeles-11kerulet` | Sóder (építőipari cég, nem csak anyagkereskedő) | XI. kerület fókusz (SERP-ben jelent meg) | Nem ellenőrzött részletesen | Nem ellenőrzött részletesen | Nem ellenőrzött részletesen | — | Nem ellenőrzött | — | Megerősíti: a XI. kerület (ahol a soderarak.hu-nak már van kódban ellenőrzött, kerület-specifikus kivétel-logikája, 1112/1118) kereskedelmileg versenyzett terület | `WebSearch` találat, nem lekérve | **F** |
| Egyéb (soderguru.hu, soderkiszallitas.hu, soderbirodalom.hu, kavicsszallitas.hu, soderhaz.hu, homokszallitas.hu, soder-futar.hu, kovicsfuvar.hu) | — | Feltehetően hasonló szegmens (a SERP-megjelenés alapján) | Nem ellenőrzött | Nem ellenőrzött | Nem ellenőrzött | Nem ellenőrzött | — | Nem ellenőrzött | Nem ellenőrzött | Mélyebb elemzés külön körben, ha a tulajdonos ezt priorizálja | `WebSearch` találati lista csak | **F** — csak létezés igazolt, semmi más |

**Fontos korlát, szó szerint betartva a brief 8.4 kéréséből:** a mátrix
**nem következtet** semelyik versenytárs konverziójára, bevételére vagy
tényleges forgalmára — csak a nyilvános felületen megfigyelhető tartalomra
és árazási modellre.

---

## 5. Kutatási eredmény — döntési anyag (8.5)

**Nem csak kulcsszólista — ami tényleg eldönthető ebből a körből:**

1. **Melyik szándékot érdemes először kiszolgálni:** a kerület-szintű
   "szállítanak-e hozzám, mennyibe kerül" szándék **igazoltan versenyzett**
   (S-2, Golts Épker + Ambrus kerületi aloldalai) — a soderarak.hu ezt már
   kódban kiszolgálja (23 kerületi oldal), ez **nem új teendő**, csak
   megerősítés, hogy a korábbi audit-döntés (S-1 a `v3-audit-and-fixes.md`-
   ben) helyes irány volt.
2. **Mely oldalak erősítendők:** nincs ilyen igény ebből a körből — a
   meglévő `/arak`, `/arkalkulator`, `/teruletek` szerkezet a versenytársak
   mintájához (kalkulátor + kerület/zóna-bontás) illeszkedik vagy
   részletesebb (bruttó/nettó explicit szétválasztás).
3. **Mihez kell új oldal:** **nincs bizonyított igény** erre ebből a
   kutatási körből. Nem javaslunk új oldaltípust kitalált kulcsszóvolumen
   alapján (a brief ezt kifejezetten tiltja).
4. **Mit kell összevonni:** nem releváns — nincs duplikáció-jelzés a
   versenytárskutatásból.
5. **Mihez hiányzik üzleti adat (az adatbekérő listára, 10. szakasz):**
   - Vállal-e a cég bármilyen **árgarancia** vagy **aznapi szállítás**
     ígéretet (mint a Sóder Express)? — **csak ha igen**, és csak jóváhagyott
     szöveggel kerülhet fel, jelenleg **NEM** állítható.
   - Van-e a cégnek bármilyen **ügyfél-visszajelzés/értékelés**, amit
     valódi forrásból (Google Cégprofil, számlázott referencia) fel lehetne
     tüntetni — jelenleg egyetlen versenytársnál sem látunk ilyet, de ha a
     soderarak.hu-nak valóban van, ez **valós differenciáló elem** lenne.
6. **Miben lehetünk valóban hasznosabbak a versenytársaknál (bizonyítható,
   nem feltételezett alapon):**
   - **Bruttó/nettó ár explicit szétválasztása** minden árlistasoron,
     amíg az Ambrus Fuvar csak a "nem tartalmazza a szállítást" figyelmeztetést
     adja, fuvardíj nélkül. Ez **már megvan** a soderarak.hu-n — tudatosítani
     kell, hogy ezt **meg kell tartani**, nem elmosni egy jövőbeli
     átalakításnál.
   - **Irányítószám-pontos, publikus fuvardíj-kalkulátor** — az Ambrus
     Fuvarnál is van kalkulátor (ne állítsuk egyedinek), de a soderarak.hu-é
     kódban ellenőrzötten explicit bruttó/nettó bontást **és** a 10 m³/fuvar
     korlát + többfuvaros ajánlat-logikát is kezeli — ezt a különbséget csak
     akkor szabad kommunikálni, ha a versenytárs oldalán tényleg nincs ilyen
     (ami ebben a körben **nem lett külön, kereszt-ellenőrzött módon
     bizonyítva** az Ambrus kalkulátorára — F-szint, nem publikálható kemény
     állításként).

**Mit NEM teszünk (a brief 8.5 végi tiltása szerint):** nem másoljuk az
Ambrus kerületi aloldalainak feltételezett "doorway" mintáját, és nem
publikálunk ellenőrizetlen negatív állítást róla sem a kódba, sem ügyfélnek
szánt szövegbe — a fenti megfigyelés (4. mátrix, F-szint) csak **belső,
stratégiai** döntési bemenet.

---

## 6. Nyitott / további kör esetén folytatható

- Mélyebb, kereszt-ellenőrzött vizsgálat a maradék 8 organikus
  versenytársról (1.2 táblázat "egyéb" sora), ha a tulajdonos priorizálja.
- Google Cégprofil / térkép-alapú helyi verseny (nincs hozzáférés
  Search Console-hoz vagy Cégprofilhoz ebben a körben).
- Valódi, geolokalizált SERP-mintavétel (ehhez fizetős eszköz vagy
  bejelentkezett, budapesti IP-ről futó keresés kellene — nem elérhető).
- Az Ambrus Fuvar kerületi aloldalainak második módszerrel (pl. két
  különböző kerületi URL közvetlen, szó szerinti HTML-összevetése)
  történő megerősítése, mielőtt a "doorway"-megfigyelés bármilyen külső
  dokumentumba kerülne.
