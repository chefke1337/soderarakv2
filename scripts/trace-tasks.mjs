#!/usr/bin/env node
/**
 * Trace-diag: a Lighthouse trace hosszú (>50 ms) főszál-taskjait bontja fel
 * eseménynevek szerint, hogy látszódjon, miből áll (parse / style / layout /
 * script). Használat:
 *   node scripts/trace-tasks.mjs .lh-home.trace.json [minDurMs]
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
const minDur = Number(process.argv[3] ?? 50);
if (!file) {
  console.error("használat: node scripts/trace-tasks.mjs <trace.json> [minDurMs]");
  process.exit(1);
}
const raw = JSON.parse(readFileSync(file, "utf8"));
const events = Array.isArray(raw) ? raw : raw.traceEvents ?? [];
if (!events.length) {
  console.error("nincs traceEvents a fájlban");
  process.exit(1);
}

// Főszál (CrRendererMain) meghatározása a thread_name eseményekből.
const mainTid = new Set();
for (const e of events) {
  if (e.name === "thread_name" && e.args?.name === "CrRendererMain") {
    mainTid.add(`${e.pid}:${e.tid}`);
  }
}

const toplevel = events.filter(
  (e) =>
    e.name === "RunTask" &&
    mainTid.has(`${e.pid}:${e.tid}`) &&
    (e.dur ?? 0) >= minDur * 1000,
);
const childrenOf = (task) =>
  events.filter(
    (e) =>
      e !== task &&
      e.pid === task.pid &&
      e.tid === task.tid &&
      e.ts >= task.ts &&
      e.ts + (e.dur ?? 0) <= task.ts + task.dur &&
      e.dur > 0 &&
      e.name !== "RunTask",
  );

console.log(`Hosszú taskok (> ${minDur} ms), össz: ${toplevel.length}`);
for (const task of toplevel.sort((a, b) => a.ts - b.ts)) {
  const durMs = (task.dur / 1000).toFixed(1);
  // Közvetlen gyerekek: a taskon belüli események, amelyeket nem fed le egy
  // másik taskon belüli testvérük — így a kompozíció duplikációmentes.
  const kids = childrenOf(task).sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  const direct = [];
  for (const e of kids) {
    const end = e.ts + e.dur;
    const covered = direct.some((d) => e.ts >= d.ts && end <= d.ts + d.dur);
    if (!covered) direct.push(e);
  }
  const byName = new Map();
  for (const e of direct) {
    byName.set(e.name, (byName.get(e.name) ?? 0) + e.dur);
  }
  const top = [...byName.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([n, d]) => `${n} ${(d / 1000).toFixed(0)}ms`)
    .join(", ");
  const t = ((task.ts - events[0].ts) / 1000).toFixed(0);
  console.log(`\nRunTask @${t}ms kezdés, ${durMs} ms`);
  console.log(`  ${top}`);
}
