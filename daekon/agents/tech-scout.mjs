#!/usr/bin/env node
/**
 * Tech-scout radar — a daekon/tech-registry.json áttekintése + annak
 * ellenőrzése, hogy a „live" technológiák tényleg megjelennek-e az exportban.
 * Eredmény a daekon/memory/tech-scout.md-be íródik.
 */
import { readdirSync, readFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REGISTRY = join(ROOT, "daekon", "tech-registry.json");
const MEMORY = join(ROOT, "daekon", "memory", "tech-scout.md");

if (!existsSync(REGISTRY)) {
  console.error("Hiányzik daekon/tech-registry.json");
  process.exit(0);
}
const { live, candidates, rejected } = JSON.parse(readFileSync(REGISTRY, "utf8"));

// élő-ellenőrzés: az export CSS/HTML tartalmazza-e a tech-markert
const checks = [
  { id: "space-grotesk", probe: () => existsSync(join(ROOT, "out")) && readdirSync(join(ROOT, "out", "_next", "static", "media")).some((f) => f.endsWith(".woff2")) },
  { id: "css-scroll-driven-motion", probe: () => { try { return readFileSync(join(ROOT, "out", "_next", "static", "css").length ? readdirSync(join(ROOT, "out", "_next", "static", "css")).map((f) => join(ROOT, "out", "_next", "static", "css", f))[0] : "", "utf8").includes("animation-timeline"); } catch { return false; } } },
  { id: "gzip-harness", probe: () => existsSync(join(ROOT, "out", "index.html.gz")) },
  { id: "pwa-lite", probe: () => existsSync(join(ROOT, "out", "manifest.webmanifest")) },
  { id: "llms-txt", probe: () => existsSync(join(ROOT, "out", "llms.txt")) },
];

console.log(`Tech-registry: ${live.length} live, ${candidates.length} candidate, ${rejected.length} rejected`);
for (const check of checks) {
  const ok = check.probe();
  console.log(`  ${ok ? "✓" : "✗"} live: ${check.id}${ok ? "" : " — NEM található az exportban!"}`);
}
console.log("Jelöltek (bővítési ötletek):");
for (const c of candidates) console.log(`  · ${c.id}: ${c.what} — ${c.why} (effort ${c.effort}, kockázat: ${c.risk})`);

appendFileSync(
  MEMORY,
  `- ${new Date().toISOString().slice(0, 16).replace("T", " ")} radar: ${live.length} live (${checks.filter((c) => c.probe()).length}/${checks.length} ellenőrzött él), ${candidates.length} jelölt\n`,
);
process.exit(0);
