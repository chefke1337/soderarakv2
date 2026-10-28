/**
 * SÓDERÁRAK V3 — FUVARDÍJ-MODELL (irányítószám-alapú).
 *
 * SZABÁLYOK:
 *  - Minden itt szereplő fuvardíj NETTÓ forint, EGY fuvarra.
 *  - Egy fuvarban legfeljebb `SINGLE_TRIP_MAX_M3` m³ szállítható.
 *  - Az irányítószám-listák KIZÁRÓLAG a jóváhagyott ügyféladatból származnak
 *    (2026-10-27). Feltételezésből NE kerüljön ide új kód, és meglévő kódhoz
 *    NE kerüljön önkényesen tarifa.
 *  - Ahol egy profilnak nincs sávja nagyobb mennyiségre, ott NINCS ár:
 *    a válasz `quote-required`, nem kitalált összeg.
 *  - A sávhatárok felső határa ZÁRT: `m3 <= upTo` (≤2, >2–5, >5–7, >7–10),
 *    így nincs se átfedés, se rés.
 */

/** Fuvar ÁFA-kulcs — jóváhagyott ügyfélválasz (2026-10-27): magyar általános 27%. */
export const FREIGHT_VAT_RATE = 0.27;

/** Egy fuvarban szállítható maximum (V3 szabály: a korábbi 20 m³ helyett). */
export const SINGLE_TRIP_MAX_M3 = 10;
/** Minimum rendelés egy fuvarra. */
export const MIN_ORDER_M3 = 1;

/** Behajtási engedély — jóváhagyott szöveg; minden fuvardíj tartalmazza. */
export const PERMIT_NOTICE =
  "A feltüntetett fuvardíjak a behajtási engedély költségét tartalmazzák. Kivétel a Budapest I. kerületi Vár területe, ahol külön engedély és előzetes egyeztetés szükséges.";

/** 10 m³ feletti mennyiség — jóváhagyott szöveg. */
export const MULTI_TRIP_NOTICE =
  "10 m³ feletti mennyiséghez kérjen egyedi, többfuvaros ajánlatot.";

/** Nem támogatott irányítószám — jóváhagyott szöveg. */
export const UNSUPPORTED_NOTICE =
  "Ehhez a címhez egyedi szállítási egyeztetés szükséges.";

/* ────────────────────────────── Típusok ────────────────────────────── */

/** Egy díjsáv: `m3 <= upTo` esetén `netFee` nettó forint egy fuvarra. */
export type FreightBand = {
  /** Felső határ m³-ben, ZÁRTAN beleértve. */
  upTo: number;
  /** Nettó fuvardíj Ft egy fuvarra. */
  netFee: number;
};

export type FreightProfile = {
  id: string;
  /** Emberi megnevezés (pl. „Budapest XI. kerület — 1112, 1118”). */
  label: string;
  municipalityId: MunicipalityId;
  /** Budapest esetén a kerület azonosítója (1–23). */
  districtId?: number;
  /** A profilhoz tartozó irányítószámok — kizárólag jóváhagyott adat. */
  postalCodes: readonly string[];
  /** Növekvő `upTo` szerint rendezett sávok. */
  bands: readonly FreightBand[];
};

export type MunicipalityId = "budapest" | "erd";

export type Municipality = {
  id: MunicipalityId;
  name: string;
  /** true: a kerület megadása kötelező (Budapest). */
  requiresDistrict: boolean;
};

export const municipalities: readonly Municipality[] = [
  { id: "budapest", name: "Budapest", requiresDistrict: true },
  { id: "erd", name: "Érd", requiresDistrict: false },
] as const;

/** Római kerületszámok I–XXIII. */
export const ROMAN = [
  "I.", "II.", "III.", "IV.", "V.", "VI.", "VII.", "VIII.", "IX.", "X.",
  "XI.", "XII.", "XIII.", "XIV.", "XV.", "XVI.", "XVII.", "XVIII.", "XIX.",
  "XX.", "XXI.", "XXII.", "XXIII.",
] as const;

export function romanDistrict(districtId: number): string {
  return ROMAN[districtId - 1] ?? String(districtId);
}

/** A Vár területe a Budapest I. kerületben — NEM dönthető el irányítószámból. */
export const CASTLE_DISTRICT_ID = 1;

/* ──────────────────────── Díjprofilok (nettó Ft) ──────────────────────── */

const bp = (
  districtId: number,
  postalCodes: readonly string[],
  bands: readonly FreightBand[],
  labelSuffix = "",
): FreightProfile => ({
  id: `bp-${districtId}${labelSuffix ? `-${labelSuffix}` : ""}`,
  label: `Budapest ${romanDistrict(districtId)} kerület${labelSuffix ? ` — ${postalCodes.join(", ")}` : ""}`,
  municipalityId: "budapest",
  districtId,
  postalCodes,
  bands,
});

/** Leggyakoribb sávkiosztás: 22/32/40/60 ezer Ft nettó. */
const B_22_32_40_60: readonly FreightBand[] = [
  { upTo: 2, netFee: 22000 },
  { upTo: 5, netFee: 32000 },
  { upTo: 7, netFee: 40000 },
  { upTo: 10, netFee: 60000 },
];

/** 22/30/40/60 ezer Ft nettó. */
const B_22_30_40_60: readonly FreightBand[] = [
  { upTo: 2, netFee: 22000 },
  { upTo: 5, netFee: 30000 },
  { upTo: 7, netFee: 40000 },
  { upTo: 10, netFee: 60000 },
];

/** 20/30/40/60 ezer Ft nettó. */
const B_20_30_40_60: readonly FreightBand[] = [
  { upTo: 2, netFee: 20000 },
  { upTo: 5, netFee: 30000 },
  { upTo: 7, netFee: 40000 },
  { upTo: 10, netFee: 60000 },
];

export const freightProfiles: readonly FreightProfile[] = [
  // I. kerület — a sávok 8 m³-ig tartanak; felette egyedi egyeztetés.
  bp(1, ["1011", "1012", "1013", "1014", "1015", "1016"], [
    { upTo: 2, netFee: 18000 },
    { upTo: 5, netFee: 32000 },
    { upTo: 8, netFee: 40000 },
  ]),
  bp(2, ["1021", "1022", "1023", "1024", "1025", "1026", "1027", "1028", "1029"], [
    { upTo: 2, netFee: 20000 },
    { upTo: 5, netFee: 32000 },
    { upTo: 7, netFee: 40000 },
    { upTo: 10, netFee: 60000 },
  ]),
  bp(3, ["1031", "1032", "1033", "1034", "1035", "1036", "1037", "1038", "1039"], B_22_32_40_60),
  bp(4, ["1041", "1042", "1043", "1044", "1045", "1046", "1047", "1048"], B_22_32_40_60),
  // V. kerület — csak 5 m³-ig van tarifa; felette egyedi egyeztetés.
  bp(5, ["1051", "1052", "1053", "1054", "1055", "1056"], [
    { upTo: 2, netFee: 22000 },
    { upTo: 5, netFee: 35000 },
  ]),
  // VI–VII. kerület — 7 m³-ig; felette egyedi egyeztetés.
  bp(6, ["1061", "1062", "1063", "1064", "1065", "1066", "1067", "1068"], [
    { upTo: 2, netFee: 22000 },
    { upTo: 5, netFee: 32000 },
    { upTo: 7, netFee: 40000 },
  ]),
  bp(7, ["1071", "1072", "1073", "1074", "1075", "1076", "1077", "1078"], [
    { upTo: 2, netFee: 22000 },
    { upTo: 5, netFee: 32000 },
    { upTo: 7, netFee: 40000 },
  ]),
  bp(8, ["1081", "1082", "1083", "1084", "1085", "1086", "1087", "1088", "1089"], B_22_32_40_60),
  bp(9, ["1091", "1092", "1093", "1094", "1095", "1096", "1097", "1098"], B_22_32_40_60),
  bp(10, ["1101", "1102", "1103", "1104", "1105", "1106", "1107", "1108"], B_22_32_40_60),
  // XI. kerület — KÉT profil: az alap, és az 1112/1118 eltérő díjszabása.
  bp(11, ["1111", "1113", "1114", "1115", "1116", "1117", "1119"], [
    { upTo: 2, netFee: 16000 },
    { upTo: 5, netFee: 25000 },
    { upTo: 7, netFee: 30000 },
    { upTo: 10, netFee: 50000 },
  ], "alap"),
  bp(11, ["1112", "1118"], [
    { upTo: 2, netFee: 18000 },
    { upTo: 5, netFee: 25000 },
    { upTo: 7, netFee: 35000 },
    { upTo: 10, netFee: 60000 },
  ], "1112-1118"),
  bp(12, ["1121", "1122", "1123", "1124", "1125", "1126"], B_20_30_40_60),
  bp(13, ["1131", "1132", "1133", "1134", "1135", "1136", "1137", "1138", "1139"], B_22_32_40_60),
  bp(14, ["1141", "1142", "1143", "1144", "1145", "1146", "1147", "1148", "1149"], B_20_30_40_60),
  bp(15, ["1151", "1152", "1153", "1154", "1155", "1156", "1157", "1158"], B_22_30_40_60),
  bp(16, ["1161", "1162", "1163", "1164", "1165"], B_22_30_40_60),
  bp(17, ["1171", "1172", "1173", "1174"], B_22_30_40_60),
  bp(18, ["1181", "1182", "1183", "1184", "1185", "1186", "1187", "1188"], B_22_30_40_60),
  bp(19, ["1191", "1192", "1193", "1194", "1195", "1196"], B_20_30_40_60),
  bp(20, ["1201", "1202", "1203", "1204", "1205"], [
    { upTo: 2, netFee: 18000 },
    { upTo: 5, netFee: 25000 },
    { upTo: 7, netFee: 35000 },
    { upTo: 10, netFee: 50000 },
  ]),
  // XXI. kerület (Csepel) — a V2-ben kizárt terület a V3 tarifával ismét támogatott.
  bp(21, ["1211", "1212", "1213", "1214", "1215"], B_20_30_40_60),
  bp(22, ["1221", "1222", "1223", "1224", "1225"], [
    { upTo: 2, netFee: 16000 },
    { upTo: 5, netFee: 22000 },
    { upTo: 7, netFee: 30000 },
    { upTo: 10, netFee: 45000 },
  ]),
  bp(23, ["1237", "1238", "1239"], B_22_32_40_60),
  {
    id: "erd",
    label: "Érd",
    municipalityId: "erd",
    // Jóváhagyott ügyfélválasz (2026-10-27): 2030 és 2049 is elfogadott.
    postalCodes: ["2030", "2049"],
    bands: [
      { upTo: 2, netFee: 20000 },
      { upTo: 5, netFee: 30000 },
      { upTo: 7, netFee: 40000 },
      { upTo: 10, netFee: 55000 },
    ],
  },
] as const;

/* ───────────────────────── Származtatott nézetek ───────────────────────── */

/** Budapesti kerületek, amelyekhez van jóváhagyott tarifa — a választóhoz. */
export const budapestDistricts: readonly { id: number; label: string; postalCodes: string[] }[] =
  Array.from(
    freightProfiles
      .filter((p) => p.municipalityId === "budapest" && p.districtId !== undefined)
      .reduce((acc, p) => {
        const id = p.districtId!;
        const entry = acc.get(id) ?? { id, label: `${romanDistrict(id)} kerület`, postalCodes: [] };
        entry.postalCodes.push(...p.postalCodes);
        acc.set(id, entry);
        return acc;
      }, new Map<number, { id: number; label: string; postalCodes: string[] }>())
      .values(),
  ).sort((a, b) => a.id - b.id);

/** Minden támogatott irányítószám → profil. */
export const postalIndex: ReadonlyMap<string, FreightProfile> = new Map(
  freightProfiles.flatMap((p) => p.postalCodes.map((code) => [code, p] as const)),
);

export const allPostalCodes: readonly string[] = [...postalIndex.keys()].sort();

export function findProfileByPostalCode(postalCode: string): FreightProfile | undefined {
  return postalIndex.get(normalizePostalCode(postalCode));
}

/** Négy számjegy kiszűrése (szóköz, kötőjel elfogadva). */
export function normalizePostalCode(raw: string): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 4);
}

export function isPostalCodeShape(raw: string): boolean {
  return /^\d{4}$/.test(normalizePostalCode(raw));
}

/** A profil legnagyobb, fix árral rendelkező mennyisége. */
export function profileMaxM3(p: FreightProfile): number {
  return p.bands[p.bands.length - 1]!.upTo;
}

/** Sáv keresése: az első olyan sáv, amelynek a felső határát a mennyiség nem lépi túl. */
export function findBand(p: FreightProfile, m3: number): FreightBand | undefined {
  return p.bands.find((b) => m3 <= b.upTo);
}

/** Emberi sávfelirat: „≤ 2 m³”, „2–5 m³” … */
export function bandLabel(p: FreightProfile, band: FreightBand): string {
  const i = p.bands.indexOf(band);
  if (i <= 0) return `≤ ${band.upTo} m³`;
  return `${p.bands[i - 1]!.upTo}–${band.upTo} m³`;
}

/* ───────────────────────────── Feloldás ───────────────────────────── */

export type FreightQuery = {
  municipalityId: MunicipalityId | "";
  /** Budapest esetén kötelező. */
  districtId?: number | null;
  /** Mindig kötelező, külön megadva — a kerület NEM helyettesíti. */
  postalCode: string;
  m3: number;
};

export type FreightResult =
  /** Megvan a tarifa. */
  | { kind: "ok"; profile: FreightProfile; band: FreightBand; netFee: number; bandLabel: string }
  /** Hiányzó bemenet (nem hiba, csak még nincs elég adat). */
  | { kind: "incomplete"; missing: "municipality" | "district" | "postalCode" }
  /** Az irányítószám alakja nem négy számjegy. */
  | { kind: "invalid-postal" }
  /** Az irányítószám nem a kiválasztott kerülethez/településhez tartozik. */
  | {
      kind: "mismatch";
      postalCode: string;
      /** Ahová az irányítószám valójában tartozik (ha ismert). */
      actual?: FreightProfile;
      /** Amit a felhasználó választott. */
      selectedLabel: string;
      /** A választáshoz tartozó érvényes irányítószámok. */
      expectedCodes: readonly string[];
    }
  /** Az irányítószámhoz egyáltalán nincs jóváhagyott tarifa. */
  | { kind: "unsupported-postal"; postalCode: string }
  /** Van profil, de ekkora mennyiségre nincs ár. */
  | {
      kind: "quote-required";
      profile: FreightProfile;
      reason: "above-single-trip" | "above-profile";
      profileMaxM3: number;
    };

export function resolveFreight(q: FreightQuery): FreightResult {
  if (!q.municipalityId) return { kind: "incomplete", missing: "municipality" };

  const municipality = municipalities.find((m) => m.id === q.municipalityId);
  if (!municipality) return { kind: "incomplete", missing: "municipality" };

  if (municipality.requiresDistrict && !q.districtId) {
    return { kind: "incomplete", missing: "district" };
  }

  const code = normalizePostalCode(q.postalCode);
  // A kerületválasztás SOHA nem helyettesíti az irányítószámot.
  if (!code) return { kind: "incomplete", missing: "postalCode" };
  if (!isPostalCodeShape(code)) return { kind: "invalid-postal" };

  const byCode = postalIndex.get(code);

  // A kiválasztott település/kerület érvényes irányítószámai.
  const selectedProfiles = freightProfiles.filter(
    (p) =>
      p.municipalityId === q.municipalityId &&
      (!municipality.requiresDistrict || p.districtId === q.districtId),
  );
  const expectedCodes = selectedProfiles.flatMap((p) => [...p.postalCodes]);
  const selectedLabel = municipality.requiresDistrict
    ? `Budapest ${romanDistrict(q.districtId!)} kerület`
    : municipality.name;

  if (!byCode) {
    // Ismeretlen kód: ha a kiválasztott kerülethez tartoznának kódok, az eltérés
    // a fontosabb információ — de ár egyik esetben sem adható.
    return expectedCodes.length
      ? { kind: "mismatch", postalCode: code, selectedLabel, expectedCodes }
      : { kind: "unsupported-postal", postalCode: code };
  }

  // Eltérés: a kód létezik, de nem a kiválasztott településhez/kerülethez.
  const matchesSelection = selectedProfiles.some((p) => p.postalCodes.includes(code));
  if (!matchesSelection) {
    return { kind: "mismatch", postalCode: code, actual: byCode, selectedLabel, expectedCodes };
  }

  if (q.m3 > SINGLE_TRIP_MAX_M3) {
    return {
      kind: "quote-required",
      profile: byCode,
      reason: "above-single-trip",
      profileMaxM3: profileMaxM3(byCode),
    };
  }

  const band = findBand(byCode, q.m3);
  if (!band) {
    return {
      kind: "quote-required",
      profile: byCode,
      reason: "above-profile",
      profileMaxM3: profileMaxM3(byCode),
    };
  }

  return {
    kind: "ok",
    profile: byCode,
    band,
    netFee: band.netFee,
    bandLabel: bandLabel(byCode, band),
  };
}

/** Az I. kerületi Vár-kérdés állapota — irányítószámból NEM dönthető el. */
export type CastleAnswer = "" | "igen" | "nem" | "nem-tudom";

export const CASTLE_QUESTION = "A szállítási cím a Vár területén található?";

/** true: külön engedély-egyeztetés kell, a végösszeg nem garantálható. */
export function needsCastleClearance(districtId: number | null | undefined, answer: CastleAnswer): boolean {
  if (districtId !== CASTLE_DISTRICT_ID) return false;
  return answer === "igen" || answer === "nem-tudom" || answer === "";
}
