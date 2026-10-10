#!/usr/bin/env node
/**
 * Watch — periodikus export-őr. Háttérmód: node daekon/agents/watch.mjs [perc]
 * Egyszeri ellenőrzés: node daekon/agents/watch.mjs --once
 */
import { existsSync, readFileSync, statSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "out");
const WATCHLOG = join(process.cwd(), "daekon", "watch.log");

function check() {
  const at = new Date().toISOString().slice(0, 19).replace("T", " ");
  const index = join(OUT, "index.html");
  const sitemap = join(OUT, "sitemap.xml");
  if (!existsSync(index)) {
    appendFileSync(WATCHLOG, `${at} HIBA: nincs out/index.html — futtass buildet\n`);
    return;
  }
  const html = readFileSync(index, "utf8");
  const ok = html.includes("</html>") && existsSync(sitemap);
  const sizeKb = Math.round(statSync(index).size / 1024);
  appendFileSync(WATCHLOG, `${at} ${ok ? "OK" : "HIBA"} index.html ${sizeKb} kB, sitemap ${existsSync(sitemap) ? "van" : "HIÁNYZIK"}\n`);
}

if (process.argv.includes("--once")) {
  check();
  console.log("Egyszeri watch-ellenőrzés kész → daekon/watch.log");
  process.exit(0);
}

const minutes = Number(process.argv[2] ?? 10);
console.log(`Watch indítva: ${minutes} percenként (daekon/watch.log). Leállítás: Ctrl+C`);
check();
setInterval(check, minutes * 60 * 1000);
