/**
 * SÓDERÁRAK V3 — ANYAGKATALÓGUS (egyetlen árforrás).
 *
 * SZABÁLYOK:
 *  - MINDEN anyagár BRUTTÓ, Ft/m³ — az ÁFÁ-t tartalmazza. Erre az árra
 *    SOHA nem kerül még egyszer ÁFA (lásd `src/lib/quote.ts`).
 *  - Az árak a 2026-10-27-i jóváhagyott ügyfélárlistából származnak.
 *  - A mosottság strukturált terméktulajdonság (`washed` / `washNote`), nem
 *    szabad szöveg. Ügyféladat (2026-11-02): a rostált sóderfrakciók és az
 *    osztályozott kavicsok mosottak; a töltősóder NEM mosott; a kulé egyszeri
 *    mosáson esett át, de nem olyan tiszta, mint az osztályozott kavicsok.
 *    Földre, murvára, andezitre és homokra mosottság-jelölés NEM kerül.
 *  - Tanúsítvány vagy további minőségi garancia nem kerül ide.
 */

/** Árazási verzió — a rendelési igény mellé beküldve nyomon követhető. */
export const PRICING_VERSION = "v3-2026-10-27";

/** Jól látható felirat minden árlistán — jóváhagyott szöveg. */
export const DISCLOSURE_GROSS =
  "Bruttó anyagárak, Ft/m³. Az árak az ÁFÁ-t tartalmazzák.";

export const DISCLOSURE_PRICE =
  "Tájékoztató ár. A végleges ajánlatot egyeztetés után adjuk.";

/** A fuvar díja külön, nettó — a bruttó anyagárhoz nem adható közvetlenül. */
export const DISCLOSURE_FREIGHT =
  "A szállítás díja külön számolódik, nettó értékben — a pontos összeget az árkalkulátor mutatja.";

/** Vizuális/típusos anyagazonosító. */
export type Tone = "soder" | "homok" | "kavics" | "murva" | "andezit" | "fold";

/** Strukturált minőségjelölés — csak jóváhagyott állítás kerülhet ide. */
export type WashedMark = {
  /** Rövid, listában is megjelenő jelölés. */
  label: string;
  /** Hosszabb magyarázat (tooltip/termékoldal). */
  detail: string;
};

// Ügyfél (2026-11-01): „minden kavics és sóder mosott … inkább úgy, hogy
// jó minőségű MOSOTT". A mosott-jelölés CSAK sóderre és kavicsra vonatkozik.
export const WASHED_SODER: WashedMark = {
  label: "Jó minőségű, mosott sóder",
  detail: "Vizes osztályozási eljáráson átment, jó minőségű, mosott sóder.",
};

export const WASHED_KAVICS: WashedMark = {
  label: "Jó minőségű, mosott kavics",
  detail: "Jó minőségű, mosott, méret szerint osztályozott kavics.",
};

/**
 * Korlátozó mosottság-jelölés (ügyfél, 2026-11-02). Szándékosan NEM
 * `washed`: ezek a tételek nem kaphatnak „mosott" minőségi badge-et.
 */
export type WashNote = WashedMark & { kind: "not-washed" | "once-washed" };

export const NOT_WASHED_TOLTOSODER: WashNote = {
  kind: "not-washed",
  label: "Nem mosott",
  detail: "A töltősóder nem mosott anyag — feltöltéshez és alapozáshoz való, betonkeveréshez a mosott, rostált sóderfrakciók ajánlottak.",
};

export const ONCE_WASHED_KULE: WashNote = {
  kind: "once-washed",
  label: "Egyszer mosott",
  detail: "A kulé egyszeri mosáson átesett, de nem olyan tiszta, mint az osztályozott kavicsok.",
};

export type MaterialItem = {
  slug: string;
  name: string;
  /** BRUTTÓ Ft/m³ (ÁFÁ-val). null = csak egyeztetés után. */
  priceGross: number | null;
  /** Szemcseméret-tartomány, pl. „0–24 mm”. */
  fraction?: string;
  /** Rövid, forrásolt minősítés a név mellé (pl. „zizi”, „poros murva”). */
  qualifier?: string;
  use: string;
  /** Strukturált mosott-jelölés — csak ahol az ügyfél megadta. */
  washed?: WashedMark;
  /** Korlátozó jelölés (nem mosott / egyszer mosott) — kizárja a `washed`-et. */
  washNote?: WashNote;
  /** Kifejezett ellenjelölés (osztályozatlan termék). */
  unclassified?: boolean;
};

export type MaterialGroup = {
  slug: string;
  name: string;
  short: string;
  description: string;
  tone: Tone;
  /** Dekoratív, stilizált illusztráció (nem fotó). */
  texture: string;
  textureAlt: string;
  /**
   * Valódi anyagfotó az árlistasorhoz. `null`, ha nincs ellenőrzött fotó
   * az anyagról — ilyenkor a stilizált illusztráció jelenik meg. Régi fotót
   * NEM nevezünk át más anyag hiteles fotójává.
   */
  photo: { src: string; position: string } | null;
  /** Csoportszintű mosott-jelölés (CSAK ha a csoport minden tételére igaz). */
  washed?: WashedMark;
  /** Csoportszintű, pontos összefoglaló, ha a tételek mosottsága eltér. */
  washSummary?: string;
  items: MaterialItem[];
};

export const materialGroups: MaterialGroup[] = [
  {
    slug: "soder",
    name: "Sóder",
    short: "Mosott sóderfrakciók és nem mosott töltősóder",
    description:
      "A sóder — kavicsos homoknak is hívják — alap építőanyag, homok és kavics keveréke. Alapozáshoz, betonozáshoz és feltöltéshez használatos. A rostált sóderfrakciók (0–4-től 0–24-ig) vizes osztályozási eljáráson mennek keresztül: jó minőségű, mosott, egyenletes szemcseméretű anyagok. A töltősóder nem mosott.",
    tone: "soder",
    texture: "/anyagok/soder.svg",
    textureAlt: "Sóder textúra — kavicsos homok szemcsék (stilizált illusztráció)",
    photo: { src: "/anyagok/arlista/soder-foto.webp", position: "40% 55%" },
    washSummary: "Mosott sóderfrakciók és nem mosott töltősóder.",
    items: [
      {
        slug: "tolto-soder",
        name: "Töltősóder",
        priceGross: 10500,
        use: "Utak, parkok feltöltésére és beton alatti alapozáshoz. Jól összetömörödik, stabil alapot ad nagy terhelésnél.",
        washNote: NOT_WASHED_TOLTOSODER,
      },
      {
        slug: "soder-0-4",
        name: "0–4 sóder",
        priceGross: 11500,
        fraction: "0–4 mm",
        use: "Finom betonokhoz és falazáshoz. Sima felületet ad, precíz betonozáshoz ajánlott.",
        washed: WASHED_SODER,
      },
      {
        slug: "soder-0-8",
        name: "0–8 sóder",
        priceGross: 14000,
        fraction: "0–8 mm",
        use: "Vékony betonfelületekhez: lépcsők, aljzatok. Könnyen keveredik cementtel, jól folyik.",
        washed: WASHED_SODER,
      },
      {
        slug: "soder-0-16",
        name: "0–16 sóder",
        priceGross: 14000,
        fraction: "0–16 mm",
        use: "3 cm-nél vastagabb betonokhoz. Kiegyensúlyozott keverék, gyakori garázsoknál, házalapoknál.",
        washed: WASHED_SODER,
      },
      {
        slug: "soder-0-24",
        name: "0–24 sóder",
        priceGross: 13500,
        fraction: "0–24 mm",
        use: "4 cm-nél vastagabb betonokhoz: födémek, alapok, járdák. A leggyakrabban alkalmazott sóderfajta.",
        washed: WASHED_SODER,
      },
    ],
  },
  {
    slug: "homok",
    name: "Homok",
    short: "Bányahomok és finom frakcionált homok",
    description:
      "Bányahomok és osztályozott finom homok falazáshoz, vakoláshoz, betonkeveréshez, valamint játszótéri és kerti felhasználásra.",
    tone: "homok",
    texture: "/anyagok/homok.svg",
    textureAlt: "Homok textúra — finom szemcsés dűnék (stilizált illusztráció)",
    photo: { src: "/anyagok/arlista/homok-foto.webp", position: "50% 50%" },
    items: [
      {
        slug: "banyahomok",
        name: "Bányahomok",
        qualifier: "játszótéri",
        priceGross: 9500,
        use: "Általános építőipari és kerti felhasználás, valamint játszótéri homokozóhoz: alaposításhoz, keveréshez, feltöltéshez.",
      },
      {
        slug: "homok-0-1",
        name: "0–1 homok",
        priceGross: 9500,
        fraction: "0–1 mm",
        use: "Finom szemcséjű osztályozott homok vakoláshoz, fugázáshoz és homokozóhoz.",
      },
    ],
  },
  {
    slug: "kavics",
    name: "Kavics",
    short: "Mosott, osztályozott kavics és egyszer mosott kulé",
    description:
      "Az osztályozott kavicsfrakciók jó minőségű, mosott anyagok díszítéshez, burkoláshoz és vízelvezetéshez. A kulé egyszeri mosáson átesett, de nem olyan tiszta, mint az osztályozott kavicsok; méret szerint osztályozatlan, nagy szemcséjű anyag (kb. 32–125 mm).",
    washSummary: "Mosott, osztályozott kavicsfrakciók; a kulé egyszer mosott.",
    tone: "kavics",
    texture: "/anyagok/kavics.svg",
    textureAlt: "Kavics textúra — kerek folyami kövek (stilizált illusztráció)",
    photo: { src: "/anyagok/arlista/kavics-foto.webp", position: "50% 45%" },
    items: [
      {
        slug: "kule",
        name: "Kulé",
        qualifier: "osztályozatlan",
        priceGross: 9500,
        fraction: "kb. 32–125 mm",
        use: "Utak, kocsibeállók, nagy terhelésű felületek feltöltéséhez és vízelvezetéshez. Nagy szemcseméretű, osztályozatlan anyag.",
        unclassified: true,
        washNote: ONCE_WASHED_KULE,
      },
      {
        slug: "gyongykavics-4-8",
        name: "4–8 gyöngykavics",
        priceGross: 15000,
        fraction: "4–8 mm",
        use: "Kertekbe, dísznövények, bokrok, fák alá; segít a nedvesség megtartásában.",
        washed: WASHED_KAVICS,
      },
      {
        slug: "kavics-8-16",
        name: "8–16 kavics",
        priceGross: 15000,
        fraction: "8–16 mm",
        use: "Kertekbe, dísznövények alá; jobb vízelvezetést biztosít, esztétikus fedés.",
        washed: WASHED_KAVICS,
      },
      {
        slug: "kavics-16-32",
        name: "16–32 kavics",
        priceGross: 14500,
        fraction: "16–32 mm",
        use: "Utak, kocsibeállók, kertek burkolásához; jól bírja a járműforgalmat.",
        washed: WASHED_KAVICS,
      },
      {
        slug: "kavics-24-40",
        name: "24–40 kavics",
        priceGross: 14500,
        fraction: "24–40 mm",
        use: "Utak, kocsibeállók burkolásához és vízelvezetéshez; hatékonyan vezeti el a vizet.",
        washed: WASHED_KAVICS,
      },
    ],
  },
  {
    slug: "murva",
    name: "Murva",
    short: "Tömörödő feltöltő és kerti díszmurva",
    description:
      "Zúzott kő murva ágyazathoz, alaprétegekhez, kocsibeállókhoz, útfeltöltéshez, valamint kertek és temetők díszítéséhez.",
    tone: "murva",
    texture: "/anyagok/murva.svg",
    textureAlt: "Murva textúra — szögletes zúzottkő szemek (stilizált illusztráció)",
    photo: { src: "/anyagok/arlista/murva-foto.webp", position: "50% 50%" },
    items: [
      {
        slug: "murva-0-5",
        name: "0–5 murva",
        qualifier: "ágyazatnak",
        priceGross: 17000,
        fraction: "0–5 mm",
        use: "Ágyazati rétegnek, például műfű alá. Finom szemcse, egyenletesen elteríthető és tömöríthető.",
      },
      {
        slug: "murva-0-22",
        name: "0–22 murva",
        qualifier: "poros murva",
        priceGross: 14000,
        fraction: "0–22 mm",
        use: "Jól tömörödő, poros murva feltöltésekhez, kocsibeállókhoz, utakhoz.",
      },
      {
        slug: "murva-2-5",
        name: "2–5 murva",
        qualifier: "zizi",
        priceGross: 19000,
        fraction: "2–5 mm",
        use: "Kis szemcseméretű murva („zizi”) kertek, sétányok, temetők díszítéséhez. Könnyen elteríthető.",
      },
      {
        slug: "murva-4-11",
        name: "4–11 murva",
        qualifier: "kerti és temetői murva",
        priceGross: 17000,
        fraction: "4–11 mm",
        use: "Kertek, virágágyások és temetői felületek díszítéséhez; stabil fedést ad, időjárásálló.",
      },
      {
        slug: "murva-11-22",
        name: "11–22 murva",
        qualifier: "kocsibeállóhoz és parkolóhoz",
        priceGross: 17000,
        fraction: "11–22 mm",
        use: "Kocsibeállók és parkolók burkolásához; vízelvezető, megakadályozza a tócsákat.",
      },
      {
        slug: "murva-20-55",
        name: "20–55 murva",
        qualifier: "útfeltöltéshez",
        priceGross: 15000,
        fraction: "20–55 mm",
        use: "Útfeltöltéshez, nagy terhelésű alaprétegekhez. A legnagyobb szemcséjű murva frakció.",
      },
    ],
  },
  {
    slug: "andezit",
    name: "Andezit",
    short: "Nógrádkövesdi andezit zúzottkő frakciók",
    description:
      "Nógrádkövesdi andezit: kemény, zúzottkő anyag nagy terhelésű felületekhez, útalapokhoz és díszítő felhasználásra, három frakcióban.",
    tone: "andezit",
    texture: "/anyagok/andezit.svg",
    textureAlt: "Andezit textúra — sötét, szögletes zúzottkő élek (stilizált illusztráció)",
    // Nincs ellenőrzött andezitfotó: a korábbi bazaltfotó NEM kerül ide
    // andezit hiteles fotójaként. A soron a stilizált illusztráció jelenik meg.
    photo: null,
    items: [
      {
        slug: "andezit-2-5",
        name: "2–5 andezit",
        priceGross: 27000,
        fraction: "2–5 mm",
        use: "Finom andezit frakció ágyazathoz és díszítő felületekhez.",
      },
      {
        slug: "andezit-4-11",
        name: "4–11 andezit",
        priceGross: 19000,
        fraction: "4–11 mm",
        use: "Kerti utak, sétányok és nagy terhelésű felületek fedéséhez.",
      },
      {
        slug: "andezit-11-22",
        name: "11–22 andezit",
        priceGross: 19000,
        fraction: "11–22 mm",
        use: "Útalapokhoz, kocsibeállókhoz és nagy terhelésű felületekhez.",
      },
    ],
  },
  {
    slug: "fold",
    name: "Föld",
    short: "Töltőföld feltöltésre, termőföld kertbe",
    description:
      "Töltőföld tereprendezéshez és feltöltésekhez, termőföld kertrendezéshez, ágyásokhoz és pázsitlefektetéshez.",
    tone: "fold",
    texture: "/anyagok/fold.svg",
    textureAlt: "Föld textúra — termőföld rétegek (stilizált illusztráció)",
    photo: { src: "/anyagok/arlista/fold-foto.webp", position: "50% 60%" },
    items: [
      {
        slug: "toltofold",
        name: "Töltőföld",
        priceGross: 4000,
        use: "Kerti feltöltésekhez, tereprendezéshez, szintkiegyenlítéshez.",
      },
      {
        slug: "termofold",
        name: "Termőföld",
        priceGross: 11500,
        use: "Pázsitlefektetéshez, ágyásokhoz, kertrendezéshez.",
      },
    ],
  },
];

/* ───────────────────────── Származtatott nézetek ───────────────────────── */

export type MaterialItemWithGroup = MaterialItem & { groupName: string; groupSlug: string };

export const allMaterials: MaterialItemWithGroup[] = materialGroups.flatMap((g) =>
  g.items.map((i) => ({ ...i, groupName: g.name, groupSlug: g.slug })),
);

export function findMaterialGroup(slug: string): MaterialGroup | undefined {
  return materialGroups.find((g) => g.slug === slug);
}

export function findMaterial(slug: string): MaterialItemWithGroup | undefined {
  return allMaterials.find((m) => m.slug === slug);
}

/** Legalacsonyabb BRUTTÓ ár egy tétellistában (null = csak egyeztetés után). */
export function minGrossPrice(items: { priceGross: number | null }[]): number | null {
  const priced = items.filter((i) => i.priceGross !== null).map((i) => i.priceGross as number);
  return priced.length ? Math.min(...priced) : null;
}

/** Kategória induló (legalacsonyabb bruttó) ára. */
export function groupStartingPrice(g: MaterialGroup): number | null {
  return minGrossPrice(g.items);
}

/**
 * V2 → V3 azonosító-átnevezések. A régi `?anyag=` deeplinkek és a mentett
 * piszkozatok így nem vezetnek üres állapotra, és a régi anyagoldal-linkek
 * sem törnek el.
 */
export const LEGACY_ITEM_SLUGS: Record<string, string> = {
  "homok-natur": "banyahomok",
  "kavics-4-8": "gyongykavics-4-8",
  "kulekavics-16-32": "kavics-16-32",
  "kulekavics-24-40": "kavics-24-40",
  "kulekavics-30-65": "kule",
  "kerti-murva-5-12": "murva-4-11",
  "kerti-murva-12-20": "murva-11-22",
  "murva-0-20": "murva-0-22",
  "bazalt-0-4": "andezit-2-5",
  "bazalt-2-4": "andezit-2-5",
  "bazalt-11-22": "andezit-11-22",
  naturfold: "toltofold",
  daraltfold: "termofold",
  "tragyas-komposztos-fold": "termofold",
};

/** Régi anyagcsoport-útvonalak (a Bazalt kategória Andezitre cserélődött). */
export const LEGACY_GROUP_SLUGS: Record<string, string> = {
  bazalt: "andezit",
};

/** Bármely (akár régi) tétel-azonosító feloldása élő tételre. */
export function resolveItemSlug(slug: string | null | undefined): string | undefined {
  if (!slug) return undefined;
  if (allMaterials.some((m) => m.slug === slug)) return slug;
  const mapped = LEGACY_ITEM_SLUGS[slug];
  return mapped && allMaterials.some((m) => m.slug === mapped) ? mapped : undefined;
}

/**
 * Egy anyagcsoport mosott-jelölése egységesen minden felületen:
 * - `scope: "group"` — a teljes csoportra igaz;
 * - `scope: "some"` — csak egyes tételekre (Sóder: a töltősóder nem mosott;
 *   Kavics: a kulé csak egyszer mosott) → a jelölést mindig hatókörrel, a
 *   `summary` pontos szövegével kell megjeleníteni, általános badge nélkül.
 * A mosottság NEM terjed ki automatikusan más csoportokra.
 */
export function groupWashed(
  g: MaterialGroup,
): { mark: WashedMark; scope: "group" | "some"; summary: string } | null {
  if (g.washed) return { mark: g.washed, scope: "group", summary: g.washed.label };
  const first = g.items.find((i) => i.washed)?.washed;
  return first ? { mark: first, scope: "some", summary: g.washSummary ?? first.label } : null;
}

/** Egy tétel mosottság-jelölése egy helyről: mosott / egyszer mosott / nem mosott. */
export function itemWash(
  i: Pick<MaterialItem, "washed" | "washNote">,
): { kind: "washed" | "once-washed" | "not-washed"; label: string; detail: string } | null {
  if (i.washNote) return { kind: i.washNote.kind, label: i.washNote.label, detail: i.washNote.detail };
  if (i.washed) return { kind: "washed", label: i.washed.label, detail: i.washed.detail };
  return null;
}
