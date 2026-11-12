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

### 1.2a Domainklaszterek — a 10 "szereplő" valójában kevesebb üzemeltető (2. kör, 2026-11-09)

A maradék 8 domain egyenkénti `WebFetch`-lekérése (lásd 1.2 táblázat) után
**két független, kétjelzős egyezés** derült ki — nem feltételezés, mindkettő
pontosan egyező, a forrásoldalakról szó szerint kinyert adat:

**Klaszter A — Ambrus Fuvar / Sóder Guru / Homokszállítás.hu.**
Mindhárom domainen **ugyanaz a két telefonszám** szerepel (számjegyre
egyezően ellenőrizve: `06309902614` és `06309660192`), és mindhárom oldal
szó szerint azonos megfogalmazással sorolja fel a szolgáltatási területet
("II.; XI.; XII.; XXI.; XXII. kerület + 17 környező település"). Ez a
megbízásban névvel megjelölt **"Ambrus Fuvar" valójában egy legalább
3 domaines tartalom-/kulcsszóklaszter**, nem egyetlen önálló honlap.
**Bizonyosság:** A (a telefonszám- és szövegegyezés magából a lekért
tartalomból, nem következtetésből), de **cégnyilvántartási azonosítás
(kinek a nevén futnak a domainek) nem történt** — ezt a következő kör
végezhetné el (pl. `whois`, Opten/e-cégjegyzék), ha releváns.

**Klaszter B — Sóder Express / Sóder Futár / Kovics Fuvar.**
Mindhárom domainen **ugyanaz a telefonszám** (`+36 30 9775118` /
`06 30 9775118`, formázástól eltekintve számjegyre egyező), és a
`soder-futar.hu` valamint a `kovicsfuvar.hu` is **ugyanazt a nevet**
("Kovács Kálmán") nevezi meg üzemeltetőként. **Bizonyosság: A** (telefonszám-
és névegyezés a lekért tartalomból).

**Hatás a piacképre:** a 8.1/1.2-ben felsorolt "10 szereplő" valójában
**legfeljebb 7 önálló üzemeltető** (2 klaszter × 3 domain + 4 önálló
szereplő, lásd 1.2b), amiből **csak kettő (Sóder Birodalom, Sóderház) és a
két klaszter fő-domainje fut valódi, egyedi márkanév alatt** — a többi
domain nyilvánvalóan **kulcsszó-variánsra szabott, duplikált tartalmú
"doorway" domain**, ugyanazon telefonszámra/céghez. Ez **piaci gyakorlatként
megfigyelt tény**, nem a soderarak.hu-nak szóló javaslat — a brief 9.
szakasza kifejezetten tiltja a doorway-mintázat átvételét, és ennek a
klaszternek a létezése **inkább megerősíti, miért rossz ötlet** (Google
hosszú távon ezt a mintát leértékelheti; rövid távú organikus térnyerés
hosszú távú kockázattal jár).

### 1.2b Önálló (klaszterhez nem köthető) szereplők, a 2. kör alapján

| Domain | Üzemeltető | Megjegyzés |
|---|---|---|
| soderbirodalom.hu | "Sári Tamás" (e-mail: saritamas0430@gmail.com), tel.: 0670/1-5-1-5-1-5-1 | Egyedi márka ("A Birodalom visszavár"), nem egyezik a két klaszter telefonszámaival |
| soderhaz.hu | **Timb-Erd Kft.**, Érd | Egyetlen vizsgált szereplő valódi céges háttérrel, feltüntetett ügyfél-tesztimóniállal és konkrét statisztikai állítással (lásd 4. mátrix — **versenytárs saját állítása, nem igazolt**) |
| soderkiszallitas.hu | Pap Ádám E.V. | Egyéni vállalkozó, saját flotta-állítás (3,5–40 t), nincs klasztertelefonszám-egyezés |
| kavicsszallitas.hu | Nem azonosított | A lekért tartalom nem adott meg egyértelmű telefonszámot az összevetéshez — **klasztertagság nem zárható ki, de nem is igazolt (F)** |
| goltsepker.hu | Golts Épker Kft. | Építőipari cég (nem tisztán ömlesztettanyag-kereskedő) — profilja eltér a többi szereplőtől, csak a XI. kerületi SERP-megjelenés miatt releváns |

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
| **Sóder Guru / Homokszállítás.hu** (Klaszter A, Ambrus Fuvarral közös üzemeltető) | soderguru.hu, homokszallitas.hu | 13+ tételes sóder-választék, agyagtartalom szerinti árdifferenciálás | Azonos Ambrusszal: II./XI./XII./XXI./XXII. ker. + 17 környező település | **Nettó**, 7 500–13 500 Ft/m³; fuvardíj a kalkulátorban nettó/bruttó bontásban jelenik meg | Telefon (azonos Ambrus-számok) + online kalkulátor | Érdemi, oktató jellegű (agyagos sóder, cement-igény magyarázat) — versenytárs-figyelmeztetés is van benne ("mosatlan agyagos sódert... félrevezetik") | Nincs | Nem ellenőrzött | Ugyanaz, mint Ambrusnál: a fuvardíj nem egyértelműen elkülönített a bruttó végösszegtől minden lépésben | — (lásd Ambrus sor) | `WebFetch` 2026-11-09 | A (tartalom, telefonszám-egyezés) |
| **Sóder Express / Sóder Futár / Kovics Fuvar** (Klaszter B, azonos üzemeltető: "Kovács Kálmán") | soderexpress.hu, soder-futar.hu, kovicsfuvar.hu | Alapanyag-választék + sóder-futár márkanév alatt szűkebb (5 tétel) | Mind a 23 kerület + nevesített agglomerációs települések | **Nettó**; fuvardíj **kerületenként nevesített sávban közzétéve** (Pest 13–18e, Buda 22–27e, Csepel 22e Ft/forduló) — a legátláthatóbb fuvardíj-közzététel a vizsgált mezőben | Telefon (munkaidő: H–P 6–18) + kalkulátor + e-mail | Logisztikai magyarázat (szűk budapesti utcák, engedélyek) + explicit "tájékoztató jellegű, az ár eltérhet" felirat | Nincs értékelés; "árgarancia" csak a soderexpress.hu márkanéven jelenik meg, a másik kettőn nem | Nem ellenőrzött | Max. ~5 m³/forduló (mint a soderarak.hu 10 m³-es korlátja, de alacsonyabb) | A soderarak.hu fuvardíj-közzététele irányítószám-pontos, nem csak zóna-sávos — ez finomabb granularitás, tényleges, bizonyítható különbség | `WebFetch` 2026-11-09 | A (tartalom, telefonszám- és névegyezés) |
| **Sóder Birodalom** | soderbirodalom.hu | 6 sóderfajta + térkőalap | Budapest (Buda/Pest külön díjjal) + Pest megye | Explicit, kis mennyiségre is megadott ár (pl. ½ m³ töltősóder: 2 200 Ft) | Telefon, e-mail, kalkulátor | Közepes, kissé sablonos | Facebook-jelenlét; nincs értékelés/garancia | Nem ellenőrzött | Nincs bruttó/ÁFA-bontás kiemelve | Önálló, kis márka — nem fenyegetés-szintű, de a kis mennyiségre (½ m³) is megadott ár ötletes, a soderarak.hu minimális rendelési mennyisége nem ennyire granulált | `WebFetch` 2026-11-09 | A / E |
| **Sóderház (Timb-Erd Kft., Érd)** | soderhaz.hu | Legszélesebb választék (sóder, homok, murva, kavics, termőföld, zúzottkő, maró aszfalt, töltőanyag) | Budapest + Pest megye, 33+ település, **ingyenes házhozszállítás** állítása | **Bruttó** árak feltüntetve; akciós ár is jelölve | Online shop + telefon + e-mail; **24/7 elérhetőség és 24 órás válaszgarancia állítása** | Blog-jellegű tartalom (homokozó-telepítés, sóderválasztás), projektgaléria, cégtörténet | **Saját állítású**: 3 ügyféltesztimónium, "1037 elégedett ügyfél", "653 teljesített projekt", 20+ év tapasztalat — **versenytárs saját, nem igazolt állítása, nem vehető át tényként** | Nem ellenőrzött | Max. 5 m³/forduló; a "1037 elégedett ügyfél" jellegű számszerű bizalmi állítás a soderarak.hu-n jelenleg nincs (és csak valós adat alapján kerülhetne fel, lásd 8.5/5.) | A konkrét, számszerű bizalmi állítás (ha a soderarak.hu-nak van hasonló, valós alapja) bizonyítottan hatásos elem ebben a piacban — **adatbekérésre érdemes tétel**, nem azonnali másolásra | `WebFetch` 2026-11-09 | A (tartalom létezése) / **a bizalmi számok maguk F — versenytárs önállítása** |
| **Sóder Szállítás (Pap Ádám E.V.)** | soderkiszallitas.hu | 4 sóderfrakció + homok, zúzottkő, kavics, termőföld, andezit | Budapest + környék, X. kerületi bázis | **Bruttó**, konkrét Ft/m³ (pl. 0–24: 12 000 Ft/m³); fuvardíj explicit külön | Telefon + e-mail; **nincs online kalkulátor** | Mérsékelt — szolgáltatás-állítások, kevés részletezett zóna/sáv-adat | "30+ év tapasztalat", saját flotta (3,5–40 t) állítása — nem igazolt | Nem ellenőrzött | Nincs online kalkulátor — ebben a soderarak.hu (és a klaszterek) egyértelműen előnyben vannak | A kalkulátor-nélküliség megerősíti, hogy a soderarak.hu kalkulátora nem "alapvető", hanem valós megkülönböztető funkció egy részét a piacnak | `WebFetch` 2026-11-09 | A |
| **kavicsszallitas.hu** | kavicsszallitas.hu | 13 tételes választék + beton-árak is | Budapest + 22+ település | Nettó, 8 000–13 500 Ft/m³ (+ ÁFA, nem explicit %) | Telefon + kalkulátor | Oktató jellegű, de **feltűnő versenytárs-támadás a saját szövegében** ("tartalomtolvaj" — más oldalt plagizálónak nevez) | Nincs | Nem ellenőrzött | A versenytárs-támadó hangnem hitelességromboló — **ezt a mintát a soderarak.hu-n sem szabad átvenni** (a brief 8. szakasza is tiltja az ellenőrizetlen negatív állítást versenytársról) | Negatív tanulság: a higgadt, tényalapú hangnem (amit a soderarak.hu jelenleg követ) hitelesebb, mint a nyílt versenytárs-támadás | `WebFetch` 2026-11-09 | A (tartalom) / klasztertagság nem igazolt (F) |
| **Golts Épker Kft.** | goltsepker.hu | Építőipari fővállalkozás, sóder csak kiegészítő szolgáltatás | XI. kerület fókusz (SERP-ben jelent meg) | Nem ellenőrzött részletesen (2. körben sem lekérve — eltérő üzleti profil, alacsonyabb prioritás) | Nem ellenőrzött | Nem ellenőrzött | — | Nem ellenőrzött | — | Megerősíti: a XI. kerület kereskedelmileg versenyzett (a soderarak.hu-nak már van kódban ellenőrzött 1112/1118 kivétel-logikája ide) | `WebSearch` találat, nem lekérve | **F** |

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
   - Van-e a cégnek bármilyen **ügyfél-visszajelzés/értékelés vagy
     számszerű (projekt-/ügyfélszám) állítása**, amit valódi forrásból
     (Google Cégprofil, számlázott referencia) fel lehetne tüntetni? A
     2. kör megerősítette, hogy ez ritka, de hatásos elem a piacon
     (Sóderház: "1037 elégedett ügyfél", 3 tesztimónium) — jelenleg
     egyetlen klaszter-domainnél sincs ilyen, a soderarak.hu-n sincs; ha
     valóban van valós alap, **ez a legkonkrétabb, egyedileg azonosított
     hiányzó üzleti adat** ebből a kutatási körből.
6. **Miben lehetünk valóban hasznosabbak a versenytársaknál (bizonyítható,
   nem feltételezett alapon):**
   - **Bruttó/nettó ár explicit szétválasztása** minden árlistasoron,
     amíg az Ambrus-klaszter (Ambrus Fuvar / Sóder Guru / Homokszállítás.hu)
     és a kavicsszallitas.hu is csak nettó árat ad, fuvardíj nélkül. Ez
     **már megvan** a soderarak.hu-n — tudatosítani kell, hogy ezt **meg
     kell tartani**, nem elmosni egy jövőbeli átalakításnál.
   - **Irányítószám-pontos, publikus fuvardíj-kalkulátor.** A piacon
     **több szereplőnek is van** kalkulátora (mindkét klaszter, Sóder
     Birodalom) — ez **nem egyedi**, ne állítsuk annak. A valódi,
     bizonyított különbség a **granularitás**: a Kovács Kálmán-klaszter
     (Sóder Express/Futár/Kovics Fuvar) kerület-*sávokban* ad fuvardíjat
     (pl. "Pest: 13–18e Ft"), a soderarak.hu **irányítószám-pontosan**
     (kódban ellenőrzött, 25 díjprofil) — ez tényleg finomabb, publikálható
     állítás.
   - **Nyugodt, tényalapú hangnem.** A kavicsszallitas.hu saját szövegében
     nyíltan versenytársat támad ("tartalomtolvaj"), ami hitelességet ront.
     A soderarak.hu jelenlegi, versenytársat nem említő, tényalapú hangneme
     **ebből a kutatásból bizonyítottan jobb gyakorlat** — ezt a stílust
     **meg kell tartani**, nem pedig versenytárs-kritikával bővíteni.
   - **A kalkulátor funkció megléte maga is számít.** A Pap Ádám E.V.
     (soderkiszallitas.hu) üzemeltette oldalon **nincs** online kalkulátor,
     csak telefon/e-mail — ez megerősíti, hogy a soderarak.hu kalkulátora
     nem "piaci alapkövetelmény mindenkinél", hanem tényleges, a piac egy
     részénél hiányzó funkció.
7. **Piacszerkezeti megfigyelés, ami befolyásolja a stratégiát:** a 10
   "versenytárs" valójában **legfeljebb 7 önálló üzemeltető**, ebből 2
   tudatosan tart fenn 3+ domaines kulcsszó-klasztert (lásd 1.2a). Ez azt
   jelenti, hogy a valódi, egyedi márkanév alatt futó, önálló verseny
   **szűkebb**, mint a nyers domain-szám sugallja — ami **enyhíti**, nem
   növeli a versenyzettség látszatát, ugyanakkor a klaszter-szereplők
   nyers organikus jelenléte (3 domain × kulcsszóvariáns) tartósan
   elfoglalja a SERP-helyeket, amíg a soderarak.hu `noindex` marad.

**Mit NEM teszünk (a brief 8.5 végi tiltása szerint):** nem másoljuk sem a
kerületi aloldalak feltételezett "doorway" mintáját, sem a többdomaines
kulcsszó-klaszterezést, sem a versenytárs-támadó hangnemet, és nem
publikálunk ellenőrizetlen negatív állítást semelyik versenytársról sem a
kódba, sem ügyfélnek szánt szövegbe — a fenti megfigyelések (4. mátrix,
jelölt F-szintek) csak **belső, stratégiai** döntési bemenetek. A Sóderház
"1037 elégedett ügyfél" és "653 teljesített projekt" állítása **versenytárs
saját, ellenőrizetlen állítása** — ez a dokumentum ezt tényként idézi a
versenytársról (mert az ő oldalán ez áll), de **nem venné át** a
soderarak.hu-ra semmilyen formában anélkül, hogy a megbízótól valós,
igazolható szám érkezne.

---

## 6. Nyitott / további kör esetén folytatható

- `kavicsszallitas.hu` klasztertagsága (A vagy B klaszter, vagy önálló) —
  a 2. körben nem derült ki egyértelmű telefonszám-egyezés; igazoláshoz
  további lekérés (pl. impresszum-oldal) kellene.
- A két azonosított domainklaszter (1.2a) üzemeltetőjének cégjogi
  azonosítása (whois/e-cégjegyzék) — ha ennek stratégiai jelentősége van
  a tulajdonos számára (pl. panasz/jogi lépés mérlegelése), de ez **ennek
  a kutatásnak NEM célja és NEM is javasolt lépés** magától.
- Google Cégprofil / térkép-alapú helyi verseny (nincs hozzáférés
  Search Console-hoz vagy Cégprofilhoz ebben a körben).
- Valódi, geolokalizált SERP-mintavétel (ehhez fizetős eszköz vagy
  bejelentkezett, budapesti IP-ről futó keresés kellene — nem elérhető).
- A kerületi aloldalak "doorway"-megfigyelésének második módszerrel
  (pl. két különböző kerületi URL közvetlen, szó szerinti HTML-
  összevetése) történő megerősítése, mielőtt bármilyen külső dokumentumba
  kerülne.
- Golts Épker Kft. (goltsepker.hu) mélyebb vizsgálata, ha az eltérő
  (fővállalkozói) üzleti profil ellenére is releváns marad.
