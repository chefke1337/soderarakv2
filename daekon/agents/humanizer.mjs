#!/usr/bin/env node
/**
 * Humanizer executor — AI-es/zsargon szövegek felmérése és cseréje emberi,
 * SEO-barát megfogalmazásra a daekon/humanizer-lexikon.json alapján.
 *
 *   node daekon/agents/humanizer.mjs           → scan: találatok fájlonként
 *   node daekon/agents/humanizer.mjs --apply   → csere a lexikon szerint
 *
 * Csere után MINDIG build + kapulánc következik (a nyelvtani finomságot az
 * agent olvassa át a diffben — a lexikon a biztonságos 1:1 frázisokat tartalmazza).
 */
import { readdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const LEXIKON = join(ROOT, "daekon", "humanizer-lexikon.json");
const MEMORY = join(ROOT, "daekon", "memory", "humanizer.md");
const APPLY = process.argv.includes("--apply");
const SCANNED_DIRS = ["src"];
const SCANNED_FILES = ["public/llms.txt"];

const { replacements, aiTics } = JSON.parse(readFileSync(LEXIKON, "utf8"));
const sorted = [...replacements].sort((a, b) => b.from.length - a.from.length);

function walk(dir, exts, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, files);
    else if (exts.some((e) => entry.name.endsWith(e))) files.push(full);
  }
  return files;
}

const targets = [
  ...SCANNED_DIRS.flatMap((d) => walk(join(ROOT, d), [".ts", ".tsx", ".css"])),
  ...SCANNED_FILES.map((f) => join(ROOT, f)),
];

let total = 0;
const perPhrase = {};
const ticHits = [];

for (const file of targets) {
  let text = readFileSync(file, "utf8");
  let fileChanges = 0;
  for (const { from, to } of sorted) {
    let idx = text.indexOf(from);
    let count = 0;
    while (idx !== -1) {
      count++;
      if (APPLY) text = text.slice(0, idx) + to + text.slice(idx + from.length);
      idx = text.indexOf(from, APPLY ? idx + to.length : idx + from.length);
    }
    if (count > 0) {
      perPhrase[from] = (perPhrase[from] ?? 0) + count;
      total += count;
      fileChanges += count;
    }
  }
  for (const tic of aiTics) {
    const re = new RegExp(tic, "gi");
    const m = text.match(re);
    if (m) ticHits.push(`${relative(ROOT, file).split(sep).join("/")}: „${tic}" ×${m.length}`);
  }
  if (APPLY && fileChanges > 0) writeFileSync(file, text);
}

const mode = APPLY ? "CSERE" : "SCAN";
console.log(`Humanizer ${mode}: ${total} lexikon-találat, ${ticHits.length} AI-tik jelzés`);
for (const [from, n] of Object.entries(perPhrase).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n}× „${from}"${APPLY ? "" : " → cseréhez: --apply"}`);
}
for (const t of ticHits.slice(0, 10)) console.log(`  TIK ${t}`);

appendFileSync(
  MEMORY,
  `- ${new Date().toISOString().slice(0, 16).replace("T", " ")} ${mode}: ${total} találat${APPLY ? " lecserélve" : ""}, ${ticHits.length} AI-tik\n`,
);
process.exit(0);
