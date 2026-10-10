// LCP-fázis diagnosztika — használat: node scripts/lh-diag.mjs <json-path>
import { readFileSync } from "node:fs";

const r = JSON.parse(readFileSync(process.argv[2], "utf8"));
const a = r.audits;

const br = a["lcp-breakdown-insight"]?.details?.items?.[0]?.items;
if (br) {
  console.log("LCP-fázisok:");
  for (const i of br) console.log(`  ${i.subpart}: ${Math.round(i.duration)} ms`);
}

const node = a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node;
console.log("LCP elem:", node?.selector ?? "?");

const tr = a["network-requests"]?.details?.items || [];
console.log(`Kérések: ${tr.length}, össz átvitel: ${tr.reduce((s, i) => s + (i.transferSize || 0), 0)} B`);
const top = [...tr]
  .sort((x, y) => (y.transferSize || 0) - (x.transferSize || 0))
  .slice(0, 6)
  .map((i) => `${i.resourceType} ${i.transferSize}B ${String(i.url).slice(0, 70)}`);
for (const t of top) console.log("  ", t);
