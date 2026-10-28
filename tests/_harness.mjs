/**
 * Minimalista teszt-futtató (nincs új függőség).
 * Futtatás: node --experimental-strip-types tests/<name>.test.mjs
 */

let passed = 0;
let failed = 0;
const failures = [];

export function check(label, cond) {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(label);
  }
  console.log(`${cond ? "OK  " : "FAIL"} ${label}`);
}

export function eq(label, actual, expected) {
  const ok = Object.is(actual, expected);
  check(`${label} — kapott: ${format(actual)}${ok ? "" : `, várt: ${format(expected)}`}`, ok);
}

export function deepEq(label, actual, expected) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  check(`${label}${a === b ? "" : ` — kapott: ${a}, várt: ${b}`}`, a === b);
}

function format(v) {
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
}

export function section(title) {
  console.log(`\n── ${title} ──`);
}

export function finish(suiteName) {
  console.log(`\n${suiteName}: ${passed} OK, ${failed} FAIL (összesen ${passed + failed})`);
  if (failed) {
    console.log("\nHIBÁK:");
    for (const f of failures) console.log(`  - ${f}`);
  }
  process.exit(failed ? 1 : 0);
}
