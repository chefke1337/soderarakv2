/**
 * Árazás-konzisztencia: anyagárak, kategóriánkénti induló ár, kiszolgált
 * települések és a mennyiségi fuvardíj-sávok. A site.ts TypeScript, ezért
 * Node ≥ 22.6 kell: `node --experimental-strip-types tests/pricing.test.mjs`
 * (npm run test:pricing). Nem módosít adatot; csak jelent.
 */
import {
  EXAMPLE_CALC,
  findFreightTier,
  MAX_ORDER_VOLUME,
  materialGroups,
  MIN_ORDER_VOLUME,
  settlements,
  zones,
} from "../src/content/site.ts";

let failed = 0;
function check(label, cond) {
  console.log(`${cond ? "OK  " : "FAIL"} ${label}`);
  if (!cond) failed++;
}

// ── Minden termékváltozat ára valós szám vagy explicit null (egyeztetés után) ──
for (const g of materialGroups) {
  for (const i of g.items) {
    check(
      `anyagár ${g.slug}/${i.slug}: ${i.priceNet === null ? "egyeztetés után" : i.priceNet}`,
      i.priceNet === null || (typeof i.priceNet === "number" && i.priceNet > 0),
    );
  }
}

// ── Kategóriánkénti induló ár: a legolcsóbb tétel ára ──
for (const g of materialGroups) {
  const priced = g.items.map((i) => i.priceNet).filter((p) => p !== null);
  const min = priced.length ? Math.min(...priced) : null;
  check(`${g.slug} induló ár kiszámítható: ${min ?? "egyeztetés után"}`, min !== null);
}

// ── Csepel, Szigetszentmiklós, Halásztelek nem választható település ──
for (const removed of ["csepel", "szigetszentmiklos", "halasztelek"]) {
  check(`${removed} nincs a settlements listában`, !settlements.some((s) => s.slug === removed));
}

// ── Zónánként pontosan a jóváhagyott települések vannak ──
const EXPECTED_BY_ZONE = {
  mag: ["budafok", "budateteny", "nagyteteny", "budapest-22-kerulet", "albertfalva", "ujbuda-budapest-11-kerulet"],
  kozel: ["erd", "diosd", "torokbalint"],
  tavolabbi: ["tarnok", "soskut", "pusztazamor"],
};
for (const [zoneId, expected] of Object.entries(EXPECTED_BY_ZONE)) {
  const actual = settlements.filter((s) => s.zone === zoneId).map((s) => s.slug).sort();
  check(
    `${zoneId} zóna települései: ${actual.join(", ")}`,
    JSON.stringify(actual) === JSON.stringify([...expected].sort()),
  );
}

// ── Fuvar sávhatárok minden zónában: 1–20 m³ folytonosan, rés/átfedés nélkül ──
for (const z of zones) {
  const tiers = [...z.freightTiers].sort((a, b) => a.minQty - b.minQty);
  check(`${z.id}: első sáv ${MIN_ORDER_VOLUME} m³-től indul`, tiers[0].minQty === MIN_ORDER_VOLUME);
  check(`${z.id}: utolsó sáv ${MAX_ORDER_VOLUME} m³-ig tart`, tiers.at(-1).maxQty === MAX_ORDER_VOLUME);
  for (let k = 1; k < tiers.length; k++) {
    check(
      `${z.id}: ${tiers[k - 1].minQty}-${tiers[k - 1].maxQty} → ${tiers[k].minQty}-${tiers[k].maxQty} folytonos (nincs rés/átfedés)`,
      tiers[k].minQty === tiers[k - 1].maxQty + 1,
    );
  }
  check(`${z.id}: pontosan egy egyeztetéses sáv`, tiers.filter((t) => t.needsNegotiation).length === 1);
}

// ── 1, 2, 3, 5, 6, 8, 9, 12, 13, 20 m³ — minden zónában visszaadja a várt sávot ──
const QTY_CASES = [1, 2, 3, 5, 6, 8, 9, 12, 13, 20];
for (const z of zones) {
  for (const qty of QTY_CASES) {
    const tier = findFreightTier(z.id, qty);
    check(
      `${z.id} @ ${qty} m³ → sáv található (${tier ? `${tier.minQty}-${tier.maxQty}, ${tier.fee} Ft${tier.needsNegotiation ? ", egyeztetés" : ""}` : "HIÁNYZIK"})`,
      !!tier && qty >= tier.minQty && qty <= tier.maxQty,
    );
  }
}

// ── 12 m³-es határ: jelenlegi, MEGERŐSÍTÉSRE VÁRÓ alapértelmezés szerint a
// szabványos (9–12 m³) sávba tartozik, az egyeztetéses sáv 13 m³-től indul. ──
for (const z of zones) {
  const at12 = findFreightTier(z.id, 12);
  const at13 = findFreightTier(z.id, 13);
  check(`${z.id} @ 12 m³ → NEM egyeztetéses (megerősítésre vár)`, at12 && !at12.needsNegotiation);
  check(`${z.id} @ 13 m³ → egyeztetéses`, at13 && at13.needsNegotiation);
}

// ── Anyag részösszeg + fuvar = összesen (a közös GYIK/kalkulátor-belépő példa) ──
check(
  `EXAMPLE_CALC: ${EXAMPLE_CALC.qty} × ${EXAMPLE_CALC.material.priceNet} + ${EXAMPLE_CALC.tier.fee} = ${EXAMPLE_CALC.total}`,
  EXAMPLE_CALC.materialTotal + EXAMPLE_CALC.tier.fee === EXAMPLE_CALC.total,
);
check("EXAMPLE_CALC: nincs NaN", Number.isFinite(EXAMPLE_CALC.total));

// ── Tartományon kívüli mennyiség: nincs hamis találat ──
for (const z of zones) {
  check(`${z.id} @ 0 m³ → nincs sáv`, findFreightTier(z.id, 0) === undefined);
  check(`${z.id} @ 21 m³ → nincs sáv`, findFreightTier(z.id, 21) === undefined);
}

process.exit(failed ? 1 : 0);
