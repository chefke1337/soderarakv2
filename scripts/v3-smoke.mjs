/**
 * V3 BÖNGÉSZŐ SMOKE TESZT — az árkalkulátor teljes folyamata.
 *
 * A statikus exportot (`out/`) szolgálja ki, és valódi böngészőben végigviszi:
 * lépésváltás és fókusz, irányítószámos árazás, kerület/irányítószám eltérés,
 * ismeretlen cím, 10 m³ feletti mennyiség, I. kerületi Vár-kérdés, valamint a
 * rendelési igény beküldése (MOCK backend ellen — valódi e-mail nem megy ki).
 *
 * Előfeltétel: fusson a mock backend (`npm run mock:order`), és a build a
 * NEXT_PUBLIC_ORDER_API_URL értékkel készüljön (.env.local).
 *
 * Futtatás: node scripts/v3-smoke.mjs
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

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push(String(e)));
// A mock backend valódi hálózati hívás — azt NEM blokkoljuk.
await page.route("**/*", (route) => {
  const u = new URL(route.request().url());
  if (u.origin === origin || u.protocol === "data:") return route.continue();
  if (u.hostname === "127.0.0.1" || u.hostname === "localhost") return route.continue();
  return route.abort();
});

const receipt = () => page.locator("section[data-call-region='calculator_form']");
const receiptText = async () => (await receipt().innerText()).replace(/ /g, " ");

async function goCalc() {
  await page.goto(new URL(`${BASE}/arkalkulator/`, origin).href, { waitUntil: "load" });
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {
      /* privát mód */
    }
  });
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("nav[aria-label='Kalkulátor lépései']");
}

/* ─────────── 1. Alapállapot: bruttó anyagár, fuvar még nincs ─────────── */
console.log("\n── 1. Alapállapot ──");
await goCalc();
let t = await receiptText();
check("az összesítő a bruttó egységárat mutatja", t.includes("13 500 Ft/m³"));
check("az anyag bruttó részösszege látszik", t.includes("108 000 Ft"));
check("irányítószám nélkül a fuvar még nem számolódik", t.includes("Adja meg az irányítószámot"));
check("irányítószám nélkül nincs teljes összeg", !t.includes("165 150 Ft"));

/* ─────────── 2. Lépésváltás és fókuszkezelés ─────────── */
console.log("\n── 2. Lépésváltás és fókusz ──");
await page.getByRole("button", { name: /Tovább: mennyiség/ }).click();
check(
  "a 2. lépés címe kapja a fókuszt",
  (await page.evaluate(() => document.activeElement?.id)) === "step-2-cim",
);
await page.getByRole("button", { name: /Tovább: szállítási cím/ }).click();
check(
  "a 3. lépés címe kapja a fókuszt",
  (await page.evaluate(() => document.activeElement?.id)) === "step-3-cim",
);
check(
  "a lépéssáv a 3. lépést jelöli aktuálisnak",
  (await page.locator("nav[aria-label='Kalkulátor lépései'] [aria-current='step']").innerText()).includes("Cím"),
);

/* ─────────── 3. Irányítószámos árazás ─────────── */
console.log("\n── 3. Irányítószámos árazás ──");
await page.getByLabel(/Irányítószám/).fill("1221");
await page.waitForTimeout(150);
t = await receiptText();
check("fuvar nettó díj 45 000 Ft (7–10 m³ sáv, XXII.)", t.includes("45 000 Ft"));
check("fuvar ÁFA 12 150 Ft", t.includes("12 150 Ft"));
check("fuvar bruttó díj 57 150 Ft", t.includes("57 150 Ft"));
check("teljes bruttó összeg 165 150 Ft", t.includes("165 150 Ft"));
check("a sáv felirata megjelenik", t.includes("7–10 m³"));

/* ─────────── 4. Kerület és irányítószám eltérése ─────────── */
console.log("\n── 4. Kerület/irányítószám eltérés ──");
await page.getByLabel(/Kerület/).selectOption("11");
await page.waitForTimeout(150);
t = await receiptText();
check("eltérésnél figyelmeztetés jelenik meg", /nem a kiválasztott területhez/.test(t));
check("eltérésnél NINCS automatikusan választott díj", !t.includes("45 000 Ft"));
check("eltérésnél nincs teljes összeg", !t.includes("165 150 Ft"));

/* ─────────── 5. XI. kerület eltérő díjprofilja ─────────── */
console.log("\n── 5. XI. kerület — 1112/1118 eltérő profil ──");
await page.getByLabel(/Irányítószám/).fill("1111");
await page.waitForTimeout(150);
t = await receiptText();
check("XI. alap @ 8 m³ → 50 000 Ft nettó", t.includes("50 000 Ft"));
await page.getByLabel(/Irányítószám/).fill("1112");
await page.waitForTimeout(150);
t = await receiptText();
check("XI. 1112 @ 8 m³ → 60 000 Ft nettó (eltérő profil)", t.includes("60 000 Ft"));
check("a XI. kerületi eltérésről tájékoztatás is van", /1112/.test(await page.locator("main").innerText()));

/* ─────────── 6. Nem támogatott irányítószám ─────────── */
console.log("\n── 6. Nem támogatott irányítószám ──");
await page.getByLabel(/Kerület/).selectOption("22");
await page.getByLabel(/Irányítószám/).fill("9999");
await page.waitForTimeout(150);
t = await receiptText();
check("ismeretlen címnél egyedi egyeztetés", /egyedi szállítási egyeztetés|nem a kiválasztott területhez/i.test(t));
check("ismeretlen címnél nincs teljes összeg", !/Teljes bruttó tájékoztató összeg\s*\n?\s*\d/.test(t));

/* ─────────── 7. 10 m³ feletti mennyiség ─────────── */
console.log("\n── 7. 10 m³ feletti mennyiség ──");
await page.getByLabel(/Irányítószám/).fill("1221");
await page.getByRole("button", { name: /^2\s*Mennyiség$|Mennyiség/ }).first().click();
await page.getByRole("checkbox").first().check();
await page.waitForTimeout(150);
t = await receiptText();
check("10 m³ felett többfuvaros ajánlat üzenet", /10 m³ feletti mennyiséghez/.test(t));
check("10 m³ felett nincs fuvardíj", !t.includes("45 000 Ft"));
await page.getByRole("checkbox").first().uncheck();

/* ─────────── 8. I. kerületi Vár-kérdés ─────────── */
console.log("\n── 8. I. kerületi Vár ──");
await page.getByRole("button", { name: /Cím/ }).first().click();
await page.getByLabel(/Kerület/).selectOption("1");
await page.getByLabel(/Irányítószám/).fill("1011");
await page.waitForTimeout(150);
const main = await page.locator("main").innerText();
check("a Vár-kérdés megjelenik", /A szállítási cím a Vár területén található\?/.test(main));
check("mindhárom válaszlehetőség ott van", /Igen/.test(main) && /Nem tudom/.test(main));
t = await receiptText();
check("válasz nélkül nincs garantált végösszeg", /Az engedély díja még nem ismert/.test(t));
await page.getByRole("radio", { name: "Nem tudom", exact: true }).check();
await page.waitForTimeout(150);
t = await receiptText();
check("Nem tudom válasz esetén külön engedély-egyeztetés", /Vár területe/.test(t));
// I. kerület, 8 m³ → az 5–8 m³ sáv: 40 000 Ft nettó, ÁFA 10 800, bruttó 50 800.
check("az ismert fuvar tételek ettől még látszanak", t.includes("40 000 Ft") && t.includes("10 800 Ft"));
await page.getByRole("radio", { name: "Nem", exact: true }).check();
await page.waitForTimeout(150);
t = await receiptText();
check(
  "Nem válasz esetén van teljes bruttó összeg (108 000 + 50 800)",
  /Teljes bruttó tájékoztató összeg/.test(t) && t.includes("158 800 Ft"),
);

/* ─────────── 9. Rendelési igény beküldése (mock) ─────────── */
console.log("\n── 9. Rendelési igény beküldése ──");
await page.getByLabel(/Kerület/).selectOption("22");
await page.getByLabel(/Irányítószám/).fill("1221");
await page.getByLabel(/Szállítási cím/).fill("Teszt utca 1.");
await page.getByLabel(/^Név/).fill("Teszt Elek");
await page.getByLabel(/E-mail/).fill("nem-email");
await page.getByLabel(/Telefon/).fill("+36 30 123 4567");
await page.getByRole("checkbox", { name: /adatkezelési tájékoztatót/ }).check();
await page.getByRole("button", { name: /Rendelési igény elküldése/ }).click();
await page.waitForTimeout(300);
check(
  "érvénytelen e-mail esetén a beküldés nem indul el",
  /érvényes e-mail-címet/.test(await receiptText()),
);

await page.getByLabel(/E-mail/).fill("teszt@example.com");
await page.getByRole("button", { name: /Rendelési igény elküldése/ }).click();
await page.waitForSelector("[data-call-region='order_intent_success'], [data-call-region='order_intent_error']", { timeout: 20000 });
t = await receiptText();
const sent = await page.locator("[data-call-region='order_intent_success']").count();
check("a beküldés sikeres állapotot ad", sent === 1);
check("a mock mód egyértelműen jelölt", /MOCK MÓD/.test(t));
check("a siker NEM végleges megrendelés-visszaigazolás", /nem végleges megrendelés/.test(t));

/* ─────────── 10. Dupla beküldés ─────────── */
console.log("\n── 10. Dupla beküldés ──");
await page.getByRole("button", { name: /Rendelési igény elküldése/ }).click();
await page.waitForTimeout(1500);
t = await receiptText();
check("a második beküldés sem hibázik el", !/nem sikerült/i.test(t));

/* ─────────── 11. Konzolhibák ─────────── */
console.log("\n── 11. Konzol ──");
const realErrors = consoleErrors.filter((e) => !/favicon|net::ERR_FAILED/i.test(e));
check(`nincs kliensoldali konzolhiba (${realErrors.length})`, realErrors.length === 0);
if (realErrors.length) for (const e of realErrors.slice(0, 5)) console.log(`     ${e.slice(0, 160)}`);

await browser.close();
server.close();

console.log(`\nv3-smoke: ${passed} OK, ${failures.length} FAIL (összesen ${passed + failures.length})`);
if (failures.length) {
  console.log("\nHIBÁK:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
