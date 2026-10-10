#!/usr/bin/env node
/**
 * Competitor-watch executor — a daekon/competitors.json-ben felsorolt oldalak
 * HTTP-ellenőrzése (status, válaszidő, title). Változásnapló:
 * daekon/competitor-log.md; állapot: daekon/competitor-state.json.
 */
import { existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const LIST = join(process.cwd(), "daekon", "competitors.json");
const STATE = join(process.cwd(), "daekon", "competitor-state.json");
const LOGFILE = join(process.cwd(), "daekon", "competitor-log.md");
const MEMORY = join(process.cwd(), "daekon", "memory", "competitor-analyst.md");

if (!existsSync(LIST)) {
  console.error("Hiányzik daekon/competitors.json");
  process.exit(0);
}
const { competitors } = JSON.parse(readFileSync(LIST, "utf8"));
if (!Array.isArray(competitors) || competitors.length === 0) {
  console.log("Competitor-lista üres — a figyelés kihagyva (a lista bővítése a felhasználó engedélyéhez kötött).");
  process.exit(0);
}

const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
const changes = [];

for (const { name, url } of competitors) {
  const started = Date.now();
  let status = 0, title = "", error = null;
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(10000) });
    status = res.status;
    const html = await res.text();
    title = html.split("<title>", 2)[1]?.split("</title>", 1)[0]?.trim().slice(0, 90) ?? "";
  } catch (e) {
    error = String(e).slice(0, 80);
  }
  const ms = Date.now() - started;
  const prev = state[url];
  if (prev && (prev.title !== title || prev.status !== status)) {
    changes.push(`${name}: ${prev.status}→${status}, title="${prev.title}" → "${title}"`);
  }
  state[url] = { status, title, ms, at: new Date().toISOString() };
  console.log(`${status || "ERR"} ${ms} ms  ${name}${title ? ` — ${title}` : ""}${error ? ` — ${error}` : ""}`);
}

writeFileSync(STATE, `${JSON.stringify(state, null, 2)}\n`);
if (changes.length > 0) {
  appendFileSync(LOGFILE, `- ${new Date().toISOString().slice(0, 16).replace("T", " ")}\n${changes.map((c) => `  - ${c}`).join("\n")}\n`);
  appendFileSync(MEMORY, `- ${new Date().toISOString().slice(0, 16).replace("T", " ")} változás észlelve: ${changes.length} oldal\n`);
  console.log(`Változások: ${changes.length} (naplózva)`);
} else {
  console.log("Nincs változás az előző állapothoz képest.");
}
process.exit(0);
