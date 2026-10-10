#!/usr/bin/env node
/**
 * CTA-pozíciós térkép: minden exportált route-on, 360px (mobil) és 1280px
 * (asztal) nézetben megméri, hogy az egyes CTA-k (tel:, mailto:, /arkalkulator,
 * anyag-link) MELYIK scroll_depth percent-sávnál jelennek meg először.
 *
 * Az eredmény (out/.cta-map.json + stdout) a scroll_depth × route adat közvetlen
 * vetítéséhez kell (metrics-plan §12): GA4-ben olvasod a percent-bucket bontást,
 * és e térkép mondja meg, mely CTA annál a sávnál él.
 *
 * Módszertani tanulságok betartása (mobile-auditor/error-analyst memória):
 *  - cv-auto override: ideiglenes style, content-visibility: visible — szinkron
 *    getBoundingClientRect, görgetés NÉLKÜL (a setTimeout-throttling csapda elkerülve).
 *  - NINCS `node script | head -1` (EPIPE) — az exit-kód a teljes futásé.
 *  - Egy fix szerver az egész futásra (nincs per-route restart).
 *
 * Futtatás: node scripts/cta-position-map.mjs   (build után)
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { chromium } from "playwright";

const OUT = resolve("out");
const VIEWPORTS = [
  { name: "mobil", width: 360, height: 800 },
  { name: "asztal", width: 1280, height: 800 },
];
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".webp": "image/webp",
  ".xml": "application/xml",
};

if (!existsSync(OUT)) {
  console.error("Nincs out/ — előbb: npm run build");
  process.exit(1);
}

function walkHtml(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const file = join(dir, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) walkHtml(file, files);
    else if (file.endsWith(".html")) files.push(file);
  }
  return files;
}

const routes = walkHtml(OUT).map((file) => {
  const rel = relative(OUT, file).split(sep).join("/");
  const route = rel === "index.html" ? "/" : rel.endsWith("/index.html")
    ? `/${rel.slice(0, -"index.html".length)}`
    : `/${rel.slice(0, -".html".length)}`;
  return { route, file };
});

const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  let file = join(OUT, p);
  let body = existsSync(file) && statSync(file).isFile() ? readFileSync(file) : null;
  if (body === null && !extname(file)) {
    file = join(OUT, p, "index.html");
    body = existsSync(file) ? readFileSync(file) : null;
  }
  if (body === null) {
    file = join(OUT, "404.html");
    body = readFileSync(file);
  }
  res.writeHead(200, { "content-type": MIME_TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(body);
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

const browser = await chromium.launch();
const map = {};

/** CTA-osztályozás: href-ből a metrics-plan-regiónak megfelelő címke. */
function ctaKind(href) {
  if (href.startsWith("tel:")) return "tel";
  if (href.startsWith("mailto:")) return "mailto";
  if (href === "/arkalkulator" || href.startsWith("/arkalkulator#")) return "kalkulator";
  if (href.startsWith("/anyagok/")) return "anyag";
  return null;
}

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  for (const { route, file } of routes) {
    await page.goto(`${base}${route}`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const data = await page.evaluate(() => {
      // cv-auto override: minden szekció valódi magassága látszik görgetés nélkül
      const st = document.createElement("style");
      st.textContent = ".cv-auto { content-visibility: visible !important; contain-intrinsic-size: auto none !important; }";
      document.head.appendChild(st);
      const se = document.scrollingElement;
      const scrollable = se ? se.scrollHeight - window.innerHeight : 0;
      const pct = (y) => (scrollable <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((y / scrollable) * 100))));
      const docH = se ? se.scrollHeight : 0;

      // Régió-feloldás: a legközelebbi data-call-region ős (analytics.ts mintája)
      const regionOf = (el) => el.closest("[data-call-region]")?.getAttribute("data-call-region") ?? null;

      // 1) FIX / STICKY CTA-k: bármely sávnál élnek (mobile_call_bar, kompakt fejléc-gomb).
      // A fixed/sticky lehet az <a> ősén is (MobileCallBar-wrapper, sticky fejléc) —
      // ezért ős-ellenőrzés (a rejtett csúcsot a getComputedStyle display kezeli).
      const isFixedish = (el) => {
        for (let n = el, i = 0; n && n !== document.body && i < 6; n = n.parentElement, i++) {
          const pos = getComputedStyle(n).position;
          // A display:none ős alatt a gyerek computed display-je VÁLTOZATLAN marad —
          // a tényleges render-állapotot a getClientRects() mutatja (0 = nincs renderelve).
          if (pos === "fixed" || pos === "sticky") return el.getClientRects().length > 0;
        }
        return false;
      };
      const fixed = new Map();
      for (const a of document.querySelectorAll("a[href]")) {
        if (!isFixedish(a)) continue;
        const href = a.getAttribute("href") ?? "";
        const kind = href.startsWith("tel:") ? "tel" : href.startsWith("mailto:") ? "mailto" : null;
        if (!kind) continue;
        const region = regionOf(a) ?? "unknown";
        fixed.set(`${kind}@${region}`, true);
      }

      // 2) FLOW CTA-k: first-seen scrollY = (top+height) − viewportH  → percent
      const seen = new Map();
      const record = (a) => {
        const kind = (() => {
          const h = a.getAttribute("href") ?? "";
          if (h.startsWith("tel:")) return "tel";
          if (h.startsWith("mailto:")) return "mailto";
          if (h === "/arkalkulator" || h.startsWith("/arkalkulator#")) return "kalkulator";
          if (h.startsWith("/anyagok/")) return "anyag";
          return null;
        })();
        if (!kind) return;
        const r = a.getBoundingClientRect();
        if (r.height === 0 && r.width === 0) return; // rejtett (pl. mobilon sm:hidden gomb)
        const region = regionOf(a) ?? "unknown";
        const key = `${kind}@${region}`;
        const firstSeenY = r.top + window.scrollY + r.height - window.innerHeight; // alja teljesen látszik
        const p = Math.max(0, pct(firstSeenY));
        if (!seen.has(key) || p < seen.get(key).p) seen.set(key, { p, y: Math.round(firstSeenY) });
      };
      for (const a of document.querySelectorAll("main a[href], footer a[href]")) record(a);
      return {
        docHeight: docH,
        scrollable,
        fixed: [...fixed.keys()],
        flow: [...seen.entries()].map(([key, v]) => ({ cta: key, firstSeenPercent: v.p, firstSeenY: v.y })),
      };
    });
    map[`${vp.name}|${route}`] = data;
  }
  await context.close();
}

await browser.close();
server.close();

// 404.html-t a szerver-fallback eltakarta: a routes-lista 404 bejegyzése ugyanúgy mért, jó.
// Az artifact a gitignore-olt runs/ alá megy — NEM az out/BA, mert az deploy-csomagba kerülne.
const outPath = join("daekon", "runs", "cta-map-latest.json");
writeFileSync(outPath, JSON.stringify({ measuredAt: new Date().toISOString(), map }, null, 1));

// Stdout: kompakt tábla percent-sávokra kerekítve (25/50/75/90/100 a legkisebb élő sáv)
const bucketOf = (p) => (p <= 25 ? 25 : p <= 50 ? 50 : p <= 75 ? 75 : p <= 90 ? 90 : 100);
const lines = [];
for (const [key, data] of Object.entries(map)) {
  const [vp, route] = key.split("|");
  const entries = [];
  for (const f of data.fixed) entries.push(`${f}:FIXED`);
  for (const f of data.flow) entries.push(`${f.cta}:sáv${bucketOf(f.firstSeenPercent)} (${f.firstSeenPercent}%)`);
  lines.push(`[${vp}] ${route}  (docH=${data.docHeight})\n  ${entries.length ? entries.join("\n  ") : "—"}`);
}
console.log(lines.join("\n"));
console.log(`\nTérkép: ${outPath}`);
