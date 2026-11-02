/**
 * SÓDERÁRAK V3 — egyetlen üzleti adatforrás.
 *
 * SZABÁLYOK:
 *  - Anyag és ár: `src/content/catalog.ts` (BRUTTÓ Ft/m³).
 *  - Fuvardíj és lefedettség: `src/content/freight.ts` (NETTÓ Ft, irányítószám szerint).
 *  - Ez a modul a cég-, navigációs, tartalmi és GYIK-adatokat tartja, és
 *    továbbexportálja a fenti kettőt, hogy a felület mindig EGY forrásból
 *    rendereljen (`@/content/site`).
 *  - Ne vegyen fel ide kitalált üzleti adatot.
 */

import { findMaterial } from "./catalog.ts";
import {
  FREIGHT_VAT_RATE,
  findProfileByPostalCode,
  findBand,
  bandLabel,
  MIN_ORDER_M3,
  SINGLE_TRIP_MAX_M3,
  budapestDistricts,
  romanDistrict,
  type MunicipalityId,
} from "./freight.ts";
import { districtAreas } from "./districts.ts";

export * from "./catalog.ts";
export * from "./freight.ts";

/**
 * Rendelhető mennyiségtartomány — egyetlen forrás a kalkulátor és minden
 * megjelenített szöveg számára. V3: egy fuvarban legfeljebb 10 m³.
 */
export const MIN_ORDER_VOLUME = MIN_ORDER_M3;
export const MAX_ORDER_VOLUME = SINGLE_TRIP_MAX_M3;

/**
 * A kanonikus/OG/sitemap URL-ek a publikálási célhoz igazodnak.
 * A V3 fejlesztői előnézet nem publikus — a layout noindexet állít rá.
 * (Az üzleti domain — soderarak.hu — változatlanul a `domain` mezőben marad.)
 */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chefke1337.github.io/soderarakv2"
).replace(/\/+$/, "");

/** true: ez egy nem publikus V3 előnézeti build → noindex. */
export const IS_PREVIEW = process.env.NEXT_PUBLIC_PREVIEW !== "false";

export const company = {
  name: "Bau-Kont Logisztik Kft.",
  businessUnit: "Sóderárak — ömlesztett anyag üzletág",
  site: {
    name: "Sóderárak",
    domain: "soderarak.hu",
    url: SITE_URL,
  },
  phone: {
    raw: "+36308528909",
    display: "+36 30 852 8909",
  },
  email: "info@soderarak.hu",
  /** Céges cím (2026-10-11-i ügyféladat) — kizárólag cégadatként (pl. impresszum,
   * strukturált adat), nem telephelyként vagy depóként megjelenítve. */
  address: {
    street: "hrsz. 152/12.",
    postalCode: "2045",
    city: "Törökbálint",
    full: "2045 Törökbálint, hrsz. 152/12., Magyarország",
  },
  /** Cégjegyzék-adatok (2026-10-11-i ügyféladat) — csak impresszumhoz. */
  legal: {
    status: "Aktív",
    taxNumber: "27333138-2-13",
    registrationNumber: "13-09-239483",
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
    "Saját flotta: billencs és konténeres teherautók",
    `Minimum rendelés ${MIN_ORDER_M3} m³, egy fuvarban legfeljebb ${SINGLE_TRIP_MAX_M3} m³`,
    "Budafok környékén a kiszállás gyakran aznap történik",
    "Több mint 15 év tapasztalat az ömlesztett szállításban",
    "Gyors és egyszerű rendelés",
    "Rugalmas időpont-egyeztetés",
    "Megbízható kiszállítás",
    "Pontos, előre egyeztetett feltételek",
    "Segítség az anyag és a szükséges mennyiség kiválasztásában",
    "Lakossági és építőipari megrendelések",
  ],
} as const;

/* ─────────────────────────── Főoldali üzenet ─────────────────────────── */

/**
 * Jóváhagyott főoldali fő üzenet és leírás (2026-10-27).
 * A „gyakran” feltételes jellege szándékosan megmarad: nincs garantált
 * aznapi szállítás minden területre.
 */
export const HERO = {
  title: "Ömlesztett építőanyag Budapestre, Érdre és környékére.",
  lead:
    "Mondja el telefonon, mire van szüksége — Budafok környékén gyakran még aznap szállítunk.",
} as const;

/** Jóváhagyott Rólunk tartalom (2026-10-27). */
export const ROLUNK = {
  title: "Rólunk – Minőség minden szemcsében!",
  paragraphs: [
    "Számunkra a kiváló minőség és a megbízhatóság alapvető értékek. Éppen ezért kiemelt figyelmet fordítunk arra, hogy vásárlóink számára gondosan osztályozott, kiváló minőségű építőanyagokat kínáljunk.",
    // Ügyfélszöveg (2026-11-01), a 2026-11-02-i pontosítással: a töltősóder NEM
    // mosott, a kulé csak egyszer mosott — az általános „minden anyag" állítás
    // ezzel ellentmondott volna, ezért szűkítve.
    "Az általunk forgalmazott sóderfrakciók, kavicsok és homok vizes osztályozási eljáráson mennek keresztül. Ez az eljárás segít eltávolítani a nem kívánt szennyeződéseket, valamint biztosítja az egyenletesebb szemcseméretet és a megbízható minőséget. Kivétel a töltősóder, amely nem mosott anyag; a kulé egyszeri mosáson esik át.",
    "Célunk, hogy magánépítkezők, kivitelezők és építőipari vállalkozások egyaránt olyan alapanyagokhoz jussanak, amelyek megfelelnek a minőségi elvárásoknak, és amelyekre bátran építhetnek.",
    "Legyen szó betonozásról, alapozásról vagy más építőipari munkáról, nálunk a minőség az első.",
  ],
  pullQuote: "Kiváló alapanyagok, megbízható minőség, biztos alapok az építkezéshez!",
  closing: "Válasszon minket, és építsen minőségre!",
} as const;

/** Abszolút URL a site-gyökérhez képest — megőrzi az útvonal-előtagot. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/* ───────────────── Kiszolgált területek (lefedettség) ───────────────── */

export type ServiceArea = {
  slug: string;
  name: string;
  /** Rövid, listában megjelenő megnevezés. */
  shortName: string;
  /**
   * `profile`: van jóváhagyott, irányítószám-alapú tarifa.
   * `quote`: a területhez jelenleg NINCS új tarifa → egyedi egyeztetés.
   */
  freight:
    | { kind: "profile"; municipalityId: MunicipalityId; districtId?: number }
    | { kind: "quote" };
  /** Hozzávetőleges középpont a térkép-jelöléshez (V2-ből átvett projektadat). */
  latlng: [number, number];
  priority: 1 | 2 | 3;
};

/**
 * Szolgáltatási terület. A konkrét fuvardíjat MINDIG az irányítószám
 * határozza meg (`src/content/freight.ts`) — ez a lista a lefedettség
 * bemutatására és a belső linkekre szolgál, nem árazási alap.
 * NE találjon ki új területet.
 */
export const serviceAreas: ServiceArea[] = [
  { slug: "budafok", name: "Budafok", shortName: "Budafok", freight: { kind: "profile", municipalityId: "budapest", districtId: 22 }, priority: 1, latlng: [47.433, 18.993] },
  { slug: "budateteny", name: "Budatétény", shortName: "Budatétény", freight: { kind: "profile", municipalityId: "budapest", districtId: 22 }, priority: 1, latlng: [47.4095, 18.9905] },
  { slug: "nagyteteny", name: "Nagytétény", shortName: "Nagytétény", freight: { kind: "profile", municipalityId: "budapest", districtId: 22 }, priority: 1, latlng: [47.3975, 18.9925] },
  { slug: "budapest-22-kerulet", name: "Budapest XXII. kerület", shortName: "XXII. kerület", freight: { kind: "profile", municipalityId: "budapest", districtId: 22 }, priority: 1, latlng: [47.428, 18.995] },
  { slug: "albertfalva", name: "Albertfalva", shortName: "Albertfalva", freight: { kind: "profile", municipalityId: "budapest", districtId: 11 }, priority: 1, latlng: [47.4435, 18.995] },
  { slug: "ujbuda-budapest-11-kerulet", name: "Újbuda (Budapest XI. kerület)", shortName: "XI. kerület", freight: { kind: "profile", municipalityId: "budapest", districtId: 11 }, priority: 1, latlng: [47.47, 19.048] },
  // V3: a XXI. kerületi (Csepel) tarifa megadásával a terület ismét támogatott —
  // ez felülírja a V2-ben rögzített kizárást.
  { slug: "csepel", name: "Csepel (Budapest XXI. kerület)", shortName: "XXI. kerület", freight: { kind: "profile", municipalityId: "budapest", districtId: 21 }, priority: 1, latlng: [47.4256, 19.0719] },
  { slug: "erd", name: "Érd", shortName: "Érd", freight: { kind: "profile", municipalityId: "erd" }, priority: 1, latlng: [47.3833, 18.9167] },
  // A következő településekhez a V3 árlistában NINCS új tarifa → egyedi egyeztetés.
  { slug: "diosd", name: "Diósd", shortName: "Diósd", freight: { kind: "quote" }, priority: 2, latlng: [47.4042, 18.9458] },
  { slug: "torokbalint", name: "Törökbálint", shortName: "Törökbálint", freight: { kind: "quote" }, priority: 2, latlng: [47.4356, 18.9156] },
  { slug: "tarnok", name: "Tárnok", shortName: "Tárnok", freight: { kind: "quote" }, priority: 3, latlng: [47.3597, 18.8586] },
  { slug: "soskut", name: "Sóskút", shortName: "Sóskút", freight: { kind: "quote" }, priority: 3, latlng: [47.4063, 18.8285] },
  { slug: "pusztazamor", name: "Pusztazámor", shortName: "Pusztazámor", freight: { kind: "quote" }, priority: 3, latlng: [47.4, 18.7833] },
];

/**
 * Budapesti kerületek a lefedettségi térképen: minden kerület egy jelölést kap
 * a kerület HOZZÁVETŐLEGES középpontjában (áttekintő pont, nem határ, nem cím).
 * A XI., XXI. és XXII. kerületnek már van saját jelölése (`serviceAreas`), ezért
 * ott nem duplikálunk. A díj forrása itt is kizárólag az irányítószám.
 */
export const DISTRICT_MAP_CENTERS: Record<number, [number, number]> = {
  1: [47.4968, 19.036],
  2: [47.537, 18.985],
  3: [47.567, 19.035],
  4: [47.564, 19.09],
  5: [47.5005, 19.052],
  6: [47.507, 19.065],
  7: [47.5005, 19.073],
  8: [47.489, 19.085],
  9: [47.474, 19.085],
  10: [47.484, 19.153],
  12: [47.499, 18.99],
  13: [47.53, 19.07],
  14: [47.515, 19.11],
  15: [47.562, 19.135],
  16: [47.515, 19.2],
  17: [47.48, 19.26],
  18: [47.435, 19.2],
  19: [47.446, 19.145],
  20: [47.432, 19.112],
  23: [47.395, 19.117],
};

/**
 * Térkép: a XXII. kerületet a Budafok jelölés képviseli (ügyfélkérés,
 * 2026-11-01: „Budafokot egyszer jelöld, a XXII-t vedd le"). A XXII. kerületi
 * aloldal megmarad, csak külön térképjelölése nincs.
 */
export const MAP_HIDDEN_AREA_SLUGS = ["budapest-22-kerulet"];
export const MAP_DISTRICT_REPRESENTATIVE: Record<string, number> = { budafok: 22 };
export const mapServiceAreas = () => serviceAreas.filter((a) => !MAP_HIDDEN_AREA_SLUGS.includes(a.slug));

export type DistrictMapPoint = { districtId: number; slug: string; name: string; label: string; latlng: [number, number] };

export const districtMapPoints: DistrictMapPoint[] = budapestDistricts
  .filter((d) => DISTRICT_MAP_CENTERS[d.id])
  .map((d) => {
    const nick = districtAreas(d.id)?.name;
    return {
      districtId: d.id,
      slug: districtPageSlug(d.id),
      name: `Budapest ${romanDistrict(d.id)} kerület${nick ? ` (${nick})` : ""}`,
      label: romanDistrict(d.id),
      latlng: DISTRICT_MAP_CENTERS[d.id]!,
    };
  });

export function findServiceArea(slug: string): ServiceArea | undefined {
  return serviceAreas.find((s) => s.slug === slug);
}

export const tariffedAreas = serviceAreas.filter((s) => s.freight.kind === "profile");

/**
 * Területi aloldal (/teruletek/[slug]): a térképes `serviceAreas` + minden
 * olyan budapesti kerület saját oldala, amelyhez még nincs kerületi oldal.
 * A kerületi oldalak tartalma kerületenként valóban eltér (saját díjsávok,
 * irányítószámok, mennyiségi korlát, városrészek) — a központi adatból.
 * Ezek NEM kerülnek a térképre (nincs hiteles koordinátájuk).
 */
export type AreaPage = Pick<ServiceArea, "slug" | "name" | "shortName" | "freight">;

/** Kerületenként a „kanonikus" kerületi oldal (a meglévő 3 slugot megtartva). */
export function districtPageSlug(districtId: number): string {
  const existing = serviceAreas.find(
    (a) => a.freight.kind === "profile" && a.freight.districtId === districtId && /kerület/.test(a.name),
  );
  return existing ? existing.slug : `budapest-${districtId}-kerulet`;
}

export const districtAreaPages: AreaPage[] = budapestDistricts
  .filter((d) => !serviceAreas.some((a) => a.slug === districtPageSlug(d.id)))
  .map((d) => {
    const nick = districtAreas(d.id)?.name;
    return {
      slug: districtPageSlug(d.id),
      name: `Budapest ${romanDistrict(d.id)} kerület${nick ? ` (${nick})` : ""}`,
      shortName: `${romanDistrict(d.id)} kerület`,
      freight: { kind: "profile", municipalityId: "budapest", districtId: d.id },
    };
  });

export const areaPages: AreaPage[] = [...serviceAreas, ...districtAreaPages];

export function findAreaPage(slug: string): AreaPage | undefined {
  return areaPages.find((s) => s.slug === slug);
}
export const quoteOnlyAreas = serviceAreas.filter((s) => s.freight.kind === "quote");

/* ──────────────────────────── Rendelés menete ──────────────────────────── */

/** Rendelés menete — jóváhagyott ügyfélszöveg, öt lépés (V3: irányítószámmal). */
export const RENDELES_LEPESEK = [
  {
    title: "Válassza ki a szükséges anyagot és mennyiséget",
    text: "Első lépésként válassza ki, hogy milyen anyagra és mekkora mennyiségre van szüksége. A mennyiséget kérjük, m³-ben adja meg. Ha nem biztos benne, hogy pontosan mennyi anyagra van szüksége, kérje kollégáink segítségét!",
  },
  {
    title: "Adja meg a szállítási címet és az irányítószámot",
    text: "A pontos árajánlat elkészítéséhez kérjük, adja meg a szállítási címet és az irányítószámot, ahová az anyagot kéri. A szállítás díját az árkalkulátor a cím és a mennyiség alapján kiszámolja.",
  },
  {
    title: "Egyeztessük a szállítás időpontját",
    text: "A rendelés leadásakor kérjük, adja meg, mikor szeretné a kiszállítást. A kívánt időpontot egyeztetjük Önnel, és igyekszünk az Ön számára legmegfelelőbb időpontban teljesíteni a szállítást.",
  },
  {
    title: "Megrendelés véglegesítése",
    text: "Miután minden részletet egyeztettünk – a kiválasztott anyagot, a mennyiséget, a szállítási címet és az időpontot –, a megrendelést véglegesítjük. Ezzel a megrendelés rögzítésre kerül, és megkezdjük a kiszállítás előkészítését.",
  },
  {
    title: "Kiszállítás és lerakodás",
    text: "A megbeszélt időpontban a szállítójármű megérkezik a megadott címre, és a megrendelt anyagot a helyszínen, az előre egyeztetett helyre lerakodjuk.",
    note: "Kérjük, hogy a kiszállítás időpontjára a lerakodási terület legyen szabadon és biztonságosan megközelíthető.",
  },
] as { title: string; text: string; note?: string }[];

/** „Miért hívjon minket?" — jóváhagyott ügyfélszöveg. */
export const MIERT_HIVJON = {
  title: "Miért hívjon minket?",
  lead: "Mert számunkra fontos, hogy a rendelés egyszerűen, gyorsan és gördülékenyen menjen – a megrendeléstől egészen a kiszállításig.",
  body: "Legyen szó kisebb vagy nagyobb mennyiségről, igyekszünk minden esetben az Ön igényeihez igazodni. Segítünk a megfelelő anyag és mennyiség kiválasztásában, egyeztetjük a szállítás részleteit, majd a megbeszélt időpontban gondoskodunk a kiszállításról.",
  listTitle: "Amit Önnek nyújtunk:",
  list: [
    "Gyors és egyszerű rendelés",
    "Rugalmas időpont-egyeztetés",
    "Megbízható kiszállítás",
    "Pontos, előre egyeztetett feltételek",
    "Segítség az anyag és a szükséges mennyiség kiválasztásában",
    "Lakossági és építőipari megrendelések",
  ],
  closing: "Ön elmondja, mire van szüksége, mi pedig segítünk a megoldásban. Hívjon minket bizalommal, és egyeztessük a részleteket!",
} as const;

/** Szállítás oldal bevezetője — jóváhagyott ügyfélszöveg (2026-11-02), szó szerint. */
export const SZALLITAS_INTRO = {
  title: "Szállítás",
  paragraphs: [
    "Cégünk vállalja különböző ömlesztett építőanyagok, sóder, homok, kavics, murva, andezit és föld gyors és megbízható házhoz szállítását.",
    "Legyen szó kisebb lakossági megrendelésről vagy nagyobb építkezési projektről, igyekszünk minden esetben rugalmasan és a megbeszélt időpontban teljesíteni a kiszállítást.",
  ],
  listTitle: "Amit kínálunk:",
  list: [
    "Gyors és pontos kiszállítás.",
    "Megbízható, szervezett fuvarozás.",
    "Lakossági és vállalkozói megrendelések teljesítése.",
    "Rugalmas szállítási időpontok, akár aznap.",
    "Igény szerinti mennyiségű ömlesztett anyag kiszállítása.",
  ],
} as const;

/**
 * Nyilvános tarifaközlés helyett (ügyfél, 2026-11-02): a részletes
 * irányítószám × mennyiség díjtáblák nem jelennek meg; a díjat a kalkulátor
 * számolja ki az adott címre és mennyiségre.
 */
export const FREIGHT_PUBLIC_NOTICE =
  "A pontos szállítási díjért használja az árkalkulátort, vagy kérjen telefonos egyeztetést.";

/* ─────────────────────── Rendelési igény (e-mail) ─────────────────────── */

/** Jóváhagyott tájékoztatás a beküldés jogi természetéről. */
export const ORDER_INTENT_NOTICE =
  "A beküldés rendelési igénynek minősül. A megrendelés a részletek egyeztetése és visszaigazolásunk után válik véglegessé.";

export const ORDER_INTENT_CTA = "Rendelési igény elküldése";

/* ───────────────────────────── Példaszámítás ───────────────────────────── */

/**
 * Egyetlen közös példaszámítás — a GYIK, a kalkulátor-belépő panel és az
 * útmutatók ugyanebből dolgoznak, hogy a megjelenések sosem térhessenek el.
 * 8 m³ 0–24 sóder, 1221 (Budapest XXII. kerület).
 */
export const EXAMPLE_CALC = (() => {
  const material = findMaterial("soder-0-24")!;
  const m3 = 8;
  const postalCode = "1221";
  const profile = findProfileByPostalCode(postalCode)!;
  const band = findBand(profile, m3)!;
  const materialGross = material.priceGross! * m3;
  const freightNet = band.netFee;
  const freightVatAmount = Math.round(freightNet * FREIGHT_VAT_RATE);
  const freightGrossAmount = freightNet + freightVatAmount;
  return {
    material,
    m3,
    postalCode,
    profile,
    band,
    bandLabel: bandLabel(profile, band),
    materialGross,
    freightNet,
    freightVat: freightVatAmount,
    freightGross: freightGrossAmount,
    totalGross: materialGross + freightGrossAmount,
  };
})();

const ft = (n: number) => `${n.toLocaleString("hu-HU")} Ft`;

export const FAQ = [
  {
    q: "Mekkora mennyiséget rendelhetek?",
    a: `Minimum rendelés ${MIN_ORDER_M3} m³. Egy fuvarban legfeljebb ${SINGLE_TRIP_MAX_M3} m³ anyagot tudunk kiszállítani — 10 m³ feletti mennyiséghez kérjen egyedi, többfuvaros ajánlatot.`,
  },
  {
    q: "Az anyagárak nettók vagy bruttók?",
    a: "Az árlistában szereplő anyagárak BRUTTÓ árak, Ft/m³-ben, az ÁFÁ-t tartalmazzák. A fuvar díja ettől külön, NETTÓ értékben számolódik, és a fuvardíjra jön az ÁFA. A kalkulátor mindkettőt külön kiírja, és a végén a teljes bruttó tájékoztató összeget is megadja.",
  },
  {
    q: "Mennyi a fuvar ára?",
    a: `A szállítás díja a szállítási címtől és a szállított mennyiségtől függ. A díj nettó érték, rá ${Math.round(FREIGHT_VAT_RATE * 100)}% ÁFA jön. ${FREIGHT_PUBLIC_NOTICE} Ahol nagyobb mennyiségre nincs egyfuvaros díj, ott egyedi egyeztetés szükséges.`,
  },
  {
    q: "A fuvardíj tartalmazza a behajtási engedélyt?",
    a: "Igen. A feltüntetett fuvardíjak a behajtási engedély költségét tartalmazzák. Kivétel a Budapest I. kerületi Vár területe, ahol külön engedély és előzetes egyeztetés szükséges — erre a kalkulátor külön rákérdez.",
  },
  {
    q: "Mennyire gyors a kiszállítás?",
    a: "Budafok környékén a kiszállás gyakran aznap megtörténik. Budapest többi kerületében és Érden egyeztetett időpontban szállítunk.",
  },
  {
    q: "Melyik anyagot válasszam?",
    a: "Alapozáshoz és betonhoz sódert (0–8, 0–16, 0–24), falazáshoz finomabb 0–4-et vagy homokot, kocsibeállóhoz murvát vagy kulét, kertdekorációhoz kavicsot és kerti murvát, nagy terhelésű felülethez andezitet, feltöltéshez töltőföldet szoktunk ajánlani. Ha bizonytalan, hívjon minket — segítünk kiválasztani.",
  },
  {
    q: "Hol kérhetek hulladékkonténert?",
    a: "A hulladék és konténer szállítás önálló üzletág: a Buda Konténer (budakontener.hu) oldalon rendelhető sitt, vegyes és zöldhulladék konténer. A sóder és az építőanyag-szállítás itt, a Sóderárak oldalon külön történik.",
  },
  {
    q: "Mennyibe kerül 8 m³ sóder kiszállítással?",
    a: `Például ${EXAMPLE_CALC.m3} m³ ${EXAMPLE_CALC.material.name} a(z) ${EXAMPLE_CALC.postalCode} irányítószámra: az anyag bruttó ${EXAMPLE_CALC.m3} × ${ft(EXAMPLE_CALC.material.priceGross!)} = ${ft(EXAMPLE_CALC.materialGross)}, a fuvar (${EXAMPLE_CALC.bandLabel} sáv) ${ft(EXAMPLE_CALC.freightNet)} nettó + ${ft(EXAMPLE_CALC.freightVat)} ÁFA = ${ft(EXAMPLE_CALC.freightGross)} bruttó. Teljes bruttó tájékoztató összeg: ${ft(EXAMPLE_CALC.totalGross)}. A bruttó anyagárra nem kerül még egyszer ÁFA.`,
  },
  {
    q: "Milyen sóder kell térkő alá?",
    a: "Térkő alá ágyazati rétegnek a 0–4 vagy 0–8-as sóder való; alatta tömörített alaprétegnek a 0–24-es sóder vagy a 0–22-es murva ad stabilitást. A rétegek felépítését lépésről lépésre a térkő alatti sóderről szóló útmutatónkban írjuk le.",
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

/** Az oldal utolsó tartalmi frissítése — a sitemap lastmod mezőjét etető érték. */
export const updated = "2026-10-27";

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
    title: "Mennyibe kerül a sóder? Bruttó anyagár és nettó fuvar",
    excerpt:
      "Bruttó anyagár köbméterenként, külön nettó szállítási díj, példaszámítással — így jön ki a sóder végára.",
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
      "Frakciók és szemcseösszetétel a különböző betonfajtákhoz: 0–4 a falazáshoz, 0–8 és 0–16 a lapos felületekhez, 0–24 a födémekhez és alapokhoz.",
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
      "Milyen anyag, mekkora vastagságban: murva, kulé és sóder kocsibeállóhoz vagy parkolóhoz.",
  },
  {
    slug: "toltosoder-es-rostalt-soder",
    title: "Töltősóder vagy rostált sóder? A különbség",
    excerpt:
      "Miért olcsóbb a töltősóder, és mikor elég az? Anyagminőség, felhasználás és bruttó ár egy helyen.",
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
      "0–8 vagy 0–16? A megfelelő frakció kiválasztása aljzatbetonhoz: vékony rétegekhez, vastag aljzathoz és a feltöltési ráhagyáshoz a bevált anyagválasztás.",
  },
  {
    slug: "arkalkulator-hasznalata",
    title: "Árkalkulátor használata lépésről lépésre",
    excerpt:
      "Anyag, mennyiség, szállítási cím, összesítés: mit számol ki a kalkulátor, és hogyan küldhet rendelési igényt.",
  },
  {
    slug: "mennyi-ido-a-soder-szallitas",
    title: "Mennyi idő a sóder szállítás? Kiszállási idők",
    excerpt:
      "Mikor érkezik a sóder? Aznapos kiszállás Budafok környékén, egyeztetett időpont Budapest többi kerületében és Érden.",
  },
] as const;

export function findGuide(slug: string) {
  return guides.find((g) => g.slug === slug);
}
