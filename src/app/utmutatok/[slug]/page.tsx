import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findGuide, guides } from "@/content/site";
import { PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) return {};
  return {
    ...pageMeta({
      title: guide.title,
      description: guide.excerpt,
      path: `/utmutatok/${guide.slug}`,
    }),
    // V2 preview: noindex, mint a teljes oldalon (lásd layout.tsx)
    robots: { index: false, follow: true },
  };
}

/** Az útmutatók tartalma — SEO szövegek, üzleti adat nélkül. */
type GuideSection = {
  h: string;
  p: string[];
  /** Opcionális belső linkek a szekció végén. */
  links?: { href: string; label: string }[];
};

const BODY: Record<string, GuideSection[]> = {
  "soder-cement-aranys": [
    {
      h: "Miért számít az arány?",
      p: [
        "A sóder–cement arány határozza meg a beton szilárdságát. Minél több a cement az adott mennyiségű sóderhez képest, annál teherbíróbb a kész beton — de annál drágább is. Ezért nem érdemes vaktában Cementet adagolni: érdemes a felhasználás szerint dönteni.",
      ],
    },
    {
      h: "Gyakorlati tájékozódópontok",
      p: [
        "Falazáshoz, aljzathoz általában soványabb keverék is elegendő; szerkezeti betonhoz (sávapl, födém, oszlop) erősebb, cementdúsabb keverék kell. A pontos arány mindig a tervezői előírástól függ — az itt olvashatók tájékoztató jellegűek.",
      ],
    },
    {
      h: "Milyen sódert válasszon?",
      p: [
        "Finom munkákhoz (falazóhabarcs, simítás) a 0/4-es, kétszer rostált sóder való; általános betonhoz a 0/16 vagy 0/24 a bevált. A töltősóder nem betonkészítésre való, hanem feltöltésre, alaposításhoz.",
      ],
    },
  ],
  "aljzatbetonhoz-milyen-soder-kell": [
    {
      h: "Aljzatbeton röviden",
      p: [
        "Az aljzatbeton a végső burkolat (padlóburkolat, térkő, aszfalt) alatt dolgozó, síkra húzott réteg. Nem kell bele nagy szilárdság, de legyen jól tömöríthető és egyenletes szemcséjű.",
      ],
    },
    {
      h: "Megfelelő frakciók",
      p: [
        "Vékonyabb aljzatokhoz a 0/8-as sóder jó: jól elteríthető és simítható. Vastagabb aljzatbetonhoz a 0/16-os a szokásos választás. A feltöltést, a ráhagyást töltősóderral vagy murvával (0–20) olcsóbb megoldani, és csak a felső, síkra húzott réteget készítsék sóderből.",
      ],
      links: [{ href: "/utmutatok/soder-vagy-murva", label: "Sóder vagy murva — melyiket?" }],
    },
  ],
  "milyen-soder-kell-a-betonhoz": [
    {
      h: "A sóder szerepe a betonban",
      p: [
        "A beton cementből, vízből és adalékanyagból áll — ez utóbbi a sóder vagy kavics. A szemcseméret-eloszlás (frakció) határozza meg, milyen sűrűn tömörödik a keverék és mekkora terhelést bír.",
      ],
    },
    {
      h: "Frakció szerinti választás",
      p: [
        "0/4: finom, kétszer rostált — szerkezeti betonhoz, falazáshoz. 0/8: vékony betonfelületekhez, lépcsőkhöz. 0/16: 3 cm-nél vastagabb betonokhoz. 0/24: a leggyakoribb, 4 cm-nél vastagabb szerkezetekhez (födém, alap, járda).",
      ],
      links: [{ href: "/utmutatok/toltosoder-es-rostalt-soder", label: "Töltősóder vagy rostált sóder?" }],
    },
  ],
  "milyen-soder-kell-a-terko-ala": [
    {
      h: "Régek felülről lefelé",
      p: [
        "Térkő alatt jellemzően három réteg dolgozik: a fedő burkolat, felette agyagágyazati réteg (homok vagy finom murva), és alatta tömörített alapréteg. Mindegyiknek más a feladata, és más anyag való rá.",
      ],
    },
    {
      h: "Milyen anyagot hová?",
      p: [
        "Ágyazati rétegnek a 0–4 vagy 0–8 frakció való. Alaprétegnek murva (0–20) vagy a 0/24-es sóder — jól tömörödik, stabilit ad. Kocsibeállóhoz, parkolóhoz a nagyobb terhelés miatt kulékavicsos vagy murvás alapréteg a bevált.",
      ],
      links: [{ href: "/utmutatok/mennyi-soder-kell", label: "Mennyi anyag kell? Így számolj köbméterben" }],
    },
  ],
  "mennyibe-kerul-a-soder": [
    {
      h: "Mitől függ az ár?",
      p: [
        "Két tételből áll a végösszeg: az anyag ára köbméterenként, és a fuvar díja, amely a szállítási zónától függ. Az anyagár a fajtától és a frakciótól változik — a jelen árlistánkban a töltősóder a legkedvezőbb, nettó 13 000 Ft/m³, míg a rostált sóderok (0/4, 0/8, 0/16, 0/24) 16 500 és 17 000 forint között mozognak köbméterenként.",
        "Minden ár tájékoztató jellegű, nettó, ÁFA nélkül — a végleges ajánlatot egyeztetés után adjuk.",
      ],
      links: [
        { href: "/arak", label: "Teljes árlista" },
        { href: "/anyagok/soder", label: "Sóder anyagoldal" },
        { href: "/utmutatok/toltosoder-es-rostalt-soder", label: "Töltősóder vagy rostált sóder?" },
      ],
    },
    {
      h: "A fuvar díja külön számolandó",
      p: [
        "Az anyagár mellé a fuvar külön elem. Budafok környékén — Budapest XXII. és XI. kerület vonala — egy fuvar nettó 12–22 ezer forint, a közeli településeken (Érd, Diósd, Törökbálint, Csepel, Szigetszentmiklós) 18–32 ezer forint, a távolabbi településeken (Tárnok, Sóskút, Pusztazámor, Halásztelek) 25–45 ezer forint.",
        "A fuvar egy fuvarra vonatkozik: ha több mint 23 köbméter kell, több autót állítunk be, és ennek megfelelően több fuvart számolunk fel.",
      ],
      links: [
        { href: "/szallitas", label: "Szállítás és fuvarárak" },
        { href: "/teruletek", label: "Kiszállítási területek" },
      ],
    },
    {
      h: "Példaszámítás: 8 m³ Sóder 0/24",
      p: [
        "Tegyük fel, hogy 8 köbméter 0/24-es sódert kér Budafokra. Az anyag nettó 16 500 Ft/m³, tehát 8 × 16 500 = 132 000 forint. Budafok környéki fuvarral ez 144 000–154 000 forint nettó összképet ad, a végleges fuvar árától függően.",
        "Hasonló számítást bármelyik anyagra és településre elvégezhet az árkalkulátorunkkal — tíz másodpercnél nem tart tovább.",
      ],
      links: [{ href: "/arkalkulator", label: "Próbálja ki a kalkulátort" }],
    },
    {
      h: "Így kaphat pontos árat",
      p: [
        "A leggyorsabb út: futtassa a kalkulátort az anyaggal, mennyiséggel és településsel, majd kérjen ajánlatot az eredmény mellől — névvel és telefonszámmal. Ha bizonytalan az anyagban, telefonon segítünk kiválasztani, és rögtön meg is egyeztetjük a fuvar árát.",
      ],
      links: [{ href: "/kapcsolat", label: "Kapcsolat — hívjon minket" }],
    },
  ],
  "arkalkulator-hasznalata": [
    {
      h: "Három bemenet, két perc",
      p: [
        "A kalkulátor három dolgot kér: az anyagot, a mennyiséget és a helyszínt. Az anyaglistában anyagcsoport szerint válogathat — sódertől a földig —, és minden tétel mellett ott a nettó köbméterár. A mennyiség 4 és 23 köbméter között választható, hiszen a minimum rendelés 4 m³, egy fuvarban pedig legfeljebb 23 m³ fér.",
        "A településnél csoportosítva látja a zónákat: Budafok és környéke, közeli és távolabbi települések.",
      ],
      links: [
        { href: "/anyagok", label: "Nézze meg anyagainkat" },
        { href: "/arak", label: "Teljes árlista" },
        { href: "/utmutatok/mennyi-soder-kell", label: "Mennyi sóderre lesz szüksége?" },
      ],
    },
    {
      h: "Mit számol ki pontosan?",
      p: [
        "Az anyag nettó árát megszorozza a köbméterekkel, majd hozzáadja a szállítási zóna fuvarsávját. Az eredmény egy sáv: a legalacsonyabb és a legmagasabb tájékoztató összeg nettóban. 8 köbméter 0/24-es sóder Budafokra például 132 000 forint anyagot és 12–22 ezer forint fuvart ad — 144–154 ezer forintos nettó sávot.",
        "Bazalt esetében, amelynek ára egyeztetés után adható, a kalkulátor csak a fuvart mutatja, és az anyagár helyett erre figyelmeztet.",
      ],
      links: [{ href: "/arkalkulator", label: "Árkalkulátor indítása" }],
    },
    {
      h: "Tájékoztató ár — miért sávot lát?",
      p: [
        "Mert a végleges fuvardíj az egyeztetésnél pontosul: az útvonal, az időpont és az adott nap kapacitása is közrejátszik. Ezért minden kalkulált összeg tájékoztató, nettó, ÁFA nélkül — a kötelezettségmentes ajánlatot telefonon vagy e-mailben adjuk, konkrétan az Ön helyszínére.",
      ],
      links: [
        { href: "/szallitas", label: "Fuvarárak zónánként" },
        { href: "/teruletek", label: "Kiszállítási területek" },
      ],
    },
    {
      h: "Ajánlatkérés az eredmény mellől",
      p: [
        "Ha tetszik az összeg, adjon meg egy nevet és egy telefonszámot: a kalkulátor megnyitja az e-mail kliensét, és előre kitöltött ajánlatkérést küld az info@soderarak.hu címre — anyag, mennyiség, helyszín és a tájékoztató ár is benne van. A piszkozat csak az Ön eszközén marad, és bármikor hívhat is minket közvetlenül.",
        "Ha az e-mail kliens nem nyílik meg, az összegzés gombbal kimásolhatja az adatokat, és üzenetben elküldheti.",
      ],
      links: [{ href: "/kapcsolat", label: "Kapcsolat — telefon és e-mail" }],
    },
  ],
  "mennyi-soder-kell": [
    {
      h: "A számítás: négyzetméter szorozva vastagsággal",
      p: [
        "A köbméter egyszerűen számolható: a terület négyzetméterben szorozva a réteg vastagságával méterben. Egy 20 négyzetméteres kocsibeállóhoz 15 centiméteres rétegen például 20 × 0,15 = 3 köbméter anyag kell; egy 25 négyzetméteres kert 5 centiméteres díszfedése mindössze 1,25 köbméter.",
        "Ha a terület nem szabályos, bontsa kisebb téglalapokra, számolja ki őket külön, majd adja össze az eredményeket. A vastagságnál mindig a tömörített réteget vegye figyelembe.",
      ],
    },
    {
      h: "Milyen vastagsággal számoljon?",
      p: [
        "Díszkavicsos kertfedésnél jellemzően 5–8 centiméter, gyalogos kerti útnál 8–10 centiméter elég. Kocsival járt felületnél az alapréteg szokásos mérete 15–20 centiméter; térkő alatt pedig az ágyazat 3–5 centiméter, és alatta jön a vastagabb, tömörített alap.",
        "Ezek tájékoztató irányértékek: a végleges vastagságot a talaj és a terhelés dönti el. Bizonytalan esetben hívjon minket — segítünk megbecsülni a mennyiséget.",
      ],
    },
    {
      h: "Ráhagyás a tömörítésre",
      p: [
        "A feltöltő anyagok tömörítéskor összeülnek, ezért a kiszámolt mennyiségre érdemes kis ráhagyást szánni — főleg töltésnél és kocsibeálló alapjánál. Díszfedésnél, ahol nem tömörít, elég a puszta számítás.",
      ],
    },
    {
      h: "Minimum és maximum: mennyit rendelhet?",
      p: [
        "Minimum rendelés 4 köbméter, egy fuvarban legfeljebb 23 m³ fér egy autóra. Ha a számítás 4 köbméter alatt jön ki, érdemes mégis 4-re tervezni, vagy az anyagot a telephelyen átvenni. A nagyobb mennyiség több fuvarban érkezik — erről az egyeztetésnél állapodunk meg.",
      ],
      links: [
        { href: "/arkalkulator", label: "Számolja ki pontosan a kalkulátorral" },
        { href: "/utmutatok/mennyibe-kerul-a-soder", label: "Mennyibe kerül a sóder?" },
      ],
    },
  ],
  "soder-vagy-murva": [
    {
      h: "Két rokon anyag, más feladat",
      p: [
        "A sóder homok és kavics természetes keveréke, kerek szemcsékkel — ezért válik a beton alapanyagává. A murva zúzott kő: szögletes szemű, jól összetömörödik, és fehér változatban kertdekorációként is kapható. A külsejük hasonló, de másra valók.",
      ],
    },
    {
      h: "Betonhoz és falazáshoz: sóder",
      p: [
        "Ahol beton készül, ott sóder kell: a 0/8 a vékony felületekhez, a 0/16 és a 0/24 a vastagabb alapokhoz, födémekhez, járdákhoz. Falazáshoz és simításhoz a finom 0/4-es, kétszer rostált változat a bevált.",
      ],
      links: [{ href: "/anyagok/soder", label: "Sóder anyagoldal" }],
    },
    {
      h: "Feltöltéshez és kocsibeállóhoz: murva",
      p: [
        "A 0–20-as murva a szokásos választás feltöltéshez és kocsibeálló alapjához: tömörítve stabil, teherbíró réteget ad. A nagyobb szemű 20–55-ös murva vízelvezető fedésnek jó, ahol a víznek el kell folyjon.",
      ],
      links: [
        { href: "/anyagok/murva", label: "Murva anyagoldal" },
        { href: "/utmutatok/kocsibeallo-alapja", label: "Kocsibeálló alapja lépésről lépésre" },
      ],
    },
    {
      h: "Kertbe: kavics és kerti murva",
      p: [
        "Díszítésre a kerek folyami kavics (4/8, 8/16) ad természetes képet, a fehér kerti murva pedig sétányokhoz és ágyások szegélyezéséhez való, és visszafogja a gyomot. A nagyobb szemcsés fedés kevesebb pótlást igényel, a világos szín viszont gyakrabban piszkolódik.",
      ],
      links: [{ href: "/anyagok/kavics", label: "Kavics anyagoldal" }],
    },
    {
      h: "Ár szempontból",
      p: [
        "Az alapárak egymás mellett állnak: a töltősóder nettó 13 000 forint köbméterenként, a 0/24-es rostált sóder 16 500, a 0–20-as murva 17 000 forint. A döntés tehát inkább felhasználás, mint ár kérdése — a fuvar díja mindegyiknél ugyanúgy a szállítási zónától függ.",
      ],
      links: [{ href: "/arak", label: "Teljes árlista" }],
    },
  ],
  "kocsibeallo-alapja": [
    {
      h: "A rétegrend felülről lefelé",
      p: [
        "A jól felépített kocsibeálló három dolgot kap felülről lefelé: a jártas fedőréteget (térkő, kőzúzalékos vagy kavicsos fedés), alatta a síkra húzott ágyazatot, legalul pedig a teherbíró, tömörített alapréteget. Mindegyiknek más a feladata, és más anyag való rá.",
      ],
    },
    {
      h: "Alapréteg: murva vagy sóder",
      p: [
        "Alaprétegnek a 0–20-as murva vagy a 0/24-es sóder a bevált: mindkettő jól összetömörödik és stabil alapot ad. Nagyobb terhelésnél — lakókocsi, gyakori parkolás, kamionos behajtás — a zúzott kő frakciók közül a kulékavics 16–32 vagy 24–40 jön szóba az alsó rétegben.",
      ],
      links: [
        { href: "/anyagok/murva", label: "Murva anyagoldal" },
        { href: "/anyagok/soder", label: "Sóder anyagoldal" },
      ],
    },
    {
      h: "Vastagság és tömörítés",
      p: [
        "Személyautós terhelésnél az alapréteg szokásos mérete 15–20 centiméter, rétegenként tömörítve. A térkő vagy kőzúzalék alatti ágyazat ehhez jön rá 3–5 centiméterrel. A tömörítés nem hagyható ki: tömörítetlen alapon a felület az első időszakban megsüllyed, gödrök jelennek meg.",
        "Ezek tájékoztató irányértékek — a végleges rétegrendet a talaj teherbírása és a várható forgalom dönti el.",
      ],
    },
    {
      h: "Példa: 20 m²-es kocsibeálló",
      p: [
        "20 négyzetméteren 15 centiméteres alapréteggel 3 köbméter anyagot számolunk; tömörítési ráhagyással érdemes 4 köbméterre tervezni — a minimum rendelés is 4 m³. 0–20-as murvával az anyag nettó 4 × 17 000 = 68 000 forint, a budafoki fuvarsáv 12–22 ezer forinttal jön rá.",
        "A pontos összeget az árkalkulátor adja meg bármelyik településre — tíz másodpercnél nem tart tovább.",
      ],
      links: [
        { href: "/arkalkulator", label: "Árkalkulátor indítása" },
        { href: "/utmutatok/milyen-soder-kell-a-terko-ala", label: "Térkő alá milyen sóder kell?" },
      ],
    },
  ],
  "toltosoder-es-rostalt-soder": [
    {
      h: "Mi a különbség?",
      p: [
        "A töltősóder rostálatlan: benne van minden szemcseméret, a nagyobb kövektől a finom porosig. A rostált sóderok — a 0/4-től a 0/24-ig — szemcseösszetétel szerint osztályozottak: egységesek, tiszták, és betonhoz, falazáshoz már el is fogadják őket.",
      ],
    },
    {
      h: "Töltősóder: feltöltésre",
      p: [
        "A töltősóder erőssége a tömörség és az ár: nettó 13 000 forint köbméterenként, és a feltöltéseknél pont erre van szükség. Ahogy a neve is jelzi, töltésre való — utak, parkok feltöltésére és beton alatti alapozáshoz —, nem pedig beton készítésére.",
      ],
      links: [{ href: "/anyagok/soder", label: "Sóder anyagoldal" }],
    },
    {
      h: "Rostált frakciók: ahol beton is lesz",
      p: [
        "Falazáshoz, simításhoz a 0/4-es, kétszer rostált sóder (nettó 16 800 Ft/m³) a megfelelő. Vékony betonfelületekhez — lépcső, aljzat — a 0/8 (17 000), a 3 centiméternél vastagabb betonokhoz a 0/16 (17 000), a leggyakoribb munkákhoz — födém, alap, járda — pedig a 0/24 (nettó 16 500 Ft/m³) való.",
      ],
    },
    {
      h: "Így döntsön gyorsan",
      p: [
        "Ahol csak feltölti a terepet és tömörít, elég a töltősóder — jóval kevesbe kerül. Ahol a keverékből beton lesz, ott rostált frakció kell. Kocsibeállónál a két anyag váltja egymást: alul töltősóder vagy murva, a betonos munkáknál rostált.",
        "Bizonytalan esetben hívja a +36 30 954 6156-os számot: anyag szerint segítünk választani.",
      ],
      links: [
        { href: "/utmutatok/mennyibe-kerul-a-soder", label: "Mennyibe kerül a sóder?" },
        { href: "/arak", label: "Teljes árlista" },
      ],
    },
  ],
  "mennyi-ido-a-soder-szallitas": [
    {
      h: "Budafok környékén gyakran aznap",
      p: [
        "A telephelyünk Budafokon van, ezért Budafok környékén — Budapest XXII. és XI. kerület, valamint vonzáskörzetük vonala — a kiszállás gyakran még aznap megtörténik. Ez kapacitásfüggő: a végleges időpont mindig az egyeztetésnél pontosul.",
      ],
      links: [
        { href: "/teruletek", label: "Zónatérkép és települések" },
        { href: "/teruletek/budafok", label: "Kiszállítás Budafokra" },
      ],
    },
    {
      h: "A távolabbi településekre: egyeztetett időpontban",
      p: [
        "A közeli zónában (Érd, Diósd, Törökbálint, Csepel, Szigetszentmiklós) és a távolabbi településeken (Tárnok, Sóskút, Pusztazámor, Halásztelek) egyeztetett időpontban szállítunk. Sürgős kérés esetén hívjon telefonon: megnézzük, be tudjuk-e illeszteni a kérést a napi útvonalakba.",
      ],
      links: [
        { href: "/teruletek/erd", label: "Kiszállítás Érdre" },
        { href: "/szallitas", label: "Szállítási tudnivalók" },
      ],
    },
    {
      h: "Depó átvétel hétköznap 07:00-tól 17:00-ig",
      p: [
        "Ha nem vár a fuvar, anyagunkat személyesen is átveheti a budafoki telephelyen — saját autóval vagy utánfutóval, hétfőtől péntekig 07:00 és 17:00 között. Ilyenkor nincs fuvardíj, csak az anyag ára.",
      ],
      links: [{ href: "/kapcsolat", label: "Kapcsolat és nyitvatartás" }],
    },
    {
      h: "Mennyiség és gépválasztás",
      p: [
        "A minimum rendelés 4 m³, egy fuvarban legfeljebb 23 m³ anyagot szállítunk — platós, billencs vagy konténeres autóval, attól függően, mit kér és hol tudjuk lerakni. Nagyobb mennyiség több fuvarban megy, erről az egyeztetésnél állapodunk meg.",
      ],
      links: [
        { href: "/anyagok/soder", label: "Sóder anyagoldal" },
        { href: "/arkalkulator", label: "Számoljon a kalkulátorral" },
      ],
    },
    {
      h: "Így zajlik a rendelés",
      p: [
        "Először hívja a +36 30 954 6156-os számot, vagy küldje el, mire van szüksége: anyag, mennyiség, helyszín. Visszaigazoljuk az anyagot és a mennyiséget, a fuvar árát a zóna szerint, és rögzítjük az időpontot. Ezután kiszállítunk, majd az anyagot átvételre vagy lerakásra adjuk — ahogyan megbeszéltük.",
      ],
    },
  ],
};

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();
  const body = BODY[slug] ?? [];

  return (
    <Section kicker="Útmutató" title={guide.title} lead={guide.excerpt}>        <JsonLd
          data={breadcrumbJsonLd([
            { name: "Főoldal", path: "/" },
            { name: "Útmutatók", path: "/utmutatok" },
            { name: guide.title, path: `/utmutatok/${guide.slug}` },
          ])}
        />
      <div className="max-w-3xl space-y-6">
        {body.map((block) => (
          <section key={block.h}>
            <h2 className="font-display text-xl font-bold">{block.h}</h2>
            {block.p.map((para, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-ink-soft">
                {para}
              </p>
            ))}
            {block.links && block.links.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {block.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="font-semibold text-brand-deep underline underline-offset-2"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <p
          data-call-region="guide_body"
          className="rounded-md border border-line bg-sand p-4 text-sm"
        >
          Nem tudja, melyik anyag való a munkájához?{" "}
          <Link href="/anyagok" className="font-semibold text-brand-deep underline underline-offset-2">
            Nézze meg az anyagainkat
          </Link>
          , vagy hívjon: <PhoneLink className="font-semibold text-brand-deep underline underline-offset-2" /> —
          szívesen segítünk kiválasztani.
        </p>

        <nav aria-label="További útmutatók" className="rounded-md border border-line bg-paper p-5 shadow-card">
          <p className="text-sm font-medium text-ink-soft">További útmutatók</p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <Link
                href="/utmutatok"
                className="flex min-h-11 items-center px-2 font-semibold text-brand-deep hover:text-brand-dark"
              >
                Összes útmutató <span aria-hidden="true">→</span>
              </Link>
            </li>
            {guides
              .filter((g) => g.slug !== guide.slug)
              .map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/utmutatok/${g.slug}`}
                    className="flex min-h-11 items-center px-2 font-medium transition-colors hover:text-brand-dark"
                  >
                    {g.title} →
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </Section>
  );
}
