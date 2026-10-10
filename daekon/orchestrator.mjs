#!/usr/bin/env node
/**
 * DAEKON Agent Orchestrator — futtatható minőségrendszer.
 *
 * A daekon/agents.json-ben definiált kapuláncot hajtja végre:
 *  - blocker kapu FAIL     → verdict FAIL   (exit 1)
 *  - blocker kapu nem futott → verdict NOT_VERIFIED (exit 1) — "a nem elérhető
 *    ellenőrzés NEM VERIFIKÁLT", sosem PASS.
 *  - mind blocker PASS     → verdict PASS   (exit 0); advisory megjegyzésekkel.
 *
 * Kimenet: daekon/daekon-report.md (emberi), daekon/runs/<idő>.json (gép), LOG.md (memória).
 *
 * --fast (npm run daekon:fast): csak a `fast: true` jelölt kapuk (build + og + qa) —
 *  iterációs kör böngészős kapuk NÉLKÜL. Külön riportfájl (daekon-report-fast.md),
 *  hogy a daekon-report.md mindig a legutóbbi TELJES futás eredménye maradjon
 *  (a deploy-checklist arra hivatkozik). A fast futás NEM release-verdict:
 *  release előtt a teljes `npm run daekon` kötelező.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MANIFEST = join(ROOT, "daekon", "agents.json");
const RUNS_DIR = join(ROOT, "daekon", "runs");
const FAST = process.argv.includes("--fast");
const REPORT = join(ROOT, "daekon", FAST ? "daekon-report-fast.md" : "daekon-report.md");
const LOG = join(ROOT, "daekon", "LOG.md");

if (!existsSync(MANIFEST)) {
  console.error(`daekon: hiányzó manifest: ${MANIFEST}`);
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(MANIFEST, "utf8"));

function runCommand(command) {
  return new Promise((resolve) => {
    // Windows/Node≥20: .cmd-fájlok (npm) csak shell-lel spawnolhatók biztonságosan.
    const child = spawn(command, [], { cwd: ROOT, shell: true });
    let stdout = "", stderr = "", timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, 15 * 60 * 1000);
    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, timedOut, error: String(err), stdout, stderr });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, timedOut, code, stdout, stderr });
    });
  });
}

// Párhuzamos futás fix sorkövetési sorrendben (2026-10-03 rendszer-audit):
// a kapuk független export-ellenőrzések, a CPU-kötött böngészősök (a11y/mobile/
// lighthouse) egymást várakoztatják, ha szerial futnak — a Promise.all az idő-
// nyerés, a results tömb sorrendje marad a manifest-sorrend (determinisztikus riport).
async function runAll(items, concurrency) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      const t0 = Date.now();
      const result = await runCommand(items[index].command);
      result.ms = Date.now() - t0;
      results[index] = result;
    }
  });
  await Promise.all(workers);
  return results;
}

// Klasszikus joker-conflict: a build NEM mehet párhuzamosan a saját outputját
// olvasó ellenőrzésekkel — ez mindig szerial, minden más párhuzamos.
const STATIC_FIRST = new Set(["gate-static"]);

function classifyGate(gate, result) {
  if (result.timedOut) return { status: "NOT_VERIFIED", reason: "timeout" };
  if (result.error) return { status: "NOT_VERIFIED", reason: `spawn error: ${result.error.slice(0, 200)}` };
  if (!result.ok) return { status: "FAIL", reason: `exit ${result.code}` };
  if (!result.stdout.trim() && !result.stderr.trim()) {
    return { status: "NOT_VERIFIED", reason: "nincs kimenet — a nem elérhető ellenőrzés NEM VERIFIKÁLT" };
  }
  return { status: "PASS", reason: "exit 0, kimenet rendben" };
}

function extractPerfScores(stdout) {
  const scores = {};
  for (const m of stdout.matchAll(/^(\/[^\s]*) — Performance (\d+)\/100/gm)) {
    scores[m[1]] = Number(m[2]);
  }
  return scores;
}

const results = [];
if (FAST) {
  const fastGates = cfg.gates.filter((g) => g.fast === true);
  if (fastGates.length === 0) {
    // Üres kapu-halmazon átmenő PASS vacuous lenne — a nem ellenőrzött NEM VERIFIKÁLT.
    console.error("daekon:fast — nincs `fast: true` jelölt kapu a daekon/agents.json-ban (manifest-hiba)");
    process.exit(1);
  }
  process.stdout.write(`\n══ DAEKON FAST — gyors kapuk: ${fastGates.map((g) => g.id).join(", ")} (böngészős kapuk + team kihagyva) ══\n`);
  cfg.gates = fastGates;
}
const staticGates = cfg.gates.filter((g) => STATIC_FIRST.has(g.id));
const restGates = cfg.gates.filter((g) => !STATIC_FIRST.has(g.id));
const gateConcurrency = Math.max(1, Number(cfg.policy?.gateConcurrency ?? 3));

for (const gate of staticGates) {
  process.stdout.write(`\n▶ ${gate.id} — ${gate.title}\n`);
  const t0 = Date.now();
  const result = await runCommand(gate.command);
  const ms = Date.now() - t0;
  const verdict = classifyGate(gate, result);
  results.push({ id: gate.id, title: gate.title, risk: gate.risk, command: gate.command, ms, ...verdict, raw: result });
  const icon = verdict.status === "PASS" ? "✓" : verdict.status === "FAIL" ? "✗" : "!";
  console.log(`${icon} ${gate.id}: ${verdict.status} (${verdict.reason}) — ${(ms / 1000).toFixed(1)}s`);
}

if (restGates.length) {
  process.stdout.write(`\n▶ ${restGates.length} kapu párhuzamos futása (${gateConcurrency} szál)\n`);
  const tP = Date.now();
  const restResults = await runAll(restGates, gateConcurrency);
  const wallP = Date.now() - tP;
  restGates.forEach((gate, i) => {
    const verdict = classifyGate(gate, restResults[i]);
    results.push({ id: gate.id, title: gate.title, risk: gate.risk, command: gate.command, ms: restResults[i].ms, ...verdict, raw: restResults[i] });
    const icon = verdict.status === "PASS" ? "✓" : verdict.status === "FAIL" ? "✗" : "!";
    console.log(`${icon} ${gate.id}: ${verdict.status} (${verdict.reason}) — ${((restResults[i].ms ?? 0) / 1000).toFixed(1)}s`);
  });
  console.log(`(párhuzamos blokk: ${(wallP / 1000).toFixed(1)}s wall)`);
}

// Advisory perf-értelmezés
const perfGate = results.find((r) => r.id === "gate-perf");
const perfNotes = [];
if (perfGate?.raw?.stdout) {
  const scores = extractPerfScores(perfGate.raw.stdout);
  for (const [route, score] of Object.entries(scores)) {
    if (score < cfg.quality.minLighthouse) perfNotes.push(`${route}: ${score}/100 (< ${cfg.quality.minLighthouse})`);
  }
  perfGate.scores = scores;
}

// Team executors — tanácsadó futások (nem blocker, de hiányuk látszik a riportban).
// Párhuzamos pool a gateConcurrency-szel azonos szélességben (audit 2026-10-03).
mkdirSync(join(ROOT, "daekon", "memory"), { recursive: true });
const teamResults = [];
if (FAST && cfg.teamExecutors?.length) {
  process.stdout.write(`\n▶ team-executorok: kihagyva (fast mód)\n`);
}
if (!FAST && cfg.teamExecutors?.length) {
  process.stdout.write(`\n▶ ${cfg.teamExecutors.length} team-executor párhuzamos futása\n`);
  const teamRuns = await runAll(cfg.teamExecutors, gateConcurrency);
  cfg.teamExecutors.forEach((executor, i) => {
    const result = teamRuns[i];
    const ok = result.ok && !result.timedOut && !result.error;
    teamResults.push({
      id: executor.id,
      ok,
      output: (result.stdout + result.stderr).trim().split("\n").filter(Boolean).slice(0, 8),
    });
    console.log(`${ok ? "✓" : "!"} team/${executor.id}: ${ok ? "kész" : "NEM FUTOTT (NOT_VERIFIED)"}`);
  });
}

const blockers = results.filter((r) => r.risk === "blocker");
const verdict =
  blockers.length === 0 ? "NOT_VERIFIED" // üres blocker-halmaz sosem PASS (vacuous PASS tilos)
  : blockers.some((r) => r.status === "NOT_VERIFIED") ? "NOT_VERIFIED"
  : blockers.some((r) => r.status === "FAIL") ? "FAIL"
  : blockers.every((r) => r.status === "PASS") ? "PASS"
  : "NOT_VERIFIED";

const now = new Date().toISOString();
mkdirSync(RUNS_DIR, { recursive: true });
const runId = now.replace(/[:.]/g, "-");
  const machineRecord = {
  version: cfg.version, mode: FAST ? "fast" : "full", at: now, verdict,
  gates: results.map(({ id, status, reason, risk, scores, ms }) => ({ id, status, reason, risk, scores, ms })),
  perfNotes,
  team: teamResults.map((t) => ({ id: t.id, ok: t.ok })),
};
writeFileSync(join(RUNS_DIR, `${runId}.json`), `${JSON.stringify(machineRecord, null, 2)}\n`);

const line = (r) => `| ${r.id} | ${r.risk} | ${r.status} | ${r.reason} |`;
const perfSection = perfNotes.length
  ? `\n> ⚠ Advisory teljesítmény-jegyzetek:\n${perfNotes.map((n) => `> - ${n}`).join("\n")}\n`
  : perfGate?.scores ? `\n> Advisory perf: ${Object.entries(perfGate.scores).map(([r, s]) => `${r} ${s}/100`).join(", ")} — minden a küszöb felett.\n` : "";

const report = `# DAEKON futási riport${FAST ? " (FAST)" : ""}

- **Manifest:** DAEKON v${cfg.version} — ${cfg.policy.root}
- **Időpont:** ${now}
- **Mód:** ${FAST
    ? "**FAST** — csak a gyors kapuk (build, og, qa); a böngészős kapuk (a11y, mobile, perf) és a team-executorok NEM futottak. **Ez NEM release-verdict — release előtt teljes \`npm run daekon\` kötelező.**"
    : "teljes lánc (minden manifest-kapu + 5 team-executor)"}
- **Verdict:** **${verdict}**

## Kapu-eredmények

| Kapu | Kockázat | Állapot | Indoklás |
|---|---|---|---|
${results.map(line).join("\n")}${perfSection}

## Team-executorok

${FAST ? "_Kihagyva (fast mód) — a teljes lánc futtatja őket._" : teamResults.map((t) => `### ${t.id} — ${t.ok ? "kész" : "NEM FUTOTT"}\n\n\`\`\`\n${t.output.join("\n")}\n\`\`\``).join("\n\n")}

## Certifier-jegyzet

${verdict === "PASS"
  ? FAST
    ? "A gyors kapuk (build, og, qa) valódi, kimenettel rendelkező futással PASS-olnak. A böngészős kapuk (a11y, mobile, perf) és a team-executorok NEM futottak — release-igazoláshoz a teljes \`npm run daekon\` kell."
    : "Minden blocker kapu valódi, kimenettel rendelkező futással PASS. Az advisory megjegyzések nem buktatnak."
  : verdict === "FAIL"
    ? "Legalább egy blocker kapu FAIL — a release elutasítva. Javítás után a teljes lánc újrafut."
    : "Legalább egy blocker kapu nem futott vagy nem ellenőrizhető. A nem elérhető ellenőrzés NEM VERIFIKÁLT — a release nem igazolható."}
`;
writeFileSync(REPORT, report);

appendFileSync(LOG, `- ${now.slice(0, 16).replace("T", " ")} — verdict: **${verdict}**${FAST ? " *(fast)*" : ""} — ${results.map((r) => `${r.id}:${r.status}`).join(", ")}\n`);

console.log(`\n═══ DAEKON verdict: ${verdict}${FAST ? " — FAST mód (NEM release)" : ""} ═══`);
if (FAST) console.log("Gyors futás: release előtt a teljes lánc kötelező: npm run daekon\n");
console.log(`Riport: ${REPORT}\n`);
process.exit(verdict === "PASS" ? 0 : 1);
