/**
 * V3 vizuális ellenőrzés: képernyőképek a kért töréspontokon.
 *
 * Futtatás: node scripts/v3-screenshots.mjs
 * Kimenet:  docs/v3-shots/<route>__<width>.png
 *
 * A statikus exportot (`out/`) szolgálja ki, a buildbe sütött basePath-ot
 * felismerve — így a CSS/JS biztosan betölt (különben stílus nélküli oldalt
 * fotóznánk).
 */
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const OUT = resolve("out");
const SHOTS = resolve("docs", "v3-shots");
const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

if (!existsSync(OUT)) throw new Error("Hiányzó `out/` — előbb: npm run build");

const BASE = (
  readFileSync(join(OUT, "index.html"), "utf8").match(/href="([^"]*)\/_next\/static\/css\//)?.[1] ?? ""
).replace(/\/+$/, "");

const WIDTHS = [360, 390, 430, 768, 1024, 1440];
const ROUTES = [
  ["/", "fooldal"],
  ["/arak/", "arak"],
  ["/arkalkulator/", "arkalkulator"],
  ["/rolunk/", "rolunk"],
  ["/szallitas/", "szallitas"],
  ["/teruletek/", "teruletek"],
  ["/anyagok/andezit/", "anyagok-andezit"],
  ["/kapcsolat/", "kapcsolat"],
];

const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  if (BASE && (p === BASE || p.startsWith(`${BASE}/`))) p = p.slice(BASE.length) || "/";
  let f = join(OUT, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, "index.html");
  if (!existsSync(f) || !statSync(f).isFile()) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(200, {
    "Content-Type": MIME[extname(f).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ headless: true });
let shots = 0;
const problems = [];

for (const width of WIDTHS) {
  const mobile = width < 768;
  const ctx = await browser.newContext({
    viewport: { width, height: mobile ? 820 : 1000 },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    return u.origin === origin || u.protocol === "data:" ? route.continue() : route.abort();
  });

  for (const [route, name] of ROUTES) {
    await page.goto(new URL(`${BASE}${route}`, origin).href, { waitUntil: "load" });
    await page.evaluate(() => document.fonts?.ready);
    const overflow = await page.evaluate(() => ({
      root: document.documentElement.clientWidth,
      body: document.body.scrollWidth,
    }));
    if (overflow.body > overflow.root + 1) {
      problems.push(`${route} @ ${width}px: vízszintes túlcsordulás (${overflow.body} > ${overflow.root})`);
    }
    await page.screenshot({ path: join(SHOTS, `${name}__${width}.png`), fullPage: true });
    shots++;
  }
  await ctx.close();
}

await browser.close();
server.close();

console.log(`${shots} képernyőkép kész: ${SHOTS}`);
if (problems.length) {
  console.log(`\n${problems.length} elrendezési gond:`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exitCode = 1;
} else {
  console.log("Egyetlen mért szélességen sincs vízszintes túlcsordulás.");
}
