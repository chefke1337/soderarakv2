/**
 * V3 FUVARDÍJ — irányítószám-alapú feloldás.
 *
 * Ellenőrzi: az összes megadott irányítószám, a XI. kerületi eltérő tarifák,
 * a kerület/irányítószám eltérés, az ismeretlen cím, az összes sávhatár, az
 * I./V./VI./VII. kerület hiányzó nagyobb tarifája, a 10 m³ feletti egyedi
 * ajánlat, Csepel visszatérése és Érd.
 *
 * Futtatás: npm run test:freight
 */
import {
  allPostalCodes,
  bandLabel,
  budapestDistricts,
  CASTLE_DISTRICT_ID,
  findBand,
  findProfileByPostalCode,
  freightProfiles,
  isPostalCodeShape,
  needsCastleClearance,
  normalizePostalCode,
  profileMaxM3,
  resolveFreight,
  romanDistrict,
  SINGLE_TRIP_MAX_M3,
} from "../src/content/freight.ts";
import { check, eq, deepEq, section, finish } from "./_harness.mjs";

/** A jóváhagyott ügyféladat teljes leképezése — a teszt FÜGGETLEN forrása. */
const SPEC = [
  { d: 1, codes: ["1011", "1012", "1013", "1014", "1015", "1016"], bands: [[2, 18000], [5, 32000], [8, 40000]] },
  { d: 2, codes: ["1021", "1022", "1023", "1024", "1025", "1026", "1027", "1028", "1029"], bands: [[2, 20000], [5, 32000], [7, 40000], [10, 60000]] },
  { d: 3, codes: ["1031", "1032", "1033", "1034", "1035", "1036", "1037", "1038", "1039"], bands: [[2, 22000], [5, 32000], [7, 40000], [10, 60000]] },
  { d: 4, codes: ["1041", "1042", "1043", "1044", "1045", "1046", "1047", "1048"], bands: [[2, 22000], [5, 32000], [7, 40000], [10, 60000]] },
  { d: 5, codes: ["1051", "1052", "1053", "1054", "1055", "1056"], bands: [[2, 22000], [5, 35000]] },
  { d: 6, codes: ["1061", "1062", "1063", "1064", "1065", "1066", "1067", "1068"], bands: [[2, 22000], [5, 32000], [7, 40000]] },
  { d: 7, codes: ["1071", "1072", "1073", "1074", "1075", "1076", "1077", "1078"], bands: [[2, 22000], [5, 32000], [7, 40000]] },
  { d: 8, codes: ["1081", "1082", "1083", "1084", "1085", "1086", "1087", "1088", "1089"], bands: [[2, 22000], [5, 32000], [7, 40000], [10, 60000]] },
  { d: 9, codes: ["1091", "1092", "1093", "1094", "1095", "1096", "1097", "1098"], bands: [[2, 22000], [5, 32000], [7, 40000], [10, 60000]] },
  { d: 10, codes: ["1101", "1102", "1103", "1104", "1105", "1106", "1107", "1108"], bands: [[2, 22000], [5, 32000], [7, 40000], [10, 60000]] },
  { d: 11, codes: ["1111", "1113", "1114", "1115", "1116", "1117", "1119"], bands: [[2, 16000], [5, 25000], [7, 30000], [10, 50000]] },
  { d: 11, codes: ["1112", "1118"], bands: [[2, 18000], [5, 25000], [7, 35000], [10, 60000]] },
  { d: 12, codes: ["1121", "1122", "1123", "1124", "1125", "1126"], bands: [[2, 20000], [5, 30000], [7, 40000], [10, 60000]] },
  { d: 13, codes: ["1131", "1132", "1133", "1134", "1135", "1136", "1137", "1138", "1139"], bands: [[2, 22000], [5, 32000], [7, 40000], [10, 60000]] },
  { d: 14, codes: ["1141", "1142", "1143", "1144", "1145", "1146", "1147", "1148", "1149"], bands: [[2, 20000], [5, 30000], [7, 40000], [10, 60000]] },
  { d: 15, codes: ["1151", "1152", "1153", "1154", "1155", "1156", "1157", "1158"], bands: [[2, 22000], [5, 30000], [7, 40000], [10, 60000]] },
  { d: 16, codes: ["1161", "1162", "1163", "1164", "1165"], bands: [[2, 22000], [5, 30000], [7, 40000], [10, 60000]] },
  { d: 17, codes: ["1171", "1172", "1173", "1174"], bands: [[2, 22000], [5, 30000], [7, 40000], [10, 60000]] },
  { d: 18, codes: ["1181", "1182", "1183", "1184", "1185", "1186", "1187", "1188"], bands: [[2, 22000], [5, 30000], [7, 40000], [10, 60000]] },
  { d: 19, codes: ["1191", "1192", "1193", "1194", "1195", "1196"], bands: [[2, 20000], [5, 30000], [7, 40000], [10, 60000]] },
  { d: 20, codes: ["1201", "1202", "1203", "1204", "1205"], bands: [[2, 18000], [5, 25000], [7, 35000], [10, 50000]] },
  { d: 21, codes: ["1211", "1212", "1213", "1214", "1215"], bands: [[2, 20000], [5, 30000], [7, 40000], [10, 60000]] },
  { d: 22, codes: ["1221", "1222", "1223", "1224", "1225"], bands: [[2, 16000], [5, 22000], [7, 30000], [10, 45000]] },
  { d: 23, codes: ["1237", "1238", "1239"], bands: [[2, 22000], [5, 32000], [7, 40000], [10, 60000]] },
  { d: null, codes: ["2030", "2049"], bands: [[2, 20000], [5, 30000], [7, 40000], [10, 55000]] },
];

const q = (postalCode, m3, districtId, municipalityId = districtId ? "budapest" : "erd") =>
  resolveFreight({ municipalityId, districtId: districtId ?? null, postalCode, m3 });

/* ─────── 1. Minden megadott irányítószám: sávonként a pontos díj ─────── */
section("Minden irányítószám minden sávja");

for (const spec of SPEC) {
  for (const code of spec.codes) {
    const profile = findProfileByPostalCode(code);
    check(`${code}: van díjprofil`, Boolean(profile));
    if (!profile) continue;

    deepEq(
      `${code}: a profil sávjai`,
      profile.bands.map((b) => [b.upTo, b.netFee]),
      spec.bands,
    );

    // A sávba eső reprezentatív mennyiségek: az alsó (nyitott) határ+1 és a felső határ.
    let prev = 0;
    for (const [upTo, fee] of spec.bands) {
      for (const m3 of [prev + 1, upTo]) {
        const r = q(code, m3, spec.d);
        eq(`${code} @ ${m3} m³ → találat`, r.kind, "ok");
        if (r.kind === "ok") eq(`${code} @ ${m3} m³ nettó díj`, r.netFee, fee);
      }
      prev = upTo;
    }
  }
}

eq(
  "a támogatott irányítószámok száma",
  allPostalCodes.length,
  SPEC.reduce((n, s) => n + s.codes.length, 0),
);

/* ─────── 2. Sávhatárok: pontosan a felső határ az adott sávba esik ─────── */
section("Sávhatárok — nincs átfedés és nincs rés");

for (const profile of freightProfiles) {
  // Minden sáv felső határa zárt, és a sávok folytonosan követik egymást.
  let prev = 0;
  for (const band of profile.bands) {
    check(`${profile.id}: a ${band.upTo} m³ határ növekvő`, band.upTo > prev);
    const atBoundary = findBand(profile, band.upTo);
    eq(`${profile.id}: ${band.upTo} m³ a saját sávjába esik`, atBoundary?.upTo, band.upTo);
    if (prev > 0) {
      const justAbovePrev = findBand(profile, prev + 1);
      eq(
        `${profile.id}: ${prev + 1} m³ már a következő sávban (${bandLabel(profile, band)})`,
        justAbovePrev?.upTo,
        band.upTo,
      );
      const atPrev = findBand(profile, prev);
      check(`${profile.id}: ${prev} m³ még az előző sávban`, atPrev?.upTo === prev);
    }
    prev = band.upTo;
  }
  // Egész m³ értékekre mindig pontosan egy sáv illeszkedik (a profil korlátjáig).
  for (let m3 = 1; m3 <= profileMaxM3(profile); m3++) {
    const hits = profile.bands.filter((b, i) => {
      const lower = i === 0 ? 0 : profile.bands[i - 1].upTo;
      return m3 > lower && m3 <= b.upTo;
    });
    eq(`${profile.id} @ ${m3} m³ — pontosan egy sáv illeszkedik`, hits.length, 1);
  }
}

/* ─────── 3. XI. kerület: két eltérő díjprofil ─────── */
section("XI. kerület — 1112 és 1118 külön díjprofil");

for (const m3 of [2, 5, 7, 10]) {
  const base = q("1111", m3, 11);
  const special = q("1112", m3, 11);
  const special2 = q("1118", m3, 11);
  eq(`XI. alap @ ${m3} m³`, base.kind, "ok");
  eq(`XI. 1112 @ ${m3} m³`, special.kind, "ok");
  if (base.kind === "ok" && special.kind === "ok" && special2.kind === "ok") {
    eq(`1112 és 1118 azonos díj @ ${m3} m³`, special.netFee, special2.netFee);
    if (m3 === 2 || m3 === 7 || m3 === 10) {
      check(
        `@ ${m3} m³ az 1112/1118 díja ELTÉR az alaptól (${special.netFee} ≠ ${base.netFee})`,
        special.netFee !== base.netFee,
      );
    } else {
      eq(`@ ${m3} m³ a 2–5 sávban egyezik`, special.netFee, base.netFee);
    }
  }
}

/* ─────── 4. Kerület / irányítószám eltérés ─────── */
section("Kerület és irányítószám eltérése");

const mismatch = q("1221", 5, 11); // XXII. kód, XI. kerület kiválasztva
eq("XI. kerület + 1221 → eltérés", mismatch.kind, "mismatch");
if (mismatch.kind === "mismatch") {
  eq("az eltérés jelzi a tényleges profilt", mismatch.actual?.districtId, 22);
  check(
    "az eltérés felsorolja a választáshoz tartozó érvényes kódokat",
    mismatch.expectedCodes.includes("1111") && mismatch.expectedCodes.includes("1112"),
  );
  check(
    "eltérésnél NINCS automatikusan választott díj",
    !("netFee" in mismatch),
  );
}

const erdMismatch = q("1221", 5, null, "erd");
eq("Érd + budapesti kód → eltérés", erdMismatch.kind, "mismatch");

const bpWithErdCode = q("2030", 5, 22);
eq("XXII. kerület + 2030 → eltérés", bpWithErdCode.kind, "mismatch");

/* ─────── 5. Ismeretlen / hibás irányítószám ─────── */
section("Ismeretlen és hibás irányítószám");

for (const code of ["9999", "1234", "1206", "1230", "2040"]) {
  const r = q(code, 5, null, "erd");
  check(
    `${code} nem támogatott (kind=${r.kind})`,
    r.kind === "mismatch" || r.kind === "unsupported-postal",
  );
  check(`${code} esetén nincs díj`, !("netFee" in r));
}
eq("hiányzó irányítószám → hiányos bemenet", q("", 5, 22).kind, "incomplete");
eq(
  "hiányzó irányítószám mezője",
  q("", 5, 22).kind === "incomplete" ? q("", 5, 22).missing : null,
  "postalCode",
);
eq("hiányzó kerület → hiányos bemenet", q("1221", 5, null, "budapest").kind, "incomplete");
eq("két számjegy → érvénytelen alak", q("12", 5, 22).kind, "invalid-postal");
check("1-2-3 számjegy nem négyjegyű alak", !isPostalCodeShape("122"));
eq("szóköz és kötőjel kiszűrése", normalizePostalCode(" 1 2-2 1 "), "1221");

/* ─────── 6. Hiányzó nagyobb tarifa: I., V., VI., VII. kerület ─────── */
section("Hiányzó nagyobb tarifa — egyedi egyeztetés");

const LIMITS = { 1: 8, 5: 5, 6: 7, 7: 7 };
for (const [district, maxM3] of Object.entries(LIMITS)) {
  const d = Number(district);
  const code = SPEC.find((s) => s.d === d).codes[0];
  const atMax = q(code, maxM3, d);
  eq(`${romanDistrict(d)} kerület @ ${maxM3} m³ még árazott`, atMax.kind, "ok");

  const above = q(code, maxM3 + 1, d);
  eq(`${romanDistrict(d)} kerület @ ${maxM3 + 1} m³ → egyedi egyeztetés`, above.kind, "quote-required");
  if (above.kind === "quote-required") {
    eq(`${romanDistrict(d)} kerület korlátja`, above.profileMaxM3, maxM3);
    eq(`${romanDistrict(d)} kerület indoka`, above.reason, "above-profile");
  }
  // A 10 m³-ig minden további mennyiség is egyedi egyeztetés (nincs kitalált ár).
  for (let m3 = maxM3 + 1; m3 <= SINGLE_TRIP_MAX_M3; m3++) {
    check(`${romanDistrict(d)} @ ${m3} m³ nem ad árat`, q(code, m3, d).kind === "quote-required");
  }
}

/* ─────── 7. 10 m³ feletti mennyiség ─────── */
section("10 m³ feletti mennyiség");

for (const code of ["1221", "1111", "2030", "1011"]) {
  const r = q(code, SINGLE_TRIP_MAX_M3 + 1, code === "2030" ? null : Number(code.slice(1, 3)) || 22);
  eq(`${code} @ ${SINGLE_TRIP_MAX_M3 + 1} m³ → egyedi ajánlat`, r.kind, "quote-required");
  if (r.kind === "quote-required") {
    eq(`${code}: az ok az egyfuvaros korlát`, r.reason, "above-single-trip");
  }
}

/* ─────── 8. Csepel (XXI.) ismét támogatott, Érd külön település ─────── */
section("Csepel és Érd");

for (const code of ["1211", "1212", "1213", "1214", "1215"]) {
  const r = q(code, 7, 21);
  eq(`Csepel ${code} @ 7 m³ támogatott`, r.kind, "ok");
  if (r.kind === "ok") eq(`Csepel ${code} @ 7 m³ díja`, r.netFee, 40000);
}

for (const code of ["2030", "2049"]) {
  const r = q(code, 10, null, "erd");
  eq(`Érd ${code} @ 10 m³`, r.kind, "ok");
  if (r.kind === "ok") eq(`Érd ${code} @ 10 m³ díja`, r.netFee, 55000);
}
check(
  "Érd önálló díjprofil (nem budapesti)",
  freightProfiles.some((p) => p.id === "erd" && p.municipalityId === "erd"),
);

/* ─────── 9. Lefedettség és Vár-logika ─────── */
section("Lefedettség és Vár");

eq("Budapest mind a 23 kerülete választható", budapestDistricts.length, 23);
deepEq(
  "a kerületek sorban 1–23",
  budapestDistricts.map((d) => d.id),
  Array.from({ length: 23 }, (_, i) => i + 1),
);
eq("díjprofilok száma (23 kerület + XI. külön + Érd)", freightProfiles.length, 25);

eq("I. kerület a Vár kerülete", CASTLE_DISTRICT_ID, 1);
check("I. kerület + igen → engedély-egyeztetés", needsCastleClearance(1, "igen"));
check("I. kerület + nem tudom → engedély-egyeztetés", needsCastleClearance(1, "nem-tudom"));
check("I. kerület + válasz nélkül → engedély-egyeztetés", needsCastleClearance(1, ""));
check("I. kerület + nem → nincs külön egyeztetés", !needsCastleClearance(1, "nem"));
check("más kerületben nincs Vár-egyeztetés", !needsCastleClearance(5, "igen"));
check("Érdnél (nincs kerület) nincs Vár-egyeztetés", !needsCastleClearance(null, "igen"));

/* ─────── 10. Nincs feltételezett irányítószám ─────── */
section("Nincs feltételezésből felvett irányítószám");

const SPEC_CODES = new Set(SPEC.flatMap((s) => s.codes));
for (const code of allPostalCodes) {
  check(`${code} a jóváhagyott listából származik`, SPEC_CODES.has(code));
}
// A XXIII. kerületnél szándékosan csak 1237–1239 szerepel (nem 1231–1239).
for (const notListed of ["1231", "1232", "1233", "1234", "1235", "1236"]) {
  eq(`${notListed} nincs felvéve`, findProfileByPostalCode(notListed), undefined);
}

finish("freight.test.mjs");
