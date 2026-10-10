import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { chromium } from "playwright";

const OUT = resolve("out");
const VIEWPORT = { width: 360, height: 800 };
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

const routes = walkHtml(OUT).map((file) => {
  const rel = relative(OUT, file).split(sep).join("/");
  const route = rel === "index.html"
    ? "/"
    : rel.endsWith("/index.html")
      ? `/${rel.slice(0, -"index.html".length)}`
      : `/${rel}`;
  return { file, route };
});
if (!routes.length) throw new Error("No exported HTML files found in `out/`.");

// ── Change-gated audit (2026-10-03 rendszer-audit, az a11y-gate mintájára) ──
// A 360px audit a második legdrágább kapu (~98s). Csak a tartalmilag változott
// route-ok futnak újra; TELJES futás: DAEKON_FULL_AUDIT=1.
import { createHash as _createHash } from "node:crypto";
const STATE_FILE = resolve(".daekon-mobile-state.json");
const FULL_AUDIT = process.env.DAEKON_FULL_AUDIT === "1";
const routeHash = (file, route) => {
  // buildId-komment kiszűrése (tartalom-semleges, lásd a11y-export.mjs) — audit 2026-10-03.
  const html = readFileSync(file, "utf8")
    .replace(/^<!DOCTYPE html>\s*<!--[^>]*-->/, "<!DOCTYPE html>")
    .replace(/\/_next\/static\/css\/[A-Za-z0-9._-]+\.css/g, "_next/static/css/CSS")
    .replace(/(\\?"b\\?":\\?")[A-Za-z0-9_-]{16,45}(\\?")/g, "$1BUILDID$2");
  const parts = [html];
  const cssDir = join(OUT, "_next", "static", "css");
  if (existsSync(cssDir)) {
    for (const entry of readdirSync(cssDir)) if (entry.endsWith(".css")) {
      parts.push(readFileSync(join(cssDir, entry)));
    }
  }
  return _createHash("sha256").update(parts.reduce((a, p) => Buffer.concat([a, Buffer.from(p)]), Buffer.alloc(0))).digest("hex").slice(0, 16);
};
let prevState = {};
if (!FULL_AUDIT && existsSync(STATE_FILE)) {
  try { prevState = JSON.parse(readFileSync(STATE_FILE, "utf8")); } catch { prevState = {}; }
}
const currentStates = new Map(routes.map(({ file, route }) => [route, routeHash(file, route)]));
const pendingRoutes = routes.filter(({ route }) => currentStates.get(route) !== prevState[route]);
if (!FULL_AUDIT && pendingRoutes.length === 0) {
  console.log(`360px audit: mind a ${routes.length} route változatlan — kihagyva (state: ${STATE_FILE}); teljes futás: DAEKON_FULL_AUDIT=1`);
  process.exit(0);
}
const auditTargets = FULL_AUDIT ? routes : pendingRoutes;
console.log(`360px audit: ${auditTargets.length}/${routes.length} route${FULL_AUDIT ? " (TELJES)" : " (változott route-ok)"}...`);

const routeFiles = new Map(routes.map(({ file, route }) => [route, file]));
const server = createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  } catch {
    res.writeHead(400).end("Bad request");
    return;
  }

  const file = routeFiles.get(pathname) ?? resolve(OUT, `.${pathname}`);
  if ((!file.startsWith(`${OUT}${sep}`) && file !== resolve(OUT, "index.html")) || !existsSync(file) || !statSync(file).isFile()) {
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

const findings = [];
let browser;
try {
  await new Promise((listen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", listen);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.route("**/*", (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin !== origin && requestUrl.protocol !== "data:") return route.abort();
    return route.continue();
  });

  for (const { route, file } of auditTargets) {
    const response = await page.goto(new URL(route, origin).href, { waitUntil: "load", timeout: 30000 });
    if (!response?.ok()) throw new Error(`${route}: page returned ${response?.status() ?? "no response"}`);
    await page.evaluate(() => document.fonts?.ready);
    await inspectLayout(page, route);
    await inspectControls(page, route);
    await inspectMenu(page, route);
    console.log(`✓ ${route} (${file.slice(OUT.length + 1)})`);
  }
} finally {
  await browser?.close();
  await new Promise((close) => server.close(close));
}

if (findings.length) {
  // Sikertelen audit → state NEM frissül: a hibás route-ok következő futáskor újraauditálódnak.
  console.error(`\n360px audit found ${findings.length} issue(s):`);
  const uniqueFindings = [...new Map(findings.map((finding) => [
    `${finding.route}|${finding.kind}|${finding.selector ?? ""}|${finding.message}`,
    finding,
  ])).values()];
  for (const finding of uniqueFindings.slice(0, 40)) {
    console.error(`\n${finding.route} — ${finding.kind}: ${finding.message}`);
    if (finding.selector) console.error(`  ${finding.selector}`);
  }
  if (uniqueFindings.length > 40) console.error(`\n… ${uniqueFindings.length - 40} additional findings omitted.`);
  process.exitCode = 1;
} else {
  const state = Object.fromEntries(auditTargets.map(({ route }) => [route, currentStates.get(route)]));
  const merged = { ...prevState, ...state };
  const liveState = Object.fromEntries(Object.entries(merged).filter(([route]) => currentStates.has(route)));
  writeFileSync(STATE_FILE, `${JSON.stringify(liveState, null, 2)}\n`);
  console.log(`\n360px audit passed: ${auditTargets.length}/${routes.length} route auditálva${routes.length - auditTargets.length > 0 ? `, ${routes.length - auditTargets.length} változatlan kihagyva` : ""}; layout bounds, tappable controls, and menu open/close. State: ${STATE_FILE}`);
}

async function inspectLayout(page, route) {
  const result = await page.evaluate((viewportWidth) => {
    const root = document.documentElement;
    const offenders = [];
    const selectorFor = (element) => {
      if (element.id) return `#${element.id}`;
      const tag = element.tagName.toLowerCase();
      const classes = String(element.className?.baseVal ?? element.className ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .join(".");
      return classes ? `${tag}.${classes}` : tag;
    };
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const horizontallyClipped = (element) => {
      for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        if (["auto", "scroll", "hidden", "clip"].includes(getComputedStyle(parent).overflowX)) return true;
      }
      return false;
    };

    for (const element of document.body.querySelectorAll("*")) {
      if (!visible(element) || horizontallyClipped(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.left < -1 || rect.right > viewportWidth + 1) {
        const hasOutOfBoundsChild = [...element.children].some((child) => {
          if (!visible(child) || horizontallyClipped(child)) return false;
          const childRect = child.getBoundingClientRect();
          return childRect.left < -1 || childRect.right > viewportWidth + 1;
        });
        if (!hasOutOfBoundsChild) {
          offenders.push({
            selector: selectorFor(element),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 70),
          });
        }
      }
    }
    return {
      document: Math.max(root.scrollWidth, document.body.scrollWidth) - viewportWidth,
      rootScrollWidth: root.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      offenders: offenders.map((offender) => {
        const element = document.querySelector(offender.selector);
        const rect = element?.getBoundingClientRect();
        return {
          ...offender,
          width: rect ? Math.round(rect.width) : null,
          parent: element?.parentElement?.tagName.toLowerCase() ?? null,
          parentWidth: element?.parentElement ? Math.round(element.parentElement.getBoundingClientRect().width) : null,
        };
      }),
    };
  }, VIEWPORT.width);

  if (result.document > 1) {
    findings.push({ route, kind: "horizontal-scroll", message: `document exceeds viewport by ${result.document}px (root=${result.rootScrollWidth}, body=${result.bodyScrollWidth})` });
  }
  for (const offender of result.offenders) {
    findings.push({
      route,
      kind: "off-canvas element",
      message: `left=${offender.left}px right=${offender.right}px${offender.text ? ` text="${offender.text}"` : ""}`,
      selector: offender.selector,
    });
  }
}

async function inspectControls(page, route) {
  // SZEKVENCIÁLIS (2026-10-03 audit): a batch-evaluate (1 evaluate minden
  // kontrollra) hamis "covered" találatokat adott — a scrollIntoView + hit-test
  // párosnak Playwright-futásonkénti beállás kell (a lásd daekon/error-analyst
  // jegyzet: rAF-on belüli ciklusban az elementFromPoint elavult scroll-állapotot lát).
  const controls = page.locator('a[href]:not([href="#main-content"]), button, input:not([type="hidden"]), select, textarea, summary, [role="button"]');
  const count = await controls.count();
  for (let index = 0; index < count; index++) {
    const control = controls.nth(index);
    if (!(await control.isVisible()) || !(await control.isEnabled().catch(() => false))) continue;
    await control.evaluate((element) => element.scrollIntoView({ behavior: "instant", block: "center", inline: "center" }));
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const state = await control.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      if (x < 0 || x >= innerWidth || y < 0 || y >= innerHeight) {
        return { inViewport: false, selector: element.id ? `#${element.id}` : element.tagName.toLowerCase() };
      }
      const top = document.elementFromPoint(x, y);
      const label = element.getAttribute("aria-label") || element.innerText || element.getAttribute("placeholder") || element.getAttribute("href") || element.tagName;
      return {
        inViewport: true,
        selector: element.id ? `#${element.id}` : element.tagName.toLowerCase(),
        label: label.trim().replace(/\s+/g, " ").slice(0, 70),
        hit: !!top && (top === element || element.contains(top)),
        top: top ? `${top.tagName.toLowerCase()}${top.id ? `#${top.id}` : ""}.${String(top.className?.baseVal ?? top.className ?? "").trim().split(/\s+/).slice(0, 2).join(".")}` : "none",
      };
    });
    if (state.inViewport && !state.hit) {
      findings.push({ route, kind: "blocked control", message: `center hit target covered: ${state.label}; hit=${state.top}`, selector: state.selector });
    }
  }
}

async function inspectMenu(page, route) {
  const button = page.locator('button[aria-controls="mobil-menu"]');
  if (!(await button.isVisible())) return;
  await button.scrollIntoViewIfNeeded();
  await button.click();
  const menu = page.locator("#mobil-menu");
  try {
    await menu.waitFor({ state: "visible", timeout: 1500 });
    const hasFocusableLinks = await menu.locator("a:visible").count();
    if (!hasFocusableLinks) {
      findings.push({ route, kind: "menu interaction", message: "menu opened without visible links" });
    }
    await page.keyboard.press("Escape");
    await menu.waitFor({ state: "hidden", timeout: 1500 });
    if (!(await button.evaluate((element) => element === document.activeElement))) {
      findings.push({ route, kind: "menu focus", message: "Escape closed menu but focus was not restored to the menu button" });
    }
  } catch (error) {
    findings.push({ route, kind: "menu interaction", message: error.message });
  }
}
