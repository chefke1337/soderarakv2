import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

const OUT = resolve("out");
const ROUTES = ["/", "/utmutatok/", "/anyagok/soder/", "/teruletek/erd/"];
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
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

if (!existsSync(OUT)) throw new Error("Missing `out/`; run `npm run build` first.");

// ── Change-gated perf (2026-10-03 rendszer-audit) ──
// A Lighthouse a leghosszabb kapu (~35s / 4 route). Csak akkor fut újra, ha a
// kulcsroute-ok HTML-je, a megosztott CSS/JS vagy a gzip-harness bemenetei
// változtak. TELJES futás: DAEKON_FULL_AUDIT=1.
import { createHash as _createHash } from "node:crypto";
const STATE_FILE = resolve(".daekon-perf-state.json");
const FULL_AUDIT = process.env.DAEKON_FULL_AUDIT === "1";
const perfHash = () => {
  const parts = [];
  for (const route of ROUTES) {
    const rel = route === "/" ? "index.html" : `${route.replace(/^\//, "")}index.html`;
    const file = join(OUT, rel);
    if (existsSync(file)) {
      // buildId-komment + CSS-fájlnév normalizálás (tartalom-semleges) — audit 2026-10-03.
      parts.push(Buffer.from(readFileSync(file, "utf8")
        .replace(/^<!DOCTYPE html>\s*<!--[^>]*-->/, "<!DOCTYPE html>")
        .replace(/\/_next\/static\/css\/[A-Za-z0-9._-]+\.css/g, "_next/static/css/CSS")
        .replace(/(\\?"b\\?":\\?")[A-Za-z0-9_-]{16,45}(\\?")/g, "$1BUILDID$2")));
    }
  }
  const staticDir = join(OUT, "_next", "static");
  if (existsSync(staticDir)) {
    (function walk(dir) {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else {
          // A _next/static/<buildId>/_buildManifest.js + _ssgManifest.js útvonalában
          // a buildId minden buildben új (tartalom azonos) — kizárjuk, különben
          // minden rebuild újrainsztrálja a perf-kaput (audit 2026-10-03).
          if (/_buildManifest\.js(\.gz)?$|_ssgManifest\.js(\.gz)?$/.test(entry)) return;
          parts.push(readFileSync(full));
        }
      }
    })(staticDir);
  }
  return _createHash("sha256").update(Buffer.concat(parts)).digest("hex").slice(0, 16);
};
let prevState = null;
if (!FULL_AUDIT && existsSync(STATE_FILE)) {
  try { prevState = JSON.parse(readFileSync(STATE_FILE, "utf8")).hash ?? null; } catch { prevState = null; }
}
const currentHash = perfHash();
if (!FULL_AUDIT && prevState === currentHash) {
  console.log(`perf: a kulcsroute-ok és a static-eszközök változatlanok — Lighthouse kihagyva (state: ${STATE_FILE}); teljes futás: DAEKON_FULL_AUDIT=1`);
  process.exit(0);
}
console.log(`perf: Lighthouse futtatása ${ROUTES.length} kulcsroute-on${FULL_AUDIT ? " (TELJES)" : prevState ? " (változott eszközök)" : " (első futás)"}...`);

function walkHtml(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const file = join(dir, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) walkHtml(file, files);
    else if (file.endsWith(".html")) files.push(file);
  }
  return files;
}

const routeFiles = new Map(walkHtml(OUT).map((file) => {
  const rel = relative(OUT, file).split(sep).join("/");
  const route = rel === "index.html"
    ? "/"
    : rel.endsWith("/index.html")
      ? `/${rel.slice(0, -"index.html".length)}`
      : `/${rel}`;
  return [route, file];
}));

const server = createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  } catch {
    res.writeHead(400).end("Bad request");
    return;
  }
  const file = routeFiles.get(pathname) ?? resolve(OUT, `.${pathname}`);
  if (!file.startsWith(`${OUT}${sep}`) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end("Not found");
    return;
  }
  const headers = {
    "Content-Type": MIME_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  // A valós hosztolás tömörít — a harness a gzip_static-modell szerint szolgálja ki a .gz ikertestvéreket.
  let body = readFileSync(file);
  const gzPath = `${file}.gz`;
  if ((req.headers["accept-encoding"] ?? "").includes("gzip") && existsSync(gzPath)) {
    body = readFileSync(gzPath);
    headers["Content-Encoding"] = "gzip";
  }
  res.writeHead(200, headers);
  res.end(body);
});

let chrome;
try {
  await new Promise((listen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", listen);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  chrome = await launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
    logLevel: "error",
  });

  for (const route of ROUTES) {
    const url = new URL(route, origin).href;
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance"],
      formFactor: "mobile",
      screenEmulation: { mobile: true, width: 360, height: 800, deviceScaleFactor: 2, disabled: false },
      throttlingMethod: "simulate",
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        requestLatencyMs: 150,
        downloadThroughputKbps: 1638.4,
        uploadThroughputKbps: 750,
        cpuSlowdownMultiplier: 4,
      },
      disableStorageReset: false,
    });
    if (!result?.lhr) throw new Error(`Lighthouse returned no result for ${route}`);

    const { categories, audits } = result.lhr;
    const performanceAudits = [
      "first-contentful-paint",
      "largest-contentful-paint",
      "lcp-discovery-insight",
      "lcp-breakdown-insight",
      "document-latency-insight",
      "font-display-insight",
      "render-blocking-insight",
      "third-parties-insight",
      "speed-index",
      "total-blocking-time",
      "cumulative-layout-shift",
      "interactive",
      "uses-text-compression",
      "uses-long-cache-ttl",
      "uses-optimized-images",
      "modern-image-formats",
      "render-blocking-resources",
      "uses-rel-preload",
      "font-display",
      "unused-javascript",
      "unused-css-rules",
      "bootup-time",
      "mainthread-work-breakdown",
      "script-treemap-data",
      "third-party-summary",
      "network-requests",
      "resource-summary",
    ];
    const score = Math.round((categories.performance?.score ?? 0) * 100);
    console.log(`\n${route} — Performance ${score}/100`);
    for (const id of performanceAudits) {
      const audit = audits[id];
      if (!audit || (audit.score === 1 && !id.endsWith("insight"))) continue;
      const display = audit.displayValue ? ` — ${audit.displayValue}` : "";
      console.log(`  ${audit.scoreDisplayMode === "error" ? "ERROR" : audit.scoreDisplayMode === "manual" ? "MANUAL" : audit.score === null ? "INSIGHT" : "OPPORTUNITY"}: ${audit.title}${display}`);
      if (audit.details?.type === "opportunity") {
        for (const item of audit.details.items?.slice(0, 4) ?? []) {
          const label = item.url ? new URL(item.url).pathname : item.node?.snippet?.replace(/\\s+/g, " ").slice(0, 100);
          if (label) console.log(`    ${label}${item.wastedBytes ? ` (${Math.round(item.wastedBytes / 1024)} kB potential)` : ""}`);
        }
      } else if (audit.details?.type === "table") {
        for (const item of audit.details.items?.slice(0, 4) ?? []) {
          const label = item.url ?? item.name ?? item.groupLabel ?? item.subItems?.items?.[0]?.text;
          if (label) console.log(`    ${label}${item.transferSize ? ` (${Math.round(item.transferSize / 1024)} kB)` : item.scripting ? ` (${Math.round(item.scripting / 1000)} s scripting)` : ""}`);
        }
      } else if (audit.details?.type === "debugdata") {
        console.log(`    ${JSON.stringify(audit.details.items?.[0] ?? audit.details).slice(0, 600)}`);
      }
    }
  }
  writeFileSync(STATE_FILE, `${JSON.stringify({ hash: currentHash, at: new Date().toISOString() }, null, 2)}\n`);
} finally {
  await chrome?.kill();
  await new Promise((close) => server.close(close));
}
