#!/usr/bin/env node
/**
 * Error-analyst executor — a daekon/runs/*.json kapu-rekordokból és a LOG.md-ből
 * ismétlődő mintákat keres; szabály-jelölteket ír a daekon/memory/error-analyst.md-be.
 */
import { readdirSync, readFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const RUNS = join(process.cwd(), "daekon", "runs");
const LOG = join(process.cwd(), "daekon", "LOG.md");
const MEMORY = join(process.cwd(), "daekon", "memory", "error-analyst.md");

const gateStats = {};
let runCount = 0;
let failCount = 0;
const failedGates = new Map();

if (existsSync(RUNS)) {
  for (const file of readdirSync(RUNS).sort()) {
    if (!file.endsWith(".json")) continue;
    try {
      const run = JSON.parse(readFileSync(join(RUNS, file), "utf8"));
      runCount++;
      if (run.verdict !== "PASS") failCount++;
      for (const gate of run.gates ?? []) {
        gateStats[gate.id] = (gateStats[gate.id] ?? 0) + 1;
        if (gate.status !== "PASS") {
          failedGates.set(gate.id, (failedGates.get(gate.id) ?? 0) + 1);
        }
      }
    } catch {
      // sérült rekord — átlépjük
    }
  }
}

console.log(`Futási rekordok: ${runCount}, nem-PASS verdict: ${failCount}`);
if (failedGates.size > 0) {
  console.log("Kapuk, amelyek legalább egyszer nem PASS-oltak:");
  for (const [id, n] of failedGates) console.log(`  ${id}: ${n}×`);
} else {
  console.log("Minden kapu minden futásban PASS volt.");
}

const patterns = [];
if (existsSync(LOG)) {
  const log = readFileSync(LOG, "utf8");
  if (/gate-og/.test(log)) patterns.push("OG-kártya-változás rendszeresen megállítja a buildet — ez a kapu működése; átvizetés (og:gallery) után mindig og:hash:update következik.");
  if (failCount > 0) patterns.push("Volt nem-PASS futás — a javítás után mindig teljes lánc fut újra, részfuttatás nem elfogadható.");
}

// Memória-higiénia (2026-10-03 rendszer-audit): csak akkor fűzünk új elemzési sort,
// ha a futásszám VAGY a mintakészlet ténylegesen változott — a korábbi viselkedés
// minden futáskor duplikált sort írt (56× azonos sor a memóriában).
const analysisLine = `- ${new Date().toISOString().slice(0, 16).replace("T", " ")} elemzés: ${runCount} futás, ${failCount} nem-PASS${patterns.length ? `; szabály-jelöltek: ${patterns.join(" | ")}` : "; nincs új minta"}`;
const memoryNow = existsSync(MEMORY) ? readFileSync(MEMORY, "utf8") : "";
const lastAnalysis = memoryNow.split("\n").filter((line) => line.includes("elemzés:")).at(-1) ?? "";
if (analysisLine.replace(/^\- [0-9: -]+ /, "") !== lastAnalysis.replace(/^\- [0-9: -]+ /, "")) {
  appendFileSync(MEMORY, `${analysisLine}\n`);
  console.log("Új elemzés a memóriába írva (változás észlelve).");
} else {
  console.log("Elemzés változatlan a legutóbbihoz — memória nem bővül (higiénia).");
}
process.exit(0);
