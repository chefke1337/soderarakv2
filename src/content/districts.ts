/**
 * Budapesti kerületek és városrészek — az ÜGYFÉL ÁLTAL MEGADOTT lista
 * (2026-10-31), szó szerint átvéve. Nem hiteles közigazgatási nyilvántartás:
 * - a megosztott városrészek (pl. Gellérthegy, Sashegy, Krisztinaváros)
 *   úgy szerepelnek, ahogy a listában — több kerületnél is, „(egy része)"
 *   jelöléssel, önkényes egy kerülethez rendelés nélkül;
 * - városrészből NEM következtetünk irányítószámra vagy tarifára — a
 *   fuvardíj forrása mindig a pontos irányítószám (freight.ts).
 * NE egészítsd ki találgatva.
 */

export type DistrictInfo = {
  /** Kerület sorszáma (1–23). */
  id: number;
  /** A listában megadott kerületnév (ha volt). */
  name?: string;
  /** Városrészek, a listában megadott alakban és sorrendben. */
  areas: readonly string[];
};

export const DISTRICT_AREAS_SOURCE =
  "Az ügyféltől kapott kerület- és városrészlista; tájékoztató jellegű, nem hivatalos nyilvántartás.";

export const budapestDistrictAreas: readonly DistrictInfo[] = [
  { id: 1, name: "Várkerület", areas: ["Vár", "Víziváros", "Krisztinaváros", "Tabán", "Gellérthegy (egy része)"] },
  {
    id: 2,
    areas: [
      "Adyliget", "Budaliget", "Budakeszierdő", "Csatárka", "Erzsébetliget", "Erzsébettelek", "Felhévíz", "Gercse",
      "Hársakalja", "Hárshegy", "Hűvösvölgy", "Kővár", "Kurucles", "Lipótmező", "Máriaremete", "Nyék", "Országút",
      "Pálvölgy", "Pasarét", "Pesthidegkút-Ófalu", "Petneházy-rét", "Remetekertváros", "Rézmál", "Rózsadomb",
      "Szemlőhegy", "Széphalom", "Szépilona", "Szépvölgy", "Törökvész", "Újlak", "Vérhalom",
      "Víziváros (északi része)", "Zöldmál",
    ],
  },
  {
    id: 3,
    name: "Óbuda-Békásmegyer",
    areas: [
      "Óbuda", "Aquincum", "Aranyhegy", "Békásmegyer", "Csillaghegy", "Csúcshegy", "Filatorigát", "Hármashatár-hegy",
      "Kaszásdűlő", "Mátyáshegy", "Mocsárosdűlő", "Óbudai-sziget", "Remetehegy", "Rómaifürdő", "Solymárvölgy",
      "Szépvölgy", "Táborhegy", "Testvérhegy", "Törökkő", "Ürömhegy", "Újlak",
    ],
  },
  { id: 4, name: "Újpest", areas: ["Újpest", "Megyer", "Káposztásmegyer", "Székesdűlő", "Istvántelek"] },
  { id: 5, name: "Belváros-Lipótváros", areas: ["Belváros", "Lipótváros"] },
  { id: 6, name: "Terézváros", areas: ["Terézváros", "Belső-Terézváros", "Külső-Terézváros", "Nagykörút környéke"] },
  { id: 7, name: "Erzsébetváros", areas: ["Belső-Erzsébetváros", "Külső-Erzsébetváros", "Erzsébetváros", "Zsidónegyed"] },
  {
    id: 8,
    name: "Józsefváros",
    areas: [
      "Józsefváros", "Palotanegyed", "Magdolnanegyed", "Corvinnegyed", "Losonci negyed", "Népszínháznegyed",
      "Orczynegyed", "Csarnoknegyed", "Ganznegyed", "Kerepesdűlő", "Tisztviselőtelep",
    ],
  },
  {
    id: 9,
    name: "Ferencváros",
    areas: [
      "Belső-Ferencváros", "Középső-Ferencváros", "Külső-Ferencváros", "Gubacsidűlő", "József Attila-lakótelep",
      "Mester utca környéke", "Ferencvárosi pályaudvar környéke",
    ],
  },
  {
    id: 10,
    name: "Kőbánya",
    areas: [
      "Felsőrákos", "Gyárdűlő", "Keresztúridűlő", "Kőbánya-Kertváros", "Óhegy", "Újhegy", "Ligettelek",
      "Téglagyárdűlő", "Pongráctelep", "Kőbánya központja",
    ],
  },
  {
    id: 11,
    name: "Újbuda",
    areas: [
      "Albertfalva", "Dobogó", "Gazdagrét", "Gellérthegy (egy része)", "Hosszúrét", "Kamaraerdő", "Kelenföld",
      "Kelenvölgy", "Kőérberek", "Lágymányos", "Madárhegy", "Őrmező", "Őrsöd", "Péterhegy", "Pösingermajor", "Sasad",
      "Sashegy (egy része)", "Spanyolrét", "Tabán (egy része)",
    ],
  },
  {
    id: 12,
    name: "Hegyvidék",
    areas: [
      "Budakeszierdő", "Csillebérc", "Farkasrét", "Farkasvölgy", "Istenhegy", "Jánoshegy", "Kissvábhegy",
      "Krisztinaváros (egy része)", "Kútvölgy", "Magasút", "Mártonhegy", "Németvölgy", "Orbánhegy",
      "Sashegy (egy része)", "Svábhegy", "Széchenyi-hegy", "Virányos", "Zugliget",
    ],
  },
  {
    id: 13,
    areas: [
      "Angyalföld", "Újlipótváros", "Vizafogó", "Népsziget (egy része)", "Göncz Árpád városközpont", "Lőportárdűlő",
      "Országbírónegyed", "Marina-part",
    ],
  },
  {
    id: 14,
    name: "Zugló",
    areas: ["Alsórákos", "Herminamező", "Istvánmező", "Kiszugló", "Nagyzugló", "Rákosfalva", "Törökőr", "Városliget"],
  },
  { id: 15, areas: ["Rákospalota", "Pestújhely", "Újpalota"] },
  {
    id: 16,
    areas: [
      "Árpádföld", "Cinkota", "Mátyásföld", "Rákosszentmihály", "Sashalom", "Kisszentmihály", "Ilonatelep",
      "Petőfikert", "Nagyiccetelep", "Szentgyörgytelep", "Szabadságtelep", "Huszkatelep",
    ],
  },
  {
    id: 17,
    name: "Rákosmente",
    areas: [
      "Akadémiaújtelep", "Madárdomb", "Rákoscsaba", "Rákoscsaba-Újtelep", "Rákoshegy", "Rákoskeresztúr", "Rákoskert",
      "Rákosliget", "Régiakadémiatelep",
    ],
  },
  {
    id: 18,
    name: "Pestszentlőrinc-Pestszentimre",
    areas: [
      "Pestszentlőrinc", "Pestszentimre", "Alacskai úti lakótelep", "Almáskert", "Bélatelep", "Belsőmajor",
      "Bókaytelep", "Erdőskert", "Erzsébettelep", "Ferihegy", "Ganzkertváros", "Ganztelep", "Gloriett-telep",
      "Halmierdő", "Havanna-telep", "Kossuth Ferenc-telep", "Lakatostelep", "Liptáktelep", "Lónyaytelep",
      "Miklóstelep", "Rendessytelep", "Szemeretelep", "Szent Imre-kertváros", "Szent Lőrinc-telep", "Újpéteritelep",
    ],
  },
  {
    id: 19,
    name: "Kispest",
    areas: [
      "Kispest", "Wekerletelep", "Felső-Kispest", "Kispest Kertváros", "Hagyományos Kispest (Óváros)",
      "Kispesti lakótelep",
    ],
  },
  {
    id: 20,
    name: "Pesterzsébet",
    areas: ["Gubacsipuszta", "Kossuthfalva", "Pacsirtatelep", "Pesterzsébet", "Pesterzsébet-Szabótelep"],
  },
  {
    id: 21,
    name: "Csepel",
    areas: [
      "Csepel-Belváros", "Csepel-Kertváros", "Csepel-Ófalu", "Csepel-Rózsadomb", "Csepel-Szabótelep", "Csillagtelep",
      "Erdőalja", "Erdősor", "Gyártelep", "Háros", "Királyerdő", "Királymajor", "Szigetcsúcs",
    ],
  },
  {
    id: 22,
    name: "Budafok-Tétény",
    areas: [
      "Budafok", "Budatétény", "Nagytétény", "Baross Gábor-telep", "Budafok belvárosa", "Kistétény",
      "Nagytétény történelmi központja", "Háros", "Kőérberek (egy része)",
    ],
  },
  {
    id: 23,
    name: "Soroksár",
    areas: [
      "Soroksár", "Soroksár-Újtelep", "Millenniumtelep", "Molnár-sziget", "Péterimajor", "Apostolhegy", "Hets-telep",
      "Orbánhegy", "Sólyom-telep", "Vargatelep", "Wesselényi-telep", "Történeti központ",
    ],
  },
];

export function districtAreas(id: number): DistrictInfo | undefined {
  return budapestDistrictAreas.find((d) => d.id === id);
}
