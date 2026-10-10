import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const OUT = resolve("out");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
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

function walkHtml(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const file = join(dir, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) walkHtml(file, files);
    else if (file.endsWith(".html")) files.push(file);
  }
  return files;
}

const htmlFiles = walkHtml(OUT);
if (!htmlFiles.length) throw new Error("No exported HTML files found in `out/`.");

const routes = htmlFiles.map((file) => {
  const rel = relative(OUT, file).split(sep).join("/");
  const route = rel === "index.html"
    ? "/"
    : rel.endsWith("/index.html")
      ? `/${rel.slice(0, -"index.html".length)}`
      : `/${rel}`;
  return { file, route };
});

// ── Change-gated audit (2026-10-03 rendszer-audit) ──
// Az axe futás a legdrágább kapu (~80s a 45 route × 5 állapot). Az exportált
// oldalak tartalom-hashéből döntjük el, mely route-okat kell (újra)auditálni:
// a JSX-ben/CSS-ben nem érintett route-okat kihagyjuk — a lefedettség invariáns
// marad: ha egy route bármiben változik (HTML, OG-kártya, CSS), újravitályozunk.
// TELJES futás: DAEKON_FULL_AUDIT=1 (vagy hiányzó/érvénytelen state).
import { createHash as _createHash } from "node:crypto";
const STATE_FILE = resolve(".daekon-a11y-state.json");
const FULL_AUDIT = process.env.DAEKON_FULL_AUDIT === "1";
const routeHash = (file, route) => {
  // A Next minden buildbe véletlen buildId-kommentet éget (<!DOCTYPE html><!--XXXX-->) —
  // az tartalom-semleges, kiszűrjük, különben minden rebuild mindent invalidál (audit 2026-10-03).
  const html = readFileSync(file, "utf8")
    .replace(/^<!DOCTYPE html>\s*<!--[^>]*-->/, "<!DOCTYPE html>")
    // A CSS-fájlnév Next-chunk-hash-e is buildfüggő lehet azonos tartalom mellett —
    // a CSS TARTALMÁT külön hash-eljük, tehát itt a hivatkozás normalizálható.
    .replace(/\/_next\/static\/css\/[A-Za-z0-9._-]+\.css/g, "_next/static/css/CSS")
    // RSC-payload buildId-token ("b":"XXXX") — szintén tartalom-semleges.
    .replace(/(\\?"b\\?":\\?")[A-Za-z0-9_-]{16,45}(\\?")/g, "$1BUILDID$2");
  const parts = [html];
  const cssDir = join(OUT, "_next", "static", "css");
  if (existsSync(cssDir)) {
    for (const entry of readdirSync(cssDir)) if (entry.endsWith(".css")) {
      parts.push(readFileSync(join(cssDir, entry)));
    }
  }
  // Az OG-kártya a route-hoz tartozik: hash-be kell, hogy kártyaváltozás újravitályozzon.
  const card = route === "/" ? join(OUT, "opengraph-image") : join(OUT, route.replace(/^\//, ""), "opengraph-image");
  if (existsSync(card)) parts.push(readFileSync(card));
  return _createHash("sha256").update(parts.reduce((a, p) => Buffer.concat([a, Buffer.from(p)]), Buffer.alloc(0))).digest("hex").slice(0, 16);
};
let prevState = {};
if (!FULL_AUDIT && existsSync(STATE_FILE)) {
  try { prevState = JSON.parse(readFileSync(STATE_FILE, "utf8")); } catch { prevState = {}; }
}
const currentStates = new Map(routes.map(({ file, route }) => [route, routeHash(file, route)]));
const pendingRoutes = routes.filter(({ route }) => currentStates.get(route) !== prevState[route]);
if (!FULL_AUDIT && pendingRoutes.length === 0 && routes.length > 0) {
  console.log(`a11y: mind a ${routes.length} route változatlan — audit kihagyva (state-tároló: ${STATE_FILE}); teljes futás: DAEKON_FULL_AUDIT=1`);
  process.exit(0);
}
const auditTargets = FULL_AUDIT ? routes : pendingRoutes;
console.log(`a11y: ${auditTargets.length}/${routes.length} route auditálása${FULL_AUDIT ? " (TELJES)" : " (változott route-ok)"}...`);

const routeFiles = new Map(routes.map(({ file, route }) => [route, file]));
const server = createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  } catch {
    res.writeHead(400).end("Bad request");
    return;
  }

  const htmlFile = routeFiles.get(pathname);
  const requestedPath = resolve(OUT, `.${pathname}`);
  const file = htmlFile ?? requestedPath;
  if (file !== OUT && !file.startsWith(`${OUT}${sep}`) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end("Not found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": MIME_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(readFileSync(file));
});

const violations = [];
let browser;

try {
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    colorScheme: "light",
    // A QA a nyugalmi állapotot méri: a beúszó/scroll-reveal animációk közepén az
    // opacity-0 szöveg kontrasztja nem értékelhető (a motion-t a 360px audit kezeli).
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.route("**/*", (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin !== origin && requestUrl.protocol !== "data:") {
      return route.abort();
    }
    return route.continue();
  });

  for (const { route, file } of auditTargets) {
    const url = new URL(route, origin).href;
    await page.setViewportSize({ width: 1440, height: 1000 });
    // load + fonts.ready: a networkidle a statikus exporton csak a saját
    // alerőforrásaira vár — a load esemény + betűtípus-kész pontosabb és gyorsabb.
    const response = await page.goto(url, { waitUntil: "load", timeout: 30000 });
    if (!response?.ok()) throw new Error(`${route}: page returned ${response?.status() ?? "no response"}`);
    await page.evaluate(() => document.fonts?.ready);
    if (!response?.ok()) throw new Error(`${route}: page returned ${response?.status() ?? "no response"}`);
    await audit(page, route, "desktop");

    await page.setViewportSize({ width: 390, height: 844 });
    await audit(page, route, "mobile (menu closed)");
    await page.keyboard.press("Tab");
    await audit(page, route, "mobile (keyboard focus)");
    await page.keyboard.press("Shift+Tab");
    const menuButton = page.locator('button[aria-controls="mobil-menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.locator("#mobil-menu:not([hidden])").waitFor({ state: "visible" });
      await audit(page, route, "mobile (menu open)");
      await page.keyboard.press("Escape");
      await audit(page, route, "mobile (menu closed after Escape)");
    }
    console.log(`✓ ${route} (${file.slice(OUT.length + 1)})`);
  }
} finally {
  await browser?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

if (violations.length) {
  // Sikertelen audit → state NEM frissül: a következő futás újravitályozza ezeket.
  console.error(`\naxe found ${violations.length} WCAG violation(s):`);
  for (const violation of violations) {
    console.error(`\n[${violation.impact}] ${violation.id}: ${violation.help}`);
    console.error(`  WCAG: ${violation.tags.filter((tag) => tag.startsWith("wcag")).join(", ")}`);
    for (const node of violation.nodes) {
      console.error(`  ${node.target.join(", ")}`);
      console.error(`    ${node.failureSummary?.replace(/\s+/g, " ").trim() ?? "No failure summary"}`);
    }
  }
  process.exitCode = 1;
} else {
  // Sikeres audit → route-hash-állapot mentése (change-gated gyorsítás alapja).
  const state = Object.fromEntries(auditTargets.map(({ route }) => [route, currentStates.get(route)]));
  // A nem auditált (változatlan) route-ok korábbi hash-ei megmaradnak.
  const merged = { ...prevState, ...state };
  // Kifutott (törlött) route-ok kihagyása.
  const liveState = Object.fromEntries(Object.entries(merged).filter(([route]) => currentStates.has(route)));
  writeFileSync(STATE_FILE, `${JSON.stringify(liveState, null, 2)}\n`);
  console.log(`\naxe passed: ${auditTargets.length}/${routes.length} route auditálva${routes.length - auditTargets.length > 0 ? `, ${routes.length - auditTargets.length} változatlan kihagyva` : ""}; desktop, mobile, and mobile-menu states; WCAG A/AA 2.0–2.2. State: ${STATE_FILE}`);
}

async function audit(page, route, viewport) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  for (const violation of results.violations) {
    violations.push({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      tags: violation.tags,
      route,
      viewport,
      nodes: violation.nodes.map((node) => ({
        target: node.target,
        failureSummary: node.failureSummary,
      })),
    });
  }
}
