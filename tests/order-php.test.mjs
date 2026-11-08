/**
 * PHP RENDELÉSI VÉGPONT — server/php/api/rendeles.php, valódi `php -S` szerverrel.
 *
 * Valódi e-mailt NEM küld: a tesztek a csak tesztre szolgáló „file" (levél
 * fájlba írása) és „fail" (küldő elutasítása) módot használják.
 *
 * Ellenőrzi: érvényes beküldés, fix címzett, Reply-To, levéltartalom, a
 * szerveroldali összeg egyezése a TS-árazással, hiányos/hibás mezők,
 * fejléc-injekció, csapda-mező, idegen origin, rossz formátum, méretkorlát,
 * dupla beküldés, rate limit, a küldő hibája (502 — nincs hamis siker).
 *
 * Futtatás: node --experimental-strip-types tests/order-php.test.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { computeQuote } from "../src/lib/quote.ts";
import { findMaterial, PRICING_VERSION } from "../src/content/catalog.ts";
import { check, eq, section, finish } from "./_harness.mjs";

if (spawnSync("php", ["-v"]).status !== 0) {
  console.log("PHP nem érhető el — a PHP-végpont teszt kihagyva.");
  process.exit(0);
}
if (spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "scripts/build-order-data.mjs", "--check"], { stdio: "inherit" }).status !== 0) {
  console.log("FAIL a rendeles-adatok.php elavult");
  process.exit(1);
}

const DOCROOT = resolve("server/php");
let port = 18700;

async function startServer(env, phpArgs = []) {
  const p = port++;
  const state = mkdtempSync(join(tmpdir(), "rendeles-state-"));
  const mails = mkdtempSync(join(tmpdir(), "rendeles-mail-"));
  const proc = spawn("php", [...phpArgs, "-S", `127.0.0.1:${p}`, "-t", DOCROOT], {
    env: { ...process.env, ORDER_STATE_DIR: state, ORDER_TEST_DIR: mails, ...env },
    stdio: "ignore",
  });
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`http://127.0.0.1:${p}/api/rendeles.php?allapot=1`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return { url: `http://127.0.0.1:${p}/api/rendeles.php`, origin: `http://127.0.0.1:${p}`, mails, stop: () => proc.kill() };
}

const base = (over = {}) => ({
  name: "Teszt Elek",
  email: "teszt@example.com",
  phone: "+36 30 123 4567",
  materialSlug: "soder-0-24",
  m3: 8,
  municipalityId: "budapest",
  districtId: 22,
  postalCode: "1221",
  address: "Teszt utca 1.",
  preferredDate: "2026-11-10",
  castleAnswer: "",
  note: "Hátsó kapun kérem.",
  website: "",
  pricingVersion: PRICING_VERSION,
  clientTotalGross: 165150,
  idempotencyKey: `teszt-${Math.random().toString(36).slice(2, 12)}`,
  privacyAccepted: true,
  ...over,
});

async function post(srv, body, { origin = srv.origin, type = "application/json", raw } = {}) {
  const headers = { "content-type": type, "x-soderarak-teszt": "1" };
  if (origin) headers.origin = origin;
  const res = await fetch(srv.url, { method: "POST", headers, body: raw ?? JSON.stringify(body) });
  let json = {};
  try {
    json = await res.json();
  } catch {
    /* nem JSON */
  }
  return { status: res.status, json };
}

const mailsIn = (srv) => readdirSync(srv.mails).map((f) => readFileSync(join(srv.mails, f), "utf8"));

/* ───────────── 1. Érvényes beküldés ───────────── */
section("Érvényes beküldés (file mód — nem küld valódi levelet)");
const srv = await startServer({ ORDER_TRANSPORT: "file", ORDER_RATE_LIMIT: "100" });
{
  const st = await (await fetch(`${srv.url}?allapot=1`)).json();
  check("állapotjelzés: a végpont fut, titkot nem ad ki", st.ok === true && !JSON.stringify(st).includes("@"));
  const r = await post(srv, base());
  eq("200 válasz", r.status, 200);
  check("ok: true, nem mock, nem duplikált", r.json.ok === true && r.json.mock === false && r.json.duplicate === false);
  eq("szerveroldali teljes összeg (XXII., 8 m³ 0–24)", r.json.serverTotalGross, 165150);
  eq("nincs összeg-eltérés", r.json.totalMismatch, false);
  const mails = mailsIn(srv);
  eq("pontosan egy levél készült", mails.length, 1);
  const m = mails[0] ?? "";
  check("címzett fix: info@soderarak.hu", /^To: info@soderarak\.hu\r?$/m.test(m));
  check("Reply-To a beküldő címe", /^Reply-To: teszt@example\.com\r?$/m.test(m));
  check("feladó a konfigurált cím (nem a beküldőé)", /^From: .*<info@soderarak\.hu>\r?$/m.test(m));
  check("tesztlevél jelölve a tárgyban", /^Subject: \[TESZT\] Rendelési igény/m.test(m));
  for (const needle of [
    "Név: Teszt Elek",
    "E-mail: teszt@example.com",
    "Telefon: +36 30 123 4567",
    "Anyag és termékváltozat: Sóder — 0–24 sóder (0–24 mm)",
    "Mosottság: Jó minőségű, mosott sóder",
    "Mennyiség: 8 m³",
    "Település: Budapest",
    "Kerület: XXII.",
    "Irányítószám: 1221",
    "Szállítási cím (utca, házszám): Teszt utca 1.",
    "Kívánt időpont: 2026-11-10",
    "Anyag bruttó egységár: 13 500 Ft/m³",
    "Anyag bruttó részösszeg: 108 000 Ft",
    "Fuvar nettó díj (7–10 m³): 45 000 Ft",
    "Fuvar ÁFA (27%): 12 150 Ft",
    "Fuvar bruttó díj: 57 150 Ft",
    "Teljes bruttó tájékoztató összeg: 165 150 Ft",
    "Hátsó kapun kérem.",
    "A beküldés rendelési igénynek minősül",
    `Árazási verzió: ${PRICING_VERSION}`,
  ]) {
    check(`levél tartalmazza: ${needle}`, m.includes(needle));
  }
}

/* ───────────── 2. Szerveroldali árazás = TS-árazás ───────────── */
section("Szerveroldali összeg egyezik a kalkulátorral");
for (const [slug, m3, muni, d, zip, castle] of [
  ["soder-0-24", 1, "budapest", 22, "1221", ""],
  ["tolto-soder", 3, "budapest", 11, "1112", ""],
  ["kule", 6, "budapest", 13, "1131", ""],
  ["murva-0-22", 10, "erd", null, "2030", ""],
  ["toltofold", 9, "budapest", 1, "1011", "nem"],
  ["toltofold", 9, "budapest", 1, "1011", "nem-tudom"],
  ["soder-0-4", 4, "budapest", 22, "1111", ""],
  ["soder-0-4", 4, "budapest", 22, "9999", ""],
]) {
  const q = computeQuote({
    item: findMaterial(slug),
    m3,
    freight: { municipalityId: muni, districtId: d, postalCode: zip, m3 },
    castleAnswer: castle,
  });
  const r = await post(srv, base({ materialSlug: slug, m3, municipalityId: muni, districtId: d, postalCode: zip, castleAnswer: castle, clientTotalGross: q.totalGross }));
  check(`${slug} ${m3} m³ ${zip}${castle ? ` (Vár: ${castle})` : ""}: ${q.totalGross ?? "egyeztetés"} = ${r.json.serverTotalGross ?? "egyeztetés"}`, r.status === 200 && r.json.serverTotalGross === q.totalGross && r.json.totalMismatch === false);
}
{
  const r = await post(srv, base({ clientTotalGross: 1 }));
  check("manipulált kliens-összeg: a szerver a hiteleset írja, eltérést jelez", r.json.serverTotalGross === 165150 && r.json.totalMismatch === true);
}

/* ───────────── 3. Hibás / hiányos mezők ───────────── */
section("Validáció");
for (const [field, over] of [
  ["name", { name: "" }],
  ["email", { email: "nem-email" }],
  ["phone", { phone: "abc" }],
  ["materialSlug", { materialSlug: "nincs-ilyen" }],
  ["m3", { m3: 11 }],
  ["m3", { m3: 2.5 }],
  ["municipalityId", { municipalityId: "pecs" }],
  ["districtId", { districtId: null }],
  ["postalCode", { postalCode: "12" }],
  ["address", { address: "" }],
  ["privacyAccepted", { privacyAccepted: false }],
  ["castleAnswer", { castleAnswer: "talán" }],
]) {
  const r = await post(srv, base(over));
  check(`${field} hibás → 422 + mezőhiba (${JSON.stringify(over)})`, r.status === 422 && typeof r.json.errors?.[field] === "string");
}

/* ───────────── 4. Injekció és visszaélés ───────────── */
section("Biztonság");
{
  const before = mailsIn(srv).length;
  const r1 = await post(srv, base({ email: "a@example.com\r\nBcc: x@evil.test" }));
  eq("CRLF az e-mail mezőben → 422", r1.status, 422);
  const r2 = await post(srv, base({ email: "a@example.com, x@evil.test" }));
  eq("több cím az e-mail mezőben → 422", r2.status, 422);
  const r3 = await post(srv, base({ name: "Teszt\r\nBcc: x@evil.test", idempotencyKey: "inj-0000001" }));
  eq("CRLF a névben → elfogadva, de tisztítva", r3.status, 200);
  const m = mailsIn(srv).find((t) => t.includes("inj-0000001")) ?? "";
  check("nincs befecskendezett Bcc fejléc", !/^Bcc:/im.test(m));
  check("a név egy sorba tisztítva", m.includes("Név: Teszt Bcc: x@evil.test"));
  const r4 = await post(srv, base({ website: "http://spam.test" }));
  eq("kitöltött csapda-mező → 422", r4.status, 422);
  const r5 = await post(srv, base(), { origin: "https://idegen.example" });
  eq("idegen origin → 403", r5.status, 403);
  const r6 = await post(srv, base(), { type: "text/plain" });
  eq("nem JSON → 415", r6.status, 415);
  const r7 = await post(srv, null, { raw: JSON.stringify(base({ note: "x".repeat(20000) })) });
  eq("16 KB feletti törzs → 413", r7.status, 413);
  const r8 = await post(srv, null, { raw: "{nem json" });
  eq("hibás JSON → 400", r8.status, 400);
  const r9 = await fetch(srv.url);
  eq("GET → 405", r9.status, 405);
  eq("a hibás kérésekből nem lett levél (csak a tisztított névvel küldött)", mailsIn(srv).length, before + 1);
}

/* ───────────── 5. Dupla beküldés ───────────── */
section("Dupla beküldés");
{
  const body = base({ idempotencyKey: "dupla-0000001" });
  const [a, b] = await Promise.all([post(srv, body), post(srv, body)]);
  const c = await post(srv, body);
  const n = mailsIn(srv).filter((t) => t.includes("dupla-0000001")).length;
  check("az ismételt kattintás nem hibázik", a.status === 200 && b.status === 200 && c.status === 200);
  check("a harmadik kérés duplikáltként jelölt", c.json.duplicate === true);
  check(`legfeljebb egy levél ugyanarra a kulcsra a későbbi kéréseknél (${n})`, n >= 1 && n <= 2);
}
srv.stop();

/* ───────────── 6. Rate limit ───────────── */
section("Rate limit");
{
  const s2 = await startServer({ ORDER_TRANSPORT: "file", ORDER_RATE_LIMIT: "3" });
  const codes = [];
  for (let i = 0; i < 4; i++) codes.push((await post(s2, base())).status);
  check(`3 után 429 (${codes.join(",")})`, codes.slice(0, 3).every((c) => c === 200) && codes[3] === 429);
  s2.stop();
}

/* ───────────── 7. A küldő hibája ───────────── */
section("Küldőszolgáltatás hibája");
{
  const s3 = await startServer({ ORDER_TRANSPORT: "fail" });
  const r = await post(s3, base());
  eq("a küldő elutasítja → 502", r.status, 502);
  check("nincs hamis siker", r.json.ok === false);
  check("magyar hibaüzenet telefonos alternatívával", /nem sikerült/.test(r.json.message) && r.json.message.includes("+36 30 852 8909"));
  check("belső részlet nem szivárog", !/fail|smtp|transport/i.test(r.json.message));
  const again = await post(s3, base({ idempotencyKey: r.json.idempotencyKey ?? "ujra-0000001" }));
  eq("hiba után az újrapróba nem duplikáltként kezelt", again.json.duplicate ?? false, false);
  s3.stop();
}
{
  const s4 = await startServer({ ORDER_TRANSPORT: "smtp", ORDER_SMTP_HOST: "127.0.0.1", ORDER_SMTP_PORT: "1", ORDER_SMTP_SECURE: "tls" });
  const r = await post(s4, base());
  eq("elérhetetlen SMTP-szerver → 502, nincs hamis siker", r.status, 502);
  s4.stop();
}

/* ───────────── 7b. További fix címzett (szerveroldali konfig) ───────────── */
section("További címzett: csak konfigból, validálva");
{
  const s6 = await startServer({
    ORDER_TRANSPORT: "file",
    ORDER_RATE_LIMIT: "100",
    ORDER_EXTRA_RECIPIENTS: "masolat@example.com, nem-email, info@soderarak.hu,\r\nBcc: x@evil.test",
  });
  const r = await post(s6, base({ idempotencyKey: "extra-0000001", recipients: ["tamado@evil.test"], to: "tamado@evil.test" }));
  eq("200 válasz", r.status, 200);
  const m = mailsIn(s6).find((t) => t.includes("extra-0000001")) ?? "";
  check("To: info@soderarak.hu + a konfigurált másolat", /^To: info@soderarak\.hu, masolat@example\.com\r?$/m.test(m));
  check("érvénytelen / duplikált / injektált konfigérték kiszűrve", !/nem-email|evil\.test/.test(m.split(/\r?\n\r?\n/)[0]));
  check("a kliens nem adhat hozzá címzettet", !m.includes("tamado@evil.test"));
  s6.stop();
}

/* ───────────── 8. Az éles mail() út, helyi „sendmail" csonkkal ───────────── */
section("PHP mail() — éles kódút, valódi küldés nélkül");
{
  const sink = mkdtempSync(join(tmpdir(), "rendeles-sendmail-"));
  const out = join(sink, "uzenet.eml");
  const s5 = await startServer({ ORDER_EXTRA_RECIPIENTS: "masolat@example.com" }, ["-d", `sendmail_path=sh -c 'cat > ${out}'`]);
  const r = await post(s5, base({ name: "Árvíztűrő Tükörfúrógép" }));
  eq("mail() átvette → 200", r.status, 200);
  const raw = readFileSync(out, "utf8");
  check("To: info@soderarak.hu és a másolat címzett (mail())", /^To: info@soderarak\.hu, masolat@example\.com/m.test(raw));
  check("Subject UTF-8 kódolva", /^Subject: =\?UTF-8\?B\?/m.test(raw));
  check("Reply-To fejléc", /^Reply-To: teszt@example\.com/m.test(raw));
  check("UTF-8 base64 törzs", /Content-Transfer-Encoding: base64/.test(raw));
  const body = Buffer.from(raw.split(/\r?\n\r?\n/).slice(1).join("").replace(/\s+/g, ""), "base64").toString("utf8");
  check("a törzs ékezetesen olvasható", body.includes("Név: Árvíztűrő Tükörfúrógép") && body.includes("Teljes bruttó tájékoztató összeg: 165 150 Ft"));
  s5.stop();
}

section("Számlázási adatok (opcionális blokk)");
{
  const srvB = await startServer({ ORDER_TRANSPORT: "file", ORDER_RATE_LIMIT: "100" });
  const byKey = (k) => readFileSync(join(srvB.mails, `${k}.eml`), "utf8");
  // 1) blokk nélkül
  const k0 = "bill-none-php-0001";
  const r0 = await post(srvB, base({ idempotencyKey: k0 }));
  eq("számlázás nélkül: 200", r0.status, 200);
  check("számlázás nélkül: a levél jelzi a hiányt", byKey(k0).includes("Nem adott meg számlázási adatot"));
  // 2) magánszemély — a kliens által becsempészett adószám nem kerül a levélbe
  const k1 = "bill-priv-php-0001";
  const r1 = await post(srvB, base({
    idempotencyKey: k1,
    billing: { customerType: "private", name: "Árvíztűrő Tükörfúrógép", taxNumber: "12345678-2-42",
      address: { country: "Magyarország", postalCode: "1221", city: "Budapest", streetAddress: "Nagytétényi út 123.", additionalAddress: "B lph. 4/12" } },
  }));
  eq("magánszemély: 200", r1.status, 200);
  const m1 = byKey(k1);
  check("magánszemély: Vevő típusa", /── Vevő típusa ──\r?\nMagánszemély/.test(m1));
  check("magánszemély: számlázási név", m1.includes("Számlázási név: Árvíztűrő Tükörfúrógép"));
  check("magánszemély: NINCS adószám a levélben", !m1.includes("Adószám") && !m1.includes("12345678"));
  check("magánszemély: további címadat", m1.includes("További címadat: B lph. 4/12"));
  check("a szállítási cím külön blokk", /── Szállítási adatok ──[\s\S]*Teszt utca 1\./.test(m1));
  // 3) cég
  const k2 = "bill-biz-php-0001";
  const r2 = await post(srvB, base({
    idempotencyKey: k2,
    billing: { customerType: "business", name: "Példa Építő Kft.", taxNumber: "12345678242",
      address: { country: "Magyarország", postalCode: "2030", city: "Érd", streetAddress: "Fő utca 1.", additionalAddress: "" } },
  }));
  eq("cég: 200", r2.status, 200);
  const m2 = byKey(k2);
  check("cég: Cég / egyéni vállalkozó", m2.includes("Cég / egyéni vállalkozó"));
  check("cég: normalizált adószám + formai jelzés", m2.includes("Adószám: 12345678-2-42 (formailag ellenőrizve, NAV-nál nem)"));
  check("cég: blokkok sorrendje", /Vevő típusa[\s\S]*Számlázási adatok[\s\S]*Kapcsolattartó[\s\S]*Szállítási adatok[\s\S]*Kalkuláció és kért anyag[\s\S]*Árösszesítő/.test(m2));
  eq("cég: a végösszeg változatlan", r2.json.serverTotalGross, 165150);
  // 4) hibás / részleges
  const r3 = await post(srvB, base({ idempotencyKey: "bill-bad-php-0001",
    billing: { customerType: "business", name: "Példa Kft.", taxNumber: "1234",
      address: { country: "Magyarország", postalCode: "", city: "Érd", streetAddress: "", additionalAddress: "" } } }));
  eq("hibás blokk: 422", r3.status, 422);
  check("hibás blokk: konkrét mezőhibák", Boolean(r3.json.errors?.["billing.taxNumber"]) && Boolean(r3.json.errors?.["billing.address.postalCode"]) && Boolean(r3.json.errors?.["billing.address.streetAddress"]));
  check("hibás blokk: a többi mezőre nincs hiba", !r3.json.errors?.["billing.name"] && !r3.json.errors?.name);
  // 5) injection
  const k4 = "bill-inj-php-0001";
  await post(srvB, base({ idempotencyKey: k4,
    billing: { customerType: "business", name: "Rossz Kft.\r\nBcc: x@example.com", taxNumber: "12345678-2-42",
      address: { country: "Magyarország", postalCode: "1221", city: "Budapest", streetAddress: "Fő u. 1.", additionalAddress: "" } } }));
  const m4 = byKey(k4);
  check("injection: nincs Bcc fejléc", !/^Bcc:/mi.test(m4));
  check("injection: a név egy sorban", m4.includes("Cégnév / számlázási név: Rossz Kft. Bcc: x@example.com"));
  srvB.stop();
}

section("Számlázási adatok: szerverhiba, majd ismételt beküldés");
{
  const billing = { customerType: "business", name: "Ismétlő Bt.", taxNumber: "87654321-1-13",
    address: { country: "Magyarország", postalCode: "1011", city: "Budapest", streetAddress: "Fő utca 2.", additionalAddress: "" } };
  const key = "bill-retry-php-0001";
  const failing = await startServer({ ORDER_TRANSPORT: "fail", ORDER_RATE_LIMIT: "100" });
  const r1 = await post(failing, base({ idempotencyKey: key, billing }));
  eq("küldőhiba: 502", r1.status, 502);
  check("küldőhiba: nincs hamis siker", r1.json.ok === false);
  failing.stop();
  const ok = await startServer({ ORDER_TRANSPORT: "file", ORDER_RATE_LIMIT: "100" });
  const r2 = await post(ok, base({ idempotencyKey: key, billing }));
  eq("ismételt beküldés ugyanazzal a kulccsal: 200", r2.status, 200);
  const m = readFileSync(join(ok.mails, `${key}.eml`), "utf8");
  check("ismételt beküldés: a számlázási adatok a levélben", m.includes("Cégnév / számlázási név: Ismétlő Bt.") && m.includes("Adószám: 87654321-1-13"));
  ok.stop();
}

finish("order-php");
