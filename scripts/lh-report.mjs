// Lighthouse JSON riport — kategória-pontszámok + kulcsmetrikák
// Használat: node scripts/lh-report.mjs <címke> <json-path> [...]
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2) {
  const label = args[i];
  const path = args[i + 1];
  const r = JSON.parse(readFileSync(path, "utf8"));
  const c = r.categories;
  const a = r.audits;
  const perf = Math.round(c.performance.score * 100);
  const a11y = Math.round(c.accessibility.score * 100);
  const bp = Math.round(c["best-practices"].score * 100);
  const seo = Math.round(c.seo.score * 100);
  console.log(
    `${label}: PERF ${perf} | A11Y ${a11y} | BP ${bp} | SEO ${seo} | LCP ${a["largest-contentful-paint"].displayValue} | TBT ${a["total-blocking-time"].displayValue} | CLS ${a["cumulative-layout-shift"].displayValue}`,
  );
}
