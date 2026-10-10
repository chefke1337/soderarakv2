#!/usr/bin/env node
/**
 * Lighthouse JSON-diag: egy route teljes LHR-jét JSON-ba írja, hogy a
 * scripts/lh-diag.mjs elemezni tudja. Használat:
 *   node scripts/lh-json.mjs "/" .lh-home.json
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

const OUT = resolve("out");
const route = process.argv[2] ?? "/";
const target = process.argv[3] ?? ".lh-route.json";
// Kategóriák: alapértelmezetten csak performance (a bázismérésekkel összevethető);
// LH_CATEGORIES=performance,seo,best-practices,accessibility felülírja.
const categories = (process.env.LH_CATEGORIES ?? "performance")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".ico": "image/x-icon",
  ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8", ".webp": "image/webp", ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2", ".gz": "application/gzip",
};

function walkHtml(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const file = join(dir, entry);
    if (statSync(file).isDirectory()) walkHtml(file, files);
    else if (file.endsWith(".html")) files.push(file);
  }
  return files;
}

const routeFiles = new Map(walkHtml(OUT).map((file) => {
  const rel = relative(OUT, file).split(sep).join("/");
  const r = rel === "index.html" ? "/" : rel.endsWith("/index.html") ? `/${rel.slice(0, -"index.html".length)}` : `/${rel}`;
  return [r, file];
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
  await new Promise((listen, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", listen); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  chrome = await launch({ chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"], logLevel: "error" });
  const result = await lighthouse(new URL(route, origin).href, {
    port: chrome.port, output: "json", logLevel: "error",
    onlyCategories: categories, formFactor: "mobile",
    screenEmulation: { mobile: true, width: 360, height: 800, deviceScaleFactor: 2, disabled: false },
    throttlingMethod: "simulate",
    throttling: { rttMs: 150, throughputKbps: 1638.4, requestLatencyMs: 150, downloadThroughputKbps: 1638.4, uploadThroughputKbps: 750, cpuSlowdownMultiplier: 4 },
  });
  if (!result?.lhr) throw new Error("Nincs LHR");
  writeFileSync(target, JSON.stringify(result.lhr));
  // LH_TRACE=1 → a teljes trace is elmentődik (.trace.json), a hosszú taskok
  // tartalmának elemzéséhez (pl. melyik esemény adja a Document long-taskot).
  if (process.env.LH_TRACE && result.artifacts?.Trace) {
    const tracePath = target.replace(/\.json$/, ".trace.json");
    writeFileSync(tracePath, JSON.stringify(result.artifacts.Trace));
    console.log(`trace → ${tracePath}`);
  }
  const score = Math.round((result.lhr.categories.performance?.score ?? 0) * 100);
  console.log(`${route} — Performance ${score}/100 → ${target}`);
} finally {
  await chrome?.kill();
  await new Promise((close) => server.close(close));
}
