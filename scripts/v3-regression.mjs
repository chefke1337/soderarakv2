/**
 * V3 REGRESSZIÓS BÖNGÉSZŐTESZT (audit, 2026-11-01).
 *
 * A statikus exportot (`out/`) szolgálja ki, külső hálózat nélkül (az OSM
 * csempéket üres válasszal helyettesíti), és ellenőrzi:
 *  - fontos route-ok 200 + egyetlen H1 + nincs oldal szintű vízszintes overflow
 *    360/390/430/768/1024/1440 px-en;
 *  - mobilmenü: nyitás, fókusz az első menüpontra, Escape, fókusz vissza, zárt
 *    állapotban nem fókuszálható; a nyitott menü a térkép fölött van;
 *  - térkép: minden jelölés a kereten belül, látható feliratok nem fedik egymást
 *    és nem lógnak ki, a sticky fejléc a térkép fölött marad;
 *  - területkereső: ékezetfüggetlen, római/arab kerületszám, városrész,
 *    irányítószám, találat nélküli állapot;
 *  - kerületi oldalak: mind a 23 elérhető, saját irányítószámokkal;
 *  - kalkulátor: ismeretlen irányítószámnál nincs 0 Ft-os fuvar; üres
 *    beküldésnél hibaüzenet, nincs sikerüzenet.
 * Valódi rendelés / e-mail nem megy ki (külső hálózat tiltva).
 *
 * Futtatás: node scripts/v3-regression.mjs
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const OUT = resolve("out");
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
  ".webmanifest": "application/manifest+json",
};

if (!existsSync(OUT)) throw new Error("Hiányzó `out/` — előbb: npm run build");
const BASE = (
  readFileSync(join(OUT, "index.html"), "utf8").match(/href="([^"]*)\/_next\/static\/css\//)?.[1] ?? ""
).replace(/\/+$/, "");

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

let passed = 0;
const failures = [];
function check(label, cond) {
  if (cond) passed++;
  else failures.push(label);
  console.log(`${cond ? "OK  " : "FAIL"} ${label}`);
}

const ROUTES = [
  "/", "/anyagok/", "/anyagok/soder/", "/anyagok/kavics/", "/anyagok/andezit/", "/arak/", "/arkalkulator/",
  "/szallitas/", "/teruletek/", "/teruletek/budafok/", "/teruletek/budapest-1-kerulet/",
  "/teruletek/budapest-14-kerulet/", "/teruletek/ujbuda-budapest-11-kerulet/", "/teruletek/diosd/",
  "/rolunk/", "/kapcsolat/", "/impresszum/", "/adatvedelem/", "/utmutatok/", "/utmutatok/mennyi-soder-kell/",
];
const WIDTHS = [360, 390, 430, 768, 1024, 1440];

const browser = await chromium.launch({ headless: true });
async function newPage(width, height = 900) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.origin === origin || u.protocol === "data:") return route.continue();
    if (u.hostname === "tile.openstreetmap.org") return route.fulfill({ status: 200, body: "", contentType: "image/png" });
    return route.abort();
  });
  return { ctx, page, errors };
}
const url = (p) => `${origin}${BASE}${p}`;

/* ── 1. Route-ok, H1, overflow ── */
for (const w of WIDTHS) {
  const { ctx, page, errors } = await newPage(w);
  for (const r of ROUTES) {
    const resp = await page.goto(url(r), { waitUntil: "load" });
    const ok = resp?.status() === 200;
    const h1 = await page.locator("h1").count();
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (!ok || h1 !== 1 || sw > w) check(`${w}px ${r}: status ${resp?.status()}, h1=${h1}, scrollWidth=${sw}`, false);
  }
  check(`${w}px: ${ROUTES.length} route — 200, egy H1, nincs vízszintes overflow`, true);
  check(`${w}px: nincs runtime-hiba (${errors.slice(0, 2).join(" | ")})`, errors.length === 0);
  await ctx.close();
}

/* ── 2. Mobilmenü ── */
{
  const { ctx, page } = await newPage(390, 844);
  await page.goto(url("/kapcsolat/"), { waitUntil: "load" });
  const btn = page.locator("button[aria-controls]").filter({ hasText: "Menü" }).first();
  const panelLinkVisible = () => page.locator("nav[aria-label='Mobil navigáció'] a").first().isVisible();
  check("menü: zárt állapotban a menüpontok rejtettek", !(await panelLinkVisible()));
  await btn.click();
  await page.waitForTimeout(150);
  check("menü: aria-expanded=true nyitás után", (await btn.getAttribute("aria-expanded")) === "true");
  check("menü: fókusz az első menüponton",
    await page.evaluate(() => document.activeElement?.closest("nav[aria-label='Mobil navigáció']") !== null));
  // nyitott menü a térkép fölött (a térkép közvetlenül a fejléc alatt)
  const panelBox = await page.locator("nav[aria-label='Mobil navigáció']").boundingBox();
  const onTop = await page.evaluate(({ x, y }) => {
    const e = document.elementFromPoint(x, y);
    return !!e?.closest("nav[aria-label='Mobil navigáció']");
  }, { x: panelBox.x + panelBox.width / 2, y: panelBox.y + panelBox.height - 12 });
  check("menü: a nyitott panel legfelül van (térkép/tartalom nem takarja)", onTop);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  check("menü: Escape bezár", (await btn.getAttribute("aria-expanded")) === "false");
  check("menü: fókusz visszakerül a gombra", await btn.evaluate((b) => b === document.activeElement));
  await ctx.close();
}

/* ── 3. Térkép ── */
for (const [w, h] of [[360, 740], [768, 1024], [1440, 900]]) {
  for (const r of ["/", "/teruletek/", "/kapcsolat/"]) {
    const { ctx, page } = await newPage(w, h);
    await page.goto(url(r), { waitUntil: "load" });
    for (let y = 0; y < 20000; y += 500) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(40);
      if (await page.locator(".leaflet-container").count()) break;
    }
    const map = page.locator(".leaflet-container").first();
    await map.waitFor({ state: "attached", timeout: 8000 }).catch(() => {});
    await map.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(1200);
    const res = await page.evaluate(() => {
      const c = document.querySelector(".leaflet-container");
      if (!c) return null;
      const box = c.getBoundingClientRect();
      const markers = [...c.querySelectorAll(".leaflet-interactive")].map((e) => e.getBoundingClientRect());
      const inside = markers.filter((m) => m.x + m.width / 2 >= box.left && m.x + m.width / 2 <= box.right && m.y + m.height / 2 >= box.top && m.y + m.height / 2 <= box.bottom).length;
      const labels = [...c.querySelectorAll(".leaflet-tooltip")].filter((e) => getComputedStyle(e).visibility !== "hidden").map((e) => e.getBoundingClientRect());
      let overlap = 0, outside = 0;
      labels.forEach((a, i) => {
        if (a.left < box.left - 1 || a.right > box.right + 1 || a.top < box.top - 1 || a.bottom > box.bottom + 1) outside++;
        labels.slice(i + 1).forEach((b) => { if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) overlap++; });
      });
      return { markers: markers.length, inside, visibleLabels: labels.length, overlap, outside, attribution: !!c.querySelector(".leaflet-control-attribution") };
    });
    check(`térkép ${r} ${w}px: betöltött`, !!res);
    if (res) {
      check(`térkép ${r} ${w}px: mind a ${res.markers} jelölés a kereten belül`, res.markers > 0 && res.inside === res.markers);
      check(`térkép ${r} ${w}px: ${res.visibleLabels} látható felirat, nincs átfedés/kilógás`, res.visibleLabels >= 4 && res.overlap === 0 && res.outside === 0);
      check(`térkép ${r} ${w}px: OSM-attribúció látható`, res.attribution);
      const top = await page.evaluate(() => document.querySelector(".leaflet-container").getBoundingClientRect().top + scrollY);
      await page.evaluate((t) => window.scrollTo(0, t + 30), top);
      await page.waitForTimeout(200);
      const headerOnTop = await page.evaluate(() => {
        const h = document.querySelector("body > header, header[class*='sticky']") ?? document.querySelector("header");
        const b = h.getBoundingClientRect();
        return [b.left + 30, b.left + b.width / 2, b.right - 30].every((x) => h.contains(document.elementFromPoint(x, b.bottom - 4)));
      });
      check(`térkép ${r} ${w}px: a sticky fejléc a térkép fölött marad`, headerOnTop);
    }
    await ctx.close();
  }
}

/* ── 4. Területkereső ── */
{
  const { ctx, page } = await newPage(390, 844);
  await page.goto(url("/teruletek/"), { waitUntil: "load" });
  const input = page.locator("input[type=search]").first();
  const titles = async () => (await page.locator(".area-row summary .font-display").allInnerTexts()).map((t) => t.trim());
  for (const [q, want] of [["kelenfold", "XI."], ["XI", "XI."], ["11", "XI."], ["rakoshegy", "XVII."], ["Zuglo", "XIV."], ["haros", "XXI."]]) {
    await input.fill(q);
    await page.waitForTimeout(120);
    const t = await titles();
    check(`kereső „${q}" → ${want} (${t.length} találat)`, t.some((x) => x.includes(`Budapest ${want} kerület`)));
  }
  await input.fill("1118");
  await page.waitForTimeout(120);
  check("kereső 1118 → külön díjprofil", (await page.locator(".area-zip-result").innerText()).includes("külön díjprofil"));
  await input.fill("9999");
  await page.waitForTimeout(120);
  check("kereső 9999 → nincs jóváhagyott tarifa", (await page.locator(".area-zip-result").innerText()).includes("nincs jóváhagyott tarifa"));
  await input.fill("qwxyz");
  await page.waitForTimeout(120);
  check("kereső: találat nélküli állapot", (await page.locator(".area-empty").count()) === 1);
  const html = readFileSync(join(OUT, "teruletek", "index.html"), "utf8");
  check("statikus HTML: mind a 23 kerület és a városrészek benne vannak", (html.match(/id="kerulet-\d+"/g) ?? []).length === 23 && html.includes("Kelenföld"));
  await ctx.close();
}

/* ── 5. Kerületi oldalak ── */
{
  const { ctx, page } = await newPage(1280);
  let ok = 0;
  for (let d = 1; d <= 23; d++) {
    await page.goto(url("/teruletek/"), { waitUntil: "load" });
    const href = await page.locator(`#kerulet-${d} h3 a`).getAttribute("href");
    const resp = await page.goto(`${origin}${href}`, { waitUntil: "load" });
    const body = await page.locator("main").innerText();
    const firstCode = (await page.locator(`a[href*="irsz="], .num`).allInnerTexts()).join(" ");
    if (resp?.status() === 200 && /Fuvardíj-sávok/.test(body) && /Városrészek a /.test(body) && /\d{4}/.test(firstCode)) ok++;
    else console.log(`  kerület ${d}: ${href} ${resp?.status()}`);
  }
  check(`kerületi oldalak: ${ok}/23 elérhető, díjsávokkal és városrészekkel`, ok === 23);
  await page.goto(url("/teruletek/budapest-1-kerulet/"), { waitUntil: "load" });
  check("I. kerület oldal: Vár-egyeztetés szerepel", /Vár/.test(await page.locator("main").innerText()));
  await page.goto(url("/teruletek/budapest-5-kerulet/"), { waitUntil: "load" });
  check("V. kerület oldal: 5 m³ feletti egyedi egyeztetés szerepel", /5 m³ felett egyedi egyeztetés/.test(await page.locator("main").innerText()));
  await ctx.close();
}

/* ── 6. Kalkulátor: hiányzó tarifa, üres beküldés ── */
{
  const { ctx, page } = await newPage(1280, 1000);
  await page.goto(url("/arkalkulator/?anyag=soder-0-24&m3=4&irsz=9999"), { waitUntil: "load" });
  await page.waitForTimeout(300);
  const t = (await page.locator("main").innerText()).replace(/\u00a0/g, " ");
  check("kalkulátor: ismeretlen irányítószám nem töltődik elő és nincs 0 Ft-os fuvar", !/Fuvar[^\n]*\b0 Ft/.test(t));
  const submit = page.locator("button[type=submit]").filter({ hasText: /beküldése|elküldése/ }).first();
  if (await submit.count()) {
    await submit.click();
    await page.waitForTimeout(300);
    const after = await page.locator("main").innerText();
    check("kalkulátor: üres beküldés → hibaüzenet, nincs sikerüzenet", /kötelező|adja meg|hiányzik|nincs konfigurálva/i.test(after) && !/sikeresen|megkaptuk/i.test(after));
  }
  await ctx.close();
}

await browser.close();
server.close();
console.log(`\nregression: ${passed} OK, ${failures.length} FAIL`);
if (failures.length) {
  console.log(failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
