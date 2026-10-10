/**
 * SÓDERÁRAK — egyetlen üzleti adatforrás.
 *
 * SZABÁLYOK:
 *  - Ár, zóna, anyag CSAK itt módosítható. A felület mindig ebből renderel.
 *  - Az árak a meglévő (legacy) Sóderárak tartalomból származnak, nettó Ft/m³.
 *  - Amihez nincs forrás-adat (pl. bazalt ár), ott nincs ár: `needsQuote: true`.
 *  - Ne vegyen fel ide kitalált üzleti adatot.
 */

export const DISCLOSURE_PRICE =
  "Tájékoztató ár. A végleges ajánlatot egyeztetés után adjuk.";

export const DISCLOSURE_NET =
  "Az anyagárak nettó árak, ÁFA nélkül. A fuvar díja külön, a szállítási zóna szerint.";

/**
 * V2 preview: a kanonikus/OG/sitemap URL-ek a V2 publikálási célhoz igazodnak.
 * A workflow NEXT_PUBLIC_SITE_URL-lel állítja; lokálisan is a V2 cél az alapérték.
 * (Az üzleti domain — soderarak.hu — változatlanul a `domain` mezőben marad.)
 */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chefke1337.github.io/soderarakv2"
).replace(/\/+$/, "");

export const company = {
  name: "Bau-Kont Logisztik Kft.",
  businessUnit: "Sóderárak — ömlesztett anyag üzletág",
  site: {
    name: "Sóderárak",
    domain: "soderarak.hu",
    url: SITE_URL,
  },
  phone: {
    raw: "+36309546156",
    display: "+36 30 954 6156",
  },
  email: "info@soderarak.hu",
  address: {
    street: "Arany János út 152.",
    postalCode: "1221",
    city: "Budapest",
    district: "Budafok, Budapest XXII. kerület",
    full: "1221 Budapest, Arany János út 152.",
  },
  hours: {
    days: "Hétfő – péntek",
    time: "07:00 – 17:00",
    short: "H–P 07:00–17:00",
    schema: {
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "07:00",
      closes: "17:00",
    },
  },
  /** Testvéroldal — szigorúan szétválasztva a sóder üzletágtól. */
  waste: {
    name: "Buda Konténer",
    domain: "budakontener.hu",
    url: "https://budakontener.hu",
    pitch:
      "Építési törmelék, sitt, vegyes és zöldhulladék konténer — 4, 5, 7 és 10 m³-es méretekben, gyakran órákon belüli kiszállással.",
  },
  capabilities: [
    "Saját flotta: platós, billencs és konténeres teherautók",
    "Minimum rendelés 4 m³, egy fuvarban akár 23 m³",
    "Budafok környékén a kiszállás gyakran aznap történik",
    "Telephelyi átvétel: a depó személyes kiszolgálása",
    "Több mint 15 év tapasztalat az ömlesztett szállításban",
    "Gyors és egyszerű rendelés",
    "Rugalmas időpont-egyeztetés",
    "Megbízható kiszállítás",
    "Pontos, előre egyeztetett feltételek",
    "Segítség az anyag és a szükséges mennyiség kiválasztásában",
    "Lakossági és építőipari megrendelések",
  ],
} as const;

/** Anyagcsoport és árlistasor — a legacy ártabla + felhasználási leírások alapján. */
export type MaterialGroup = {
  slug: string;
  name: string;
  short: string;
  description: string;
  /** Vizuális azonosító a kártyákhoz. */
  tone: "soder" | "homok" | "kavics" | "murva" | "bazalt" | "fold";
  /** Anyag-textúra (dekoratív illusztráció, nem fotó). */
  texture: string;
  /** Rövid kép-aláírás a textúrákhoz. */
  textureAlt: string;
  items: MaterialItem[];
};

export type MaterialItem = {
  slug: string;
  name: string;
  /** Nettó Ft/m³ — csak forrásolt ár. Null = egyeztetés után. */
  priceNet: number | null;
  fraction?: string;
  use: string;
  note?: string;
  needsQuote?: boolean;
};

export const materialGroups: MaterialGroup[] = [
  {
    slug: "soder",
    name: "Sóder",
    short: "Homok–kavics keverék, minden alapozáshoz",
    description:
      "A sóder — kavicsos homoknak is hívják — alap építőanyag, homok és kavics keveréke. Alapozáshoz, betonozáshoz és feltöltéshez használatos; nálunk csak rostált, tiszta sóder kapható.",
    tone: "soder",
    texture: "/anyagok/soder.svg",
    textureAlt: "Sóder textúra — kavicsos homok szemcsék (stilizált illusztráció)",
    items: [
      {
        slug: "tolto-soder",
        name: "Töltősóder",
        priceNet: 13000,
        use: "Utak, parkok feltöltésére és beton alatti alapozáshoz. Jól összetömörödik, stabil alapot ad nagy terhelésnél.",
      },
      {
        slug: "soder-0-4",
        name: "Sóder 0/4",
        priceNet: 16800,
        fraction: "0–4 mm",
        note: "Kétszer rostált",
        use: "Finom betonokhoz és falazáshoz. Sima felületet ad, precíz betonozáshoz ajánlott.",
      },
      {
        slug: "soder-0-8",
        name: "Sóder 0/8",
        priceNet: 17000,
        fraction: "0–8 mm",
        use: "Vékony betonfelületekhez: lépcsők, aljzatok. Könnyen keveredik cementtel, jól folyik.",
      },
      {
        slug: "soder-0-16",
        name: "Sóder 0/16",
        priceNet: 17000,
        fraction: "0–16 mm",
        use: "3 cm-nél vastagabb betonokhoz. Kiegyensúlyozott keverék, gyakori garázsoknál, házalapoknál.",
      },
      {
        slug: "soder-0-24",
        name: "Sóder 0/24",
        priceNet: 16500,
        fraction: "0–24 mm",
        use: "4 cm-nél vastagabb betonokhoz: födémek, alapok, járdák. A leggyakrabban alkalmazott sóderfajta.",
      },
    ],
  },
  {
    slug: "homok",
    name: "Homok",
    short: "Natúr és frakcionált homok építéshez, homokozóhoz",
    description:
      "Natúr és osztályozott homok falazáshoz, vakoláshoz, betonkeveréshez és kerti felhasználásra.",
    tone: "homok",
    texture: "/anyagok/homok.svg",
    textureAlt: "Homok textúra — finom szemcsés dűnék (stilizált illusztráció)",
    items: [
      {
        slug: "homok-natur",
        name: "Homok (natúr)",
        priceNet: 13300,
        use: "Általános építőipari és kerti felhasználás: alaposításhoz, keveréshez, feltöltéshez.",
      },
      {
        slug: "homok-0-1",
        name: "0–1 Homok",
        priceNet: 16200,
        fraction: "0–1 mm",
        use: "Finom szemcséjű osztályozott homok vakoláshoz, fugázáshoz és homokozóhoz.",
      },
    ],
  },
  {
    slug: "kavics",
    name: "Kavics",
    short: "Kerti és kulékavics burkoláshoz, vízelvezetéshez",
    description:
      "Természetes és zúzott kőzet kavicsok díszítéshez, burkoláshoz és vízelvezetéshez — méret szerinti frakciókban.",
    tone: "kavics",
    texture: "/anyagok/kavics.svg",
    textureAlt: "Kavics textúra — kerek folyami kövek (stilizált illusztráció)",
    items: [
      {
        slug: "kavics-4-8",
        name: "Kavics 4/8",
        priceNet: 17500,
        fraction: "4–8 mm",
        use: "Kertekbe, dísznövények, bokrok, fák alá; segít a nedvesség megtartásában.",
      },
      {
        slug: "kavics-8-16",
        name: "Kavics 8/16",
        priceNet: 17500,
        fraction: "8–16 mm",
        use: "Kertekbe, dísznövények alá; jobb vízelvezetést biztosít, esztétikus fedés.",
      },
      {
        slug: "kulekavics-16-32",
        name: "Kulékavics 16–32",
        priceNet: 17000,
        fraction: "16–32 mm",
        use: "Utak, kocsibeállók, kertek burkolásához; jól bírja a járműforgalmat.",
      },
      {
        slug: "kulekavics-24-40",
        name: "Kulékavics 24–40",
        priceNet: 17700,
        fraction: "24–40 mm",
        use: "Utak, kocsibeállók burkolásához és vízelvezetéshez; hatékonyan vezeti el a vizet.",
      },
      {
        slug: "kulekavics-30-65",
        name: "Kulékavics 30–65",
        priceNet: 15000,
        fraction: "30–65 mm",
        use: "Kocsibeállók, parkolók burkolásához és vízelvezetéshez; a legnagyobb szemcséjű frakció.",
      },
    ],
  },
  {
    slug: "murva",
    name: "Murva",
    short: "Tömörödő feltöltő és fehér díszmurva",
    description:
      "Zúzott kő murva alaprétegekhez, kocsibeállókhoz és fehér változatban kertek, temetők díszítéséhez.",
    tone: "murva",
    texture: "/anyagok/murva.svg",
    textureAlt: "Murva textúra — szögletes zúzottkő szemek (stilizált illusztráció)",
    items: [
      {
        slug: "murva-2-5",
        name: "Murva 2–5",
        priceNet: 21000,
        fraction: "2–5 mm",
        use: "Kis szemcseméretű, fehér színű murva kertek, temetők díszítéséhez. Könnyen elteríthető.",
      },
      {
        slug: "kerti-murva-5-12",
        name: "Kerti murva 5–12",
        priceNet: 19500,
        fraction: "5–12 mm",
        use: "Fehér színű murva kertek, temetők díszítéséhez; stabil fedést ad, időjárásálló.",
      },
      {
        slug: "kerti-murva-12-20",
        name: "Kerti murva 12–20",
        priceNet: 19500,
        fraction: "12–20 mm",
        use: "Nagyobb szemcsés fehér murva sétányokhoz, virágágyások szegélyezéséhez; visszafogja a gyomot.",
      },
      {
        slug: "murva-0-20",
        name: "Murva 0–20",
        priceNet: 17000,
        fraction: "0–20 mm",
        use: "Enyhén sárgás színű, jól tömörödő murva feltöltésekhez, kocsibeállókhoz, utakhoz.",
      },
      {
        slug: "murva-20-55",
        name: "Murva 20–55",
        priceNet: 18000,
        fraction: "20–55 mm",
        use: "Kocsibeállók, parkolók burkolásához és díszítéshez; vízelvezető, megakadályozza a tócsákat.",
      },
    ],
  },
  {
    slug: "bazalt",
    name: "Bazalt",
    short: "Zúzottkő frakciók nagy terheléshez",
    description:
      "Kemény zúzottkő anyag nagy terhelésű felületekhez. Frakciók és aktuális ár a rendelkezésre álló árlistában nem szerepel — kérjen ajánlatot.",
    tone: "bazalt",
    texture: "/anyagok/bazalt.svg",
    textureAlt: "Bazalt textúra — sötét zúzottkő élek (stilizált illusztráció)",
    items: [
      {
        slug: "bazalt",
        name: "Bazalt (zúzottkő frakciók)",
        priceNet: null,
        needsQuote: true,
        use: "Nagy terhelésű felületek, útalapok. Elérhető frakciókról és aktuális árról telefonon vagy ajánlatkérés útján adunk tájékoztatást.",
      },
    ],
  },
  {
    slug: "fold",
    name: "Föld",
    short: "Natúr és darált termőföld kertbe, feltöltésre",
    description:
      "Termőföld feltöltésekhez, kertrendezéshez, pázsitlefektetéshez — natúr és darált változatban.",
    tone: "fold",
    texture: "/anyagok/fold.svg",
    textureAlt: "Föld textúra — termőföld rétegek (stilizált illusztráció)",
    items: [
      {
        slug: "naturfold",
        name: "Natúrföld",
        priceNet: 14000,
        use: "Kerti feltöltésekhez, tereprendezéshez. Natúr, rostálatlan föld.",
      },
      {
        slug: "daraltfold",
        name: "Daráltföld",
        priceNet: 15000,
        use: "Pázsitlefektetéshez, ágyásokhoz. Darált, egyenletes szerkezetű föld.",
      },
    ],
  },
];

export const allMaterials: MaterialItem[] = materialGroups.flatMap((g) =>
  g.items.map((i) => ({ ...i, groupName: g.name, groupSlug: g.slug })),
) as MaterialItem[];

/** Abszolút URL a site-gyökérhez képest — megőrzi a /soderarakv2 útvonal-előtagot. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function findMaterialGroup(slug: string): MaterialGroup | undefined {
  return materialGroups.find((g) => g.slug === slug);
}

export function findMaterial(slug: string): MaterialItem | undefined {
  return allMaterials.find((m) => m.slug === slug);
}

/** Szállítási zónák — fuvarárak egyeztetéstől függő sávban, nettó. */
export type Zone = {
  id: "mag" | "kozel" | "tavolabbi";
  name: string;
  area: string;
  /** Nettó fuvarár-sáv Ft, egy fuvarra. */
  fuelMin: number;
  fuelMax: number;
  leadTime: string;
  /** Tájékoztató zónakörvonalak a térképhez (nem jogi határ!) — egy zóna több összefüggő részből állhat. */
  polygon: [number, number][][];
  /** Térképinfó középpont. */
  center: [number, number];
};

/**
 * Zónakörvonalak: ÖSSZEFÜGGŐ, egymáshoz simuló sávok a telephely körül
 * (mag → közeli → távolabbi), tájékoztató jelleggel, nem jogi határ.
 */
export const zones: Zone[] = [
  {
    id: "mag",
    name: "Budafok és környéke",
    area: "Budapest XXII. és XI. kerület vonala",
    fuelMin: 12000,
    fuelMax: 22000,
    leadTime: "gyakran aznap",
    polygon: [
      [
        [47.455, 18.995], [47.452, 19.018], [47.44, 19.03], [47.425, 19.026],
        [47.408, 19.012], [47.402, 18.99], [47.406, 18.97], [47.42, 18.962],
        [47.44, 18.968], [47.452, 18.98],
      ],
    ],
    center: [47.428, 18.995],
  },
  {
    id: "kozel",
    name: "Közeli települések",
    area: "Érd, Diósd, Törökbálint, Csepel, Szigetszentmiklós",
    fuelMin: 18000,
    fuelMax: 32000,
    leadTime: "egyeztetett időpontban",
    polygon: [
      [
        [47.462, 18.955], [47.465, 18.985], [47.462, 19.02], [47.45, 19.04],
        [47.44, 19.06], [47.42, 19.065], [47.4, 19.05], [47.385, 19.06],
        [47.365, 19.09], [47.345, 19.08], [47.325, 19.05], [47.335, 19.02],
        [47.35, 18.99], [47.345, 18.955], [47.355, 18.92], [47.345, 18.895],
        [47.36, 18.875], [47.39, 18.87], [47.415, 18.875], [47.435, 18.89], [47.452, 18.92],
      ],
    ],
    center: [47.402, 18.975],
  },
  {
    id: "tavolabbi",
    name: "Távolabbi települések",
    area: "Tárnok, Sóskút, Pusztazámor, Halásztelek",
    fuelMin: 25000,
    fuelMax: 45000,
    leadTime: "egyeztetett időpontban",
    polygon: [
      [
        [47.43, 18.8], [47.435, 18.84], [47.42, 18.875], [47.4, 18.88],
        [47.375, 18.875], [47.35, 18.875], [47.335, 18.86], [47.34, 18.82],
        [47.36, 18.78], [47.39, 18.755], [47.415, 18.76],
      ],
    ],
    center: [47.383, 18.88],
  },
];

export function findZone(id: Zone["id"]): Zone {
  return zones.find((z) => z.id === id)!;
}

export type Settlement = {
  slug: string;
  name: string;
  zone: Zone["id"];
  priority: 1 | 2 | 3;
  /** Hozzávetőges településközpont a térkép-markerhez. */
  latlng: [number, number];
};

/** Szolgáltatási terület — csak a megadott települések. NE találjon ki újat. */
export const settlements: Settlement[] = [
  { slug: "budafok", name: "Budafok", zone: "mag", priority: 1, latlng: [47.433, 18.993] },
  { slug: "budateteny", name: "Budatétény", zone: "mag", priority: 1, latlng: [47.4095, 18.9905] },
  { slug: "nagyteteny", name: "Nagytétény", zone: "mag", priority: 1, latlng: [47.3975, 18.9925] },
  { slug: "budapest-22-kerulet", name: "Budapest XXII. kerület", zone: "mag", priority: 1, latlng: [47.428, 18.995] },
  { slug: "albertfalva", name: "Albertfalva", zone: "mag", priority: 1, latlng: [47.4435, 18.995] },
  { slug: "ujbuda-budapest-11-kerulet", name: "Újbuda (Budapest XI. kerület)", zone: "mag", priority: 1, latlng: [47.47, 19.048] },
  { slug: "erd", name: "Érd", zone: "kozel", priority: 1, latlng: [47.3833, 18.9167] },
  { slug: "diosd", name: "Diósd", zone: "kozel", priority: 1, latlng: [47.4042, 18.9458] },
  { slug: "torokbalint", name: "Törökbálint", zone: "kozel", priority: 1, latlng: [47.4356, 18.9156] },
  { slug: "csepel", name: "Csepel (Budapest XXI. kerület)", zone: "kozel", priority: 2, latlng: [47.428, 19.045] },
  { slug: "tarnok", name: "Tárnok", zone: "tavolabbi", priority: 2, latlng: [47.3597, 18.8586] },
  { slug: "szigetszentmiklos", name: "Szigetszentmiklós", zone: "kozel", priority: 2, latlng: [47.3453, 19.0483] },
  { slug: "soskut", name: "Sóskút", zone: "tavolabbi", priority: 3, latlng: [47.4063, 18.8285] },
  { slug: "pusztazamor", name: "Pusztazámor", zone: "tavolabbi", priority: 3, latlng: [47.4, 18.7833] },
  { slug: "halasztelek", name: "Halásztelek", zone: "tavolabbi", priority: 3, latlng: [47.3608, 18.9878] },
];

export function findSettlement(slug: string): Settlement | undefined {
  return settlements.find((s) => s.slug === slug);
}

/** Telephely koordinátája a térképhez. */
export const depot: { latlng: [number, number]; label: string } = {
  latlng: [47.4294, 18.9937],
  label: "Telephely — 1221 Budapest, Arany János út 152.",
};

export const RENDELES_LEPESEK = [
  {
    title: "Hívás vagy ajánlatkérés",
    text: "Hívja a +36 30 954 6156-os számot, vagy küldje el, mire van szüksége: anyag, mennyiség, helyszín.",
  },
  {
    title: "Egyeztetés",
    text: "Visszaigazoljuk az anyagot és a mennyiséget, a fuvar árát a szállítási zóna szerint, valamint az időpontot.",
  },
  {
    title: "Szállítás",
    text: "Platós, billencs vagy konténeres autónk a megbeszélt időpontban kiszállít. Budafok környékén a kiszállás gyakran aznap történik.",
  },
  {
    title: "Átvétel vagy lerakás",
    text: "Személyesen is átveheti a telephelyen (depó), vagy lerakjuk a helyszínen a megbeszéltek szerint.",
  },
];

export const FAQ = [
  {
    q: "Mekkora mennyiséget rendelhetek?",
    a: "Minimum rendelés 4 m³, egy fuvarban legfeljebb 23 m³ anyagot tudunk kiszállítani. Kisebb mennyiséghez érdemes telefonon egyeztetni.",
  },
  {
    q: "Mennyi a fuvar ára?",
    a: "A fuvar a szállítási zónától függ: Budafok környékén (Budapest XXII. és XI. kerület vonala) 12–22 ezer forint, a közeli településeken (Érd, Diósd, Törökbálint, Csepel, Szigetszentmiklós) 18–32 ezer forint, a távolabbi településeken (Tárnok, Sóskút, Pusztazámor, Halásztelek) 25–45 ezer forint. A végleges fuvardíjat egyeztetés után adjuk.",
  },
  {
    q: "Mennyire gyors a kiszállítás?",
    a: "Budafok környékén — Budapest XXII. és XI. kerület, valamint vonzáskörzetük — a kiszállás gyakran aznap megtörténik. A távolabbi településeken egyeztetett időpontban szállítunk.",
  },
  {
    q: "Az árak tartalmazzák az áfát és a fuvart?",
    a: "Nem. Az árlistában szereplő árak nettó árak, ÁFA nélkül, és a fuvar díja külön számolandó a szállítási zóna szerint. Minden ár tájékoztató jellegű: a végleges ajánlatot egyeztetés után adjuk.",
  },
  {
    q: "Melyik anyagot válasszam?",
    a: "Alapozáshoz és betonhoz sódert (0/8, 0/16, 0/24), falazáshoz finomabb 0/4-et vagy homokot, kocsibeállóhoz murvát vagy kulékavicsot, kertdekorációhoz kavicsot és kerti murvát, feltöltéshez natúr- vagy daráltföldet szoktunk ajánlani. Ha bizonytalan, hívjon minket — segítünk kiválasztani.",
  },
  {
    q: "Átvehetem személyesen az anyagot?",
    a: "Igen. Telephelyünk Budafokon (1221 Budapest, Arany János út 152.) depóként is működik: saját autóval vagy utánfutóval is átvehető az anyag hétköznap 07:00–17:00 között.",
  },
  {
    q: "Hol kérhetek hulladékkonténert?",
    a: "A hulladék és konténer szállítás önálló üzletág: a Buda Konténer (budakontener.hu) oldalon rendelhető sitt, vegyes és zöldhulladék konténer. A sóder és az építőanyag-szállítás itt, a Sóderárak oldalon külön történik.",
  },
  {
    q: "Mennyibe kerül 8 m³ sóder kiszállítással?",
    a: "Például 8 m³ Sóder 0/24 Budafokra: az anyag nettó 8 × 16 500 = 132 000 forint, a budafoki fuvarsáv 12–22 ezer forint — tehát 144–154 ezer forint nettó összkép, a végleges fuvardíjtól függően. Minden ár tájékoztató jellegű, ÁFA nélkül; a pontos összeg az egyeztetésnél véglegesedik.",
  },
  {
    q: "Milyen sóder kell térkő alá?",
    a: "Térkő alá ágyazati rétegnek a 0/4–0/8-as sóder való; alatta tömörített alaprétegnek a 0/24-es sóder vagy a 0–20-as murva ad stabilitást. A rétegek felépítését lépésről lépésre a térkő alatti sóderről szóló útmutatónkban írjuk le.",
  },
];

export const nav = [
  { href: "/anyagok", label: "Anyagok" },
  { href: "/arak", label: "Árak" },
  { href: "/arkalkulator", label: "Árkalkulátor" },
  { href: "/szallitas", label: "Szállítás" },
  { href: "/teruletek", label: "Területek" },
  { href: "/utmutatok", label: "Útmutatók" },
  { href: "/rolunk", label: "Rólunk" },
  { href: "/kapcsolat", label: "Kapcsolat" },
] as const;

/** Az oldal utolsó tartalmi frissítése — a sitemap lastmod mezője etetője. */
export const updated = "2026-10-02";

/** SEO útmutatók — a sorrend a hub és a lábléc listáját is vezérli. */
export const guides = [
  {
    slug: "mennyi-soder-kell",
    title: "Mennyi sóder kell? Így számolj köbméterben",
    excerpt:
      "Négyzetméter és rétegvastagság alapján: így jön ki, hány köbméter anyagra van szüksége — példákkal, ráhagyással.",
  },
  {
    slug: "mennyibe-kerul-a-soder",
    title: "Mennyibe kerül a sóder? Ár anyagra és fuvarra",
    excerpt:
      "Anyagár köbméterenként, fuvar zónánként, példaszámítással — így jön ki a sóder végára.",
  },
  {
    slug: "soder-vagy-murva",
    title: "Sóder vagy murva? Melyiket válasszam?",
    excerpt:
      "A két anyag hasonló, de másra való: alap, feltöltés vagy díszfedés — itt döntsd el pár percben.",
  },
  {
    slug: "milyen-soder-kell-a-betonhoz",
    title: "Milyen sóder kell a betonhoz?",
    excerpt:
      "Frakciók és szemcseösszetétel a különböző betonfajtákhoz: 0/4 a falazáshoz, 0/8 és 0/16 a lapos felületekhez, 0/24 a födémekhez és alapokhoz.",
  },
  {
    slug: "milyen-soder-kell-a-terko-ala",
    title: "Milyen sóder kell a térkő alá?",
    excerpt:
      "Ágyazati és alapréteg kialakítása térkövezéshez, murvával vagy sóderrel — rétegrend felülről lefelé, vastagságokkal és anyagválasztással.",
  },
  {
    slug: "kocsibeallo-alapja",
    title: "Kocsibeálló alapja: rétegek és anyagok",
    excerpt:
      "Milyen anyag, mekkora vastagságban: murva, kulékavics és sóder kocsibeállóhoz vagy parkolóhoz.",
  },
  {
    slug: "toltosoder-es-rostalt-soder",
    title: "Töltősóder vagy rostált sóder? A különbség",
    excerpt:
      "Miért olcsóbb a töltősóder, és mikor elég az? Anyagminőség, felhasználás és ár egy helyen.",
  },
  {
    slug: "soder-cement-aranys",
    title: "Sóder–cement arány",
    excerpt:
      "Mennyi cement kell egy köbméter sóderhez? Alaparányok és gyakorlati tanácsok falazáshoz, aljzathoz és szerkezeti betonhoz — a felhasználás szerint.",
  },
  {
    slug: "aljzatbetonhoz-milyen-soder-kell",
    title: "Aljzatbetonhoz milyen sóder kell?",
    excerpt:
      "0/8 vagy 0/16? A megfelelő frakció kiválasztása aljzatbetonhoz: vékony rétegekhez, vastag aljzathoz és a feltöltési ráhagyáshoz a bevált anyagválasztás.",
  },
  {
    slug: "arkalkulator-hasznalata",
    title: "Árkalkulátor használata lépésről lépésre",
    excerpt:
      "Anyag + mennyiség + település: mit számol ki a kalkulátor, és hogyan kérhet ajánlatot az eredmény mellől.",
  },
  {
    slug: "mennyi-ido-a-soder-szallitas",
    title: "Mennyi idő a sóder szállítás? Kiszállási idők",
    excerpt:
      "Mikor érkezik a sóder? Aznapos kiszállás Budafok környékén, egyeztetett időpont a távolabbi településeken, depó átvétel.",
  },
] as const;

export function findGuide(slug: string) {
  return guides.find((g) => g.slug === slug);
}
