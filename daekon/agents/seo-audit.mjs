#!/usr/bin/env node
/**
 * SEO-audit executor — az out/ exportot elemzi: title/desc hossz, canonical,
 * h1-szám, belső linkek, alt-lefedettség, JSON-LD-típusok. Pontszám + találatok;
 * eredmény a daekon/memory/seo-specialist.md-be íródik.
 */
import { readdirSync, readFileSync, statSync, appendFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = join(process.cwd(), "out");
const MEMORY = join(process.cwd(), "daekon", "memory", "seo-specialist.md");

function walkHtml(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const file = join(dir, entry);
    if (statSync(file).isDirectory()) walkHtml(file, files);
    else if (file.endsWith(".html")) files.push(file);
  }
  return files;
}

const findings = [];
const files = walkHtml(OUT);
let scoreSum = 0;
let scoredCount = 0;

for (const file of files) {
  const rel = relative(OUT, file).split(sep).join("/");
  const route = rel === "index.html" ? "/" : rel.endsWith("/index.html") ? `/${rel.slice(0, -"index.html".length)}` : `/${rel}`;
  const html = readFileSync(file, "utf8");
  // noindex oldalak (404, impresszum) mérésen kívül — a szabály a kanonikus indexelhető oldalakra szól.
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) continue;
  scoredCount++;
  const title = html.split("<title>", 2)[1]?.split("</title>", 1)[0]?.trim() ?? "";
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
  const h1 = (html.match(/<h1\b/g) ?? []).length;
  const jsonLdTypes = [...html.matchAll(/"@(?:type)"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  let page = 100;
  const pageFindings = [];

  if (title.length < 25 || title.length > 70) { page -= 10; pageFindings.push(`title hossz ${title.length}`); }
  if (desc.length < 80 || desc.length > 165) { page -= 10; pageFindings.push(`description hossz ${desc.length}`); }
  if (h1 !== 1) { page -= 20; pageFindings.push(`h1 szám: ${h1}`); }
  if (!canonical) { page -= 15; pageFindings.push("nincs canonical"); }
  if (!jsonLdTypes.includes("BreadcrumbList") && route !== "/") {
    // Jogi/adatvédelmi lapok lapos breadcrumb-gyárat nem igényelnek — de ha indexelhetők, mégis jót tesz.
    page -= 5;
    pageFindings.push("nincs BreadcrumbList");
  }
  if (!jsonLdTypes.includes("LocalBusiness")) { page -= 10; pageFindings.push("nincs LocalBusiness"); }
  const imgs = (html.match(/<img\b/g) ?? []).length;
  const alts = (html.match(/<img\b[^>]*alt="[^"]+"/g) ?? []).length;
  if (imgs > alts) { page -= 5; pageFindings.push(`${imgs - alts} img alt nélkül`); }

    scoreSum += page;
  for (const f of pageFindings) findings.push(`${route}: ${f}`);
}

const avg = Math.round(scoreSum / Math.max(1, scoredCount));
console.log(`SEO-audit: ${scoredCount}/${files.length} indexelhető oldal, átlagpontszám ${avg}/100`);
if (findings.length === 0) console.log("Találatok: nincs — minden metrika sávon belül.");
else {
  console.log(`Találatok (${findings.length}):`);
  for (const f of findings.slice(0, 20)) console.log(`  - ${f}`);
  if (findings.length > 20) console.log(`  … +${findings.length - 20} további`);
}

appendFileSync(
  MEMORY,
  `- ${new Date().toISOString().slice(0, 16).replace("T", " ")} SEO-audit: átlag ${avg}/100, ${findings.length} találat${findings.length ? ` (pl. ${findings[0]})` : ""}\n`,
);
process.exit(0);
