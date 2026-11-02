/**
 * V3 BÖNGÉSZŐ SMOKE TESZT — az árkalkulátor teljes folyamata.
 *
 * A statikus exportot (`out/`) szolgálja ki, és valódi böngészőben végigviszi
 * az ÖTLÉPÉSES folyamatot (ügyfél, 2026-11-02): anyag → mennyiség (alap 1 m³)
 * → cím → [Tovább] → összesítés → [Megrendelem] → személyes adatok. Ellenőrzi,
 * hogy egyszerre csak az aktuális lépés van a DOM-ban, a fókuszt, a
 * visszalépéskor megmaradó választásokat, a reset utáni 1 m³-t, az árazást,
 * a kerület/irányítószám eltérést, a 10 m³ feletti mennyiséget, a Vár-kérdést,
 * valamint a rendelési igény beküldését (MOCK backend ellen — valódi e-mail
 * nem megy ki).
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

const mainText = async () => (await page.locator("main").innerText()).replace(/ /g, " ");
const activeId = () => page.evaluate(() => document.activeElement?.id ?? "");
const stepVisible = (n) => page.locator(`#step-${n}-cim`).count();
const next = (re) => page.getByRole("button", { name: re }).click();
const m3Value = async () => Number(await page.locator("input[type=range]").inputValue());

async function goCalc(prepare) {
  await page.goto(new URL(`${BASE}/arkalkulator/`, origin).href, { waitUntil: "load" });
  await page.evaluate((prep) => {
    try {
      localStorage.clear();
      if (prep) for (const [k, v] of Object.entries(prep)) localStorage.setItem(k, v);
    } catch {
      /* privát mód */
    }
  }, prepare ?? null);
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("nav[aria-label='Kalkulátor lépései']");
}

async function onlyStep(n, label) {
  const counts = await Promise.all([1, 2, 3, 4, 5].map((i) => stepVisible(i)));
  check(`${label}: csak a(z) ${n}. lépés van a DOM-ban`, counts.every((c, i) => c === (i + 1 === n ? 1 : 0)));
}

/* ─────────── 1. Alapállapot: csak az 1. lépés ─────────── */
console.log("\n── 1. Alapállapot ──");
await goCalc();
await onlyStep(1, "indulás");
check("nincs mennyiségválasztó az 1. lépésben", (await page.locator("input[type=range]").count()) === 0);
check("nincs címmező az 1. lépésben", (await page.getByLabel(/Irányítószám/).count()) === 0);
check("nincs személyes adat mező az 1. lépésben", (await page.getByLabel(/^Név/).count()) === 0);
check("nincs árösszesítő az 1. lépésben", !/Árösszesítő/.test(await mainText()));
for (const n of [2, 3, 4, 5]) {
  check(`a lépésjelző ${n}. lépése nem érhető el`, await page.locator(`button[aria-label^="${n}. lépés"]`).isDisabled());
}
await next(/Tovább: mennyiség/);
check("változat nélkül nem lép tovább", (await stepVisible(1)) === 1 && (await stepVisible(2)) === 0);
check("hibaüzenet: válasszon termékváltozatot", /válasszon termékváltozatot/i.test(await mainText()));
check("a fókusz a változatlistára kerül", (await page.evaluate(() => document.activeElement?.getAttribute("type"))) === "radio");

/* ─────────── 2. Mosottság-jelölések az anyagválasztóban ─────────── */
console.log("\n── 2. Mosottság-jelölések ──");
const card = (name) => page.locator("label.variant-card", { hasText: name });
const toltoText = await card("Töltősóder").innerText();
check("töltősóder: „Nem mosott”", /Nem mosott/.test(toltoText));
check("töltősóder: nincs „mosott sóder” badge", !/Jó minőségű, mosott sóder/.test(toltoText));
check("0–24 sóder: mosott jelölés megmaradt", /Jó minőségű, mosott sóder/.test(await card("0–24 sóder").innerText()));
await page.getByRole("radio", { name: /0–24 sóder/ }).check();
await page.getByRole("button", { name: "Kavics", exact: true }).click();
const kuleText = await card("Kulé").innerText();
check("kulé: „Egyszer mosott”", /Egyszer mosott/.test(kuleText));
check("kulé: teljes magyarázat", /egyszeri mosáson átesett, de nem olyan tiszta, mint az osztályozott kavicsok/.test(kuleText));
check("kulé: osztályozatlan megmaradt", /osztályozatlan/.test(kuleText));
check("kulé: nincs „mosott kavics” badge", !/Jó minőségű, mosott kavics/.test(kuleText));
check("anyagváltáskor a korábbi (sóder) frakció nem marad kiválasztva", (await page.locator("input.variant-radio:checked").count()) === 0);
await page.getByRole("button", { name: "Sóder", exact: true }).click();
await page.getByRole("radio", { name: /0–24 sóder/ }).check();

/* ─────────── 3. Mennyiség: alap 1 m³, megmarad visszalépéskor ─────────── */
console.log("\n── 3. Mennyiség ──");
await next(/Tovább: mennyiség/);
await onlyStep(2, "2. lépés");
check("a 2. lépés címe kapja a fókuszt", (await activeId()) === "step-2-cim");
check("új kalkuláció alapértéke 1 m³", (await m3Value()) === 1);
await page.locator("input[type=range]").fill("8");
check("a csúszka 8 m³-re állítható", (await m3Value()) === 8);
await page.getByRole("button", { name: "Vissza", exact: true }).click();
await onlyStep(1, "vissza az 1. lépésre");
check("visszalépéskor a választott anyag megmaradt", await page.getByRole("radio", { name: /0–24 sóder/ }).isChecked());
await next(/Tovább: mennyiség/);
check("előrelépéskor a 8 m³ megmaradt", (await m3Value()) === 8);

/* ─────────── 4. Cím: külön Tovább, összesítő nincs alatta ─────────── */
console.log("\n── 4. Szállítási cím ──");
await next(/Tovább: szállítási cím/);
await onlyStep(3, "3. lépés");
check("a 3. lépés címe kapja a fókuszt", (await activeId()) === "step-3-cim");
check("a cím alatt NINCS összesítő", !/Árösszesítő|Teljes bruttó tájékoztató összeg/.test(await mainText()));
check("a cím lépésben nincs név/e-mail mező", (await page.getByLabel(/^Név/).count()) === 0 && (await page.getByLabel(/E-mail/).count()) === 0);
await next(/Tovább: összesítés/);
check("üres címmel nem lép tovább", (await stepVisible(3)) === 1);
check("hibánál a fókusz a kerület mezőre kerül", (await page.evaluate(() => document.activeElement?.tagName)) === "SELECT");
await page.getByLabel(/Kerület/).selectOption("22");
await page.getByLabel(/Irányítószám/).fill("1221");
await page.getByLabel(/Utca, házszám/).fill("Teszt utca 1.");
await next(/Tovább: összesítés/);

/* ─────────── 5. Összesítés: hiteles árazás ─────────── */
console.log("\n── 5. Összesítés ──");
await onlyStep(4, "4. lépés");
let t = await mainText();
check("bruttó egységár 13 500 Ft/m³", t.includes("13 500 Ft/m³"));
check("anyag bruttó részösszeg 108 000 Ft", t.includes("108 000 Ft"));
check("fuvar nettó díj 45 000 Ft", t.includes("45 000 Ft"));
check("fuvar ÁFA 12 150 Ft", t.includes("12 150 Ft"));
check("fuvar bruttó díj 57 150 Ft", t.includes("57 150 Ft"));
check("teljes bruttó összeg 165 150 Ft", t.includes("165 150 Ft"));
check("a szállítási cím az összesítőben", t.includes("1221 Budapest XXII. kerület, Teszt utca 1."));
check("az összesítőn még nincs személyes adat mező", (await page.getByLabel(/^Név/).count()) === 0);

/* ─────────── 6. Kerület/irányítószám eltérés + XI. profilok ─────────── */
console.log("\n── 6. Eltérés és XI. kerület ──");
await page.getByRole("button", { name: /Vissza \/ Adatok módosítása/ }).click();
await onlyStep(3, "módosítás");
check("a cím adatai megmaradtak", (await page.getByLabel(/Irányítószám/).inputValue()) === "1221");
await page.getByLabel(/Kerület/).selectOption("11");
await next(/Tovább: összesítés/);
check("eltérésnél nem lép tovább", (await stepVisible(3)) === 1);
check("eltérésnél hibaüzenet", /nem a kiválasztott településhez vagy kerülethez tartozik/.test(await mainText()));
check("eltérésnél a fókusz az irányítószámra kerül", (await activeId()).endsWith("-isz"));
await page.getByLabel(/Irányítószám/).fill("1111");
await next(/Tovább: összesítés/);
check("XI. alap @ 8 m³ → 50 000 Ft nettó", (await mainText()).includes("50 000 Ft"));
await page.getByRole("button", { name: /Vissza \/ Adatok módosítása/ }).click();
await page.getByLabel(/Irányítószám/).fill("1112");
await next(/Tovább: összesítés/);
check("XI. 1112 @ 8 m³ → 60 000 Ft nettó (újraszámolva)", (await mainText()).includes("60 000 Ft"));

/* ─────────── 7. 10 m³ feletti mennyiség (lépésjelzőn át) ─────────── */
console.log("\n── 7. 10 m³ feletti mennyiség ──");
await page.locator('button[aria-label^="3. lépés"]').click();
await page.getByLabel(/Kerület/).selectOption("22");
await page.getByLabel(/Irányítószám/).fill("1221");
await page.locator('button[aria-label^="2. lépés"]').click();
await onlyStep(2, "lépésjelzővel vissza");
await page.getByRole("checkbox").first().check();
await page.locator('button[aria-label^="4. lépés"]').click();
t = await mainText();
check("10 m³ felett többfuvaros üzenet", /10 m³ feletti mennyiséghez/.test(t));
check("10 m³ felett nincs fuvardíj", !t.includes("45 000 Ft"));
await page.locator('button[aria-label^="2. lépés"]').click();
await page.getByRole("checkbox").first().uncheck();

/* ─────────── 8. I. kerületi Vár ─────────── */
console.log("\n── 8. I. kerületi Vár ──");
await page.locator('button[aria-label^="3. lépés"]').click();
await page.getByLabel(/Kerület/).selectOption("1");
await page.getByLabel(/Irányítószám/).fill("1011");
t = await mainText();
check("a Vár-kérdés megjelenik", /A szállítási cím a Vár területén található\?/.test(t));
await next(/Tovább: összesítés/);
check("válasz nélkül nem lép tovább", (await stepVisible(3)) === 1);
await page.getByRole("radio", { name: "Nem tudom", exact: true }).check();
await next(/Tovább: összesítés/);
t = await mainText();
check("Nem tudom → nincs garantált végösszeg", /Az engedély díja még nem ismert/.test(t));
check("az ismert fuvar tételek látszanak (40 000 / 10 800)", t.includes("40 000 Ft") && t.includes("10 800 Ft"));
await page.getByRole("button", { name: /Vissza \/ Adatok módosítása/ }).click();
await page.getByRole("radio", { name: "Nem", exact: true }).check();
await next(/Tovább: összesítés/);
check("Nem → teljes bruttó 158 800 Ft", (await mainText()).includes("158 800 Ft"));

/* ─────────── 9. Megrendelem → személyes adatok → beküldés (mock) ─────────── */
console.log("\n── 9. Rendelési igény ──");
await page.getByRole("button", { name: /Vissza \/ Adatok módosítása/ }).click();
await page.getByLabel(/Kerület/).selectOption("22");
await page.getByLabel(/Irányítószám/).fill("1221");
await next(/Tovább: összesítés/);
await page.getByRole("button", { name: /^Megrendelem/ }).click();
await onlyStep(5, "5. lépés");
check("az 5. lépés címe kapja a fókuszt", (await activeId()) === "step-5-cim");
t = await mainText();
check("kompakt emlékeztető: teljes összeg", t.includes("165 150 Ft"));
check("nem ismétli a teljes összesítőt", !/Fuvar ÁFA/.test(t));
check("a jogi tájékoztatás látszik", /A beküldés rendelési igénynek minősül\. A megrendelés a részletek egyeztetése és visszaigazolásunk után válik véglegessé\./.test(t));
await page.getByLabel(/^Név/).fill("Teszt Elek");
await page.getByLabel(/E-mail/).fill("nem-email");
await page.getByLabel(/Telefon/).fill("+36 30 123 4567");
await page.getByRole("checkbox", { name: /adatkezelési tájékoztatót/ }).check();
await page.getByRole("button", { name: /Rendelési igény elküldése/ }).click();
await page.waitForTimeout(300);
check("érvénytelen e-mail esetén nincs beküldés", /érvényes e-mail-címet/.test(await mainText()));
check("hibánál a fókusz az e-mail mezőre kerül", (await page.evaluate(() => document.activeElement?.getAttribute("type"))) === "email");
check("a beírt adatok megmaradtak", (await page.getByLabel(/^Név/).inputValue()) === "Teszt Elek");

await page.getByLabel(/E-mail/).fill("teszt@example.com");
await page.getByRole("button", { name: /Rendelési igény elküldése/ }).click();
await page.waitForSelector("[data-call-region='order_intent_success'], [data-call-region='order_intent_error']", { timeout: 20000 });
t = await mainText();
check("a beküldés sikeres állapotot ad", (await page.locator("[data-call-region='order_intent_success']").count()) === 1);
check("a mock mód egyértelműen jelölt", /MOCK MÓD/.test(t));
check("a siker NEM végleges megrendelés-visszaigazolás", /nem végleges megrendelés/.test(t));
check("sikeres küldés után a gomb nem küld újra", await page.getByRole("button", { name: /Rendelési igény elküldése/ }).isDisabled());

/* ─────────── 10. Új kalkuláció → 1 m³ ─────────── */
console.log("\n── 10. Reset ──");
await page.getByRole("button", { name: "Új kalkuláció" }).click();
await onlyStep(1, "reset után");
check("reset után nincs kiválasztott változat", (await page.locator("input.variant-radio:checked").count()) === 0);
await page.getByRole("radio", { name: /0–4 sóder/ }).check();
await next(/Tovább: mennyiség/);
check("reset után 1 m³", (await m3Value()) === 1);

/* ─────────── 11. Régi (v3) piszkozat 8 m³-rel nem töltődik vissza ─────────── */
console.log("\n── 11. Régi piszkozat ──");
await goCalc({
  "arkalkulator-draft-v3": JSON.stringify({ itemSlug: "soder-0-24", m3: 8, municipalityId: "budapest", districtId: 22, postalCode: "" }),
});
await page.getByRole("radio", { name: /0–24 sóder/ }).check();
await next(/Tovább: mennyiség/);
check("régi 8 m³-es piszkozat mellett is 1 m³ az alap", (await m3Value()) === 1);

/* ─────────── 12. Konzolhibák ─────────── */
console.log("\n── 12. Konzol ──");
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
