/**
 * TÁRHELY E2E — a teljes folyamat a böngészőtől a levél átadásáig, valódi
 * e-mail NÉLKÜL.
 *
 * Előfeltétel: `out/` gyökérútvonalra épült (basePath nélkül),
 * NEXT_PUBLIC_ORDER_API_URL=/api/rendeles.php értékkel, és az `out/api/`
 * mappában ott a server/php/api tartalma.
 *
 * A `php -S` szerver a statikus exportot ÉS a PHP-végpontot szolgálja ki; a
 * PHP mail() egy helyi „sendmail" csonkba ír (fájlba), így ellenőrizhető a
 * levél tartalma, de semmi nem megy ki. Második kör: a küldő hibázik → az
 * űrlap hibát mutat, és az adatok megmaradnak.
 *
 * Futtatás: node scripts/hosting-e2e.mjs
 */
import { spawn } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright";

const OUT = resolve("out");
if (!existsSync(join(OUT, "api", "rendeles.php"))) throw new Error("Hiányzik az out/api/rendeles.php");

let passed = 0;
const failures = [];
const check = (label, cond) => {
  if (cond) passed++;
  else failures.push(label);
  console.log(`${cond ? "OK  " : "FAIL"} ${label}`);
};

async function serve(port, sendmail) {
  const state = mkdtempSync(join(tmpdir(), "e2e-state-"));
  const proc = spawn("php", ["-d", `sendmail_path=${sendmail}`, "-S", `127.0.0.1:${port}`, "-t", OUT], {
    env: { ...process.env, ORDER_STATE_DIR: state },
    stdio: "ignore",
  });
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`http://127.0.0.1:${port}/api/rendeles.php?allapot=1`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return proc;
}

async function fillAndSubmit(page, origin) {
  await page.goto(`${origin}/arkalkulator/`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  await page.getByRole("radio", { name: /0–24 sóder/ }).check();
  await page.getByRole("button", { name: /Tovább: mennyiség/ }).click();
  await page.locator("input[type=range]").fill("8");
  await page.getByRole("button", { name: /Tovább: szállítási cím/ }).click();
  await page.getByLabel(/Kerület/).selectOption("22");
  await page.getByLabel(/Irányítószám/).fill("1221");
  await page.getByLabel(/Utca, házszám/).fill("E2E utca 1.");
  await page.getByRole("button", { name: /Tovább: összesítés/ }).click();
  await page.getByRole("button", { name: /^Megrendelem/ }).click();
  await page.getByLabel(/^Név/).fill("E2E Teszt");
  await page.getByLabel(/E-mail/).fill("e2e@example.com");
  await page.getByLabel(/Telefon/).fill("+36 30 123 4567");
  await page.getByRole("checkbox", { name: /adatkezelési tájékoztatót/ }).check();
  const btn = page.getByRole("button", { name: /Rendelési igény elküldése/ });
  page.on("response", (r) => {
    if (r.url().includes("/api/")) console.log(`     [hálózat] ${r.request().method()} ${r.url()} → ${r.status()}`);
  });
  page.on("console", (m) => {
    if (m.type() === "error") console.log(`     [konzol] ${m.text().slice(0, 200)}`);
  });
  await btn.click();
  return btn;
}

const browser = await chromium.launch({ headless: true });

/* ── 1. Sikeres átadás ── */
{
  const sink = mkdtempSync(join(tmpdir(), "e2e-mail-"));
  const mailFile = join(sink, "uzenet.eml");
  const port = 18810;
  // A csonk szkriptfájl: az ini-értékben a „;" megjegyzést nyitna.
  const stub = join(sink, "sendmail-csonk.sh");
  writeFileSync(stub, `#!/bin/sh\nsleep 1\ncat > "${mailFile}"\n`);
  chmodSync(stub, 0o755);
  const proc = await serve(port, stub);
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await fillAndSubmit(page, `http://127.0.0.1:${port}`);
  await page.waitForTimeout(200);
  check("küldés közben „Küldés folyamatban…”", /Küldés folyamatban/.test(await page.locator("main").innerText()));
  check("küldés közben a gomb tiltott (nincs dupla kattintás)", await page.locator("button[type=submit]").isDisabled());
  await page.waitForSelector("[data-call-region='order_intent_success'], [data-call-region='order_intent_error']", { timeout: 20000 });
  const t = await page.locator("main").innerText();
  if (!/továbbítottuk/.test(t)) console.log(`     [oldal] ${t.slice(-700).replace(/\s+/g, " ")}`);
  check("sikerüzenet a szerver átvétele után", (await page.locator("[data-call-region='order_intent_success']").count()) === 1);
  check("nem mock, nem „nincs konfigurálva”", !/MOCK|nincs konfigurálva/i.test(t));
  check("a siker nem végleges megrendelés", /nem végleges megrendelés/.test(t));
  const raw = existsSync(mailFile) ? readFileSync(mailFile, "utf8") : "";
  const body = Buffer.from(raw.split(/\r?\n\r?\n/).slice(1).join("").replace(/\s+/g, ""), "base64").toString("utf8");
  check("a levél az info@soderarak.hu címre szól", /^To: info@soderarak\.hu/m.test(raw));
  check("Reply-To a beküldő", /^Reply-To: e2e@example\.com/m.test(raw));
  check("a levél tartalmazza a kalkulációt", body.includes("Név: E2E Teszt") && body.includes("Teljes bruttó tájékoztató összeg: 165 150 Ft") && body.includes("Szállítási cím (utca, házszám): E2E utca 1."));
  check("nincs kliensoldali hiba", errors.length === 0);
  await page.close();
  proc.kill();
}

/* ── 2. A küldő hibája ── */
{
  const port = 18811;
  // Elérhetetlen küldőprogram → a PHP mail() false-t ad (a levelet senki nem vette át).
  const proc = await serve(port, "/nem-letezo/sendmail");
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await fillAndSubmit(page, `http://127.0.0.1:${port}`);
  await page.waitForSelector("[data-call-region='order_intent_success'], [data-call-region='order_intent_error']", { timeout: 20000 });
  const t = await page.locator("main").innerText();
  check("küldőhiba → hibaüzenet, nincs siker", (await page.locator("[data-call-region='order_intent_error']").count()) === 1 && !/továbbítottuk/.test(t));
  check("a hibaüzenet magyar és telefonszámot ad", /nem sikerült/.test(t) && t.includes("+36 30 852 8909"));
  check("a kitöltött adatok megmaradtak", (await page.getByLabel(/^Név/).inputValue()) === "E2E Teszt" && (await page.getByLabel(/E-mail/).inputValue()) === "e2e@example.com");
  check("újra elküldhető", !(await page.locator("button[type=submit]").isDisabled()));
  await page.close();
  proc.kill();
}

await browser.close();
console.log(`\nhosting-e2e: ${passed} OK, ${failures.length} FAIL`);
if (failures.length) process.exit(1);
