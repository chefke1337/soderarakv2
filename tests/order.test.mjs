/**
 * V3 RENDELÉSI IGÉNY — validáció, backend és biztonság.
 *
 * Ellenőrzi: e-mailvalidáció, szerveroldali validáció, hiteles (szerveroldali)
 * árújraszámolás, dupla beküldés, rate limit, backend hiba, injection elleni
 * védelem, biztonságos hibakezelés, mock mód egyértelmű jelölése.
 *
 * Futtatás: npm run test:order
 */
import {
  clientTotalMismatch,
  isValidEmail,
  isValidPhone,
  recomputeOrderQuote,
  sanitizeBlock,
  sanitizeLine,
  validateOrderRequest,
  isHuTaxNumberShape,
  normalizeHuTaxNumber,
} from "../src/lib/order.ts";
import {
  createMemoryIdempotencyStore,
  createMemoryRateLimiter,
  createMockSender,
  handleOrderRequest,
  MAX_BODY_BYTES,
  renderOrderEmail,
} from "../src/server/order-handler.ts";
import { PRICING_VERSION } from "../src/content/catalog.ts";
import { check, eq, section, finish } from "./_harness.mjs";

/* ─────────────── Segédek ─────────────── */

const base = () => ({
  name: "Teszt Elek",
  email: "teszt@example.com",
  phone: "+36 30 123 4567",
  materialSlug: "soder-0-24",
  m3: 8,
  municipalityId: "budapest",
  districtId: 22,
  postalCode: "1221",
  address: "Teszt utca 1.",
  preferredDate: "",
  castleAnswer: "",
  note: "",
  pricingVersion: PRICING_VERSION,
  clientTotalGross: 165150,
  idempotencyKey: "soder-teszt-0001",
  privacyAccepted: true,
});

function freshDeps(overrides = {}) {
  const sent = [];
  return {
    sent,
    deps: {
      sendEmail: createMockSender((m) => sent.push(m)),
      rateLimit: createMemoryRateLimiter({ windowMs: 60_000, max: 50 }),
      idempotency: createMemoryIdempotencyStore(),
      mock: true,
      ...overrides,
    },
  };
}

const post = (body, deps, extra = {}) =>
  handleOrderRequest(
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      bodyText: typeof body === "string" ? body : JSON.stringify(body),
      clientIp: "203.0.113.7",
      ...extra,
    },
    deps,
  );

/* ─────────────── 1. E-mail és telefon validáció ─────────────── */
section("E-mail és telefon validáció");

for (const good of [
  "a@b.hu",
  "teszt@example.com",
  "elek.teszt+rendeles@sub.domain.co.uk",
  "ekezet@pelda.hu",
]) {
  check(`érvényes e-mail: ${good}`, isValidEmail(good));
}
for (const bad of [
  "",
  "a",
  "a@b",
  "a@b.",
  "@example.com",
  "teszt@",
  "teszt example.com",
  "teszt@@example.com",
  "a@b.c",
  "teszt@exam ple.com",
  "teszt@example.com, masik@example.com",
  "teszt@example.com\nBcc: lopas@example.com",
]) {
  check(`érvénytelen e-mail: ${JSON.stringify(bad)}`, !isValidEmail(bad));
}

for (const good of ["+36 30 123 4567", "0630-123-4567", "06 (30) 1234567", "+36301234567"]) {
  check(`érvényes telefon: ${good}`, isValidPhone(good));
}
for (const bad of ["", "123", "abcdefgh", "+36", "++3630123456789012345"]) {
  check(`érvénytelen telefon: ${JSON.stringify(bad)}`, !isValidPhone(bad));
}

/* ─────────────── 2. Szerveroldali validáció ─────────────── */
section("Szerveroldali validáció");

eq("érvényes kérés átmegy", validateOrderRequest(base()).ok, true);

const cases = [
  ["name", { name: "A" }],
  ["email", { email: "nem-email" }],
  ["phone", { phone: "12" }],
  ["m3", { m3: 11 }],
  ["m3", { m3: 0 }],
  ["m3", { m3: 2.5 }],
  ["postalCode", { postalCode: "12" }],
  ["address", { address: "x" }],
  ["materialSlug", { materialSlug: "nincs-ilyen-anyag" }],
  ["privacyAccepted", { privacyAccepted: false }],
  ["idempotencyKey", { idempotencyKey: "rovid" }],
];
for (const [field, patch] of cases) {
  const r = validateOrderRequest({ ...base(), ...patch });
  eq(`${field} hibás értéke elutasítva (${JSON.stringify(patch)})`, r.ok, false);
  if (!r.ok) check(`${field} hibája megnevezve`, Object.keys(r.errors).includes(field));
}

const noDistrict = validateOrderRequest({ ...base(), districtId: null });
eq("Budapest kerület nélkül elutasítva", noDistrict.ok, false);
if (!noDistrict.ok) check("a kerület hibája megnevezve", "districtId" in noDistrict.errors);

const erd = validateOrderRequest({
  ...base(),
  municipalityId: "erd",
  districtId: null,
  postalCode: "2030",
});
eq("Érd kerület nélkül elfogadva", erd.ok, true);

/* ─────────────── 3. Hiteles, szerveroldali árújraszámolás ─────────────── */
section("Hiteles árújraszámolás (a kliens összegét nem fogadjuk el)");

const validated = validateOrderRequest(base());
const serverQuote = recomputeOrderQuote(validated.value);
eq("szerveroldali teljes bruttó összeg", serverQuote.totalGross, 165150);
check(
  "egyező kliensösszegnél nincs eltérésjelzés",
  !clientTotalMismatch(validated.value, serverQuote),
);

const tampered = validateOrderRequest({ ...base(), clientTotalGross: 1 });
check(
  "manipulált kliensösszeg eltérésként jelenik meg",
  clientTotalMismatch(tampered.value, recomputeOrderQuote(tampered.value)),
);

{
  const { deps } = freshDeps();
  const res = await post({ ...base(), clientTotalGross: 1 }, deps);
  eq("manipulált összeg esetén is sikeres a beküldés", res.body.ok, true);
  eq("a válasz a SZERVER összegét adja vissza", res.body.serverTotalGross, 165150);
  eq("a válasz jelzi az eltérést", res.body.totalMismatch, true);
}

/* ─────────────── 4. Dupla beküldés ─────────────── */
section("Dupla beküldés (idempotencia)");

{
  const { sent, deps } = freshDeps();
  const first = await post(base(), deps);
  const second = await post(base(), deps);
  eq("első beküldés sikeres", first.body.ok, true);
  eq("első beküldés nem duplikált", first.body.duplicate, undefined);
  eq("második beküldés is 200-as", second.status, 200);
  eq("második beküldés duplikáltként jelölt", second.body.duplicate, true);
  eq("MÁSODIK levél NEM ment ki", sent.length, 1);

  const other = await post({ ...base(), idempotencyKey: "soder-teszt-0002" }, deps);
  eq("új kulccsal új beküldés megy", other.body.duplicate, undefined);
  eq("ekkor már két levél készült", sent.length, 2);
}

/* ─────────────── 5. Rate limit ─────────────── */
section("Rate limit");

{
  const { sent, deps } = freshDeps({
    rateLimit: createMemoryRateLimiter({ windowMs: 60_000, max: 3 }),
  });
  const codes = [];
  for (let i = 0; i < 5; i++) {
    const r = await post({ ...base(), idempotencyKey: `soder-rl-${i}-xxxx` }, deps);
    codes.push(r.status);
  }
  eq("az első három beküldés átmegy", codes.slice(0, 3).join(","), "200,200,200");
  eq("a negyedik 429-es", codes[3], 429);
  eq("az ötödik 429-es", codes[4], 429);
  eq("csak három levél készült", sent.length, 3);

  const blocked = await post({ ...base(), idempotencyKey: "soder-rl-9-xxxx" }, deps);
  check("a 429 megadja a várakozási időt", (blocked.body.retryAfterSeconds ?? 0) > 0);
  check(
    "a 429 üzenete magyar és telefonos alternatívát ajánl",
    /próbálja újra|hívjon/i.test(blocked.body.message),
  );
}

/* ─────────────── 6. Backend hiba és biztonságos hibakezelés ─────────────── */
section("Backend hiba");

{
  const { deps } = freshDeps({
    sendEmail: async () => {
      throw new Error("SMTP 535 Authentication failed: password=titkos-kulcs-123");
    },
  });
  const res = await post(base(), deps);
  eq("küldési hiba → 502", res.status, 502);
  eq("küldési hiba → ok:false", res.body.ok, false);
  check(
    "a hibaüzenet NEM szivárogtat belső részletet",
    !/SMTP|535|password|titkos-kulcs/i.test(res.body.message),
  );
  check(
    "a hibaüzenet magyar és alternatívát ajánl",
    /nem sikerült/i.test(res.body.message) && /hívjon|próbálja újra/i.test(res.body.message),
  );
}

{
  // Hibás küldés UTÁN a kulcs NEM kerül a „már feldolgozva" tárba —
  // így az újrapróbálás nem akad el duplikáltként.
  const sent = [];
  let fail = true;
  const deps = {
    sendEmail: async (m) => {
      if (fail) throw new Error("mock_provider_failure");
      sent.push(m);
    },
    rateLimit: createMemoryRateLimiter({ windowMs: 60_000, max: 50 }),
    idempotency: createMemoryIdempotencyStore(),
    mock: true,
  };
  const failed = await post(base(), deps);
  eq("első próbálkozás hibára fut", failed.status, 502);
  fail = false;
  const retried = await post(base(), deps);
  eq("újrapróbálás ugyanazzal a kulccsal sikeres", retried.body.ok, true);
  eq("újrapróbálás NEM duplikált", retried.body.duplicate, undefined);
  eq("a levél a második próbálkozáskor készült el", sent.length, 1);
}

/* ─────────────── 7. Protokoll-szintű védelem ─────────────── */
section("Protokoll-szintű védelem");

{
  const { deps } = freshDeps();
  eq(
    "GET elutasítva",
    (await handleOrderRequest({ method: "GET", headers: {}, bodyText: "", clientIp: "x" }, deps))
      .status,
    405,
  );
  eq(
    "hibás content-type elutasítva",
    (
      await handleOrderRequest(
        { method: "POST", headers: { "content-type": "text/plain" }, bodyText: "{}", clientIp: "x" },
        deps,
      )
    ).status,
    415,
  );
  eq("túl nagy törzs elutasítva", (await post("x".repeat(MAX_BODY_BYTES + 1), deps)).status, 413);
  eq("érvénytelen JSON elutasítva", (await post("{nem json", deps)).status, 400);
  eq("hiányos adat → 422", (await post({ ...base(), email: "nem" }, deps)).status, 422);
  const invalid = await post({ ...base(), email: "nem" }, deps);
  check("a 422 mezőhibákat ad vissza", Boolean(invalid.body.errors?.email));
}

/* ─────────────── 8. Injection elleni védelem ─────────────── */
section("Injection elleni védelem");

const CRLF = String.fromCharCode(13) + String.fromCharCode(10);
const NUL = String.fromCharCode(0);

eq(
  "egysoros mezőből eltűnik a CRLF",
  sanitizeLine(`Teszt${CRLF}Bcc: lopas@example.com`),
  "Teszt Bcc: lopas@example.com",
);
check("egysoros mezőben nincs sortörés", !sanitizeLine(`a${CRLF}b`).includes(String.fromCharCode(10)));
check("egysoros mezőből eltűnik a NUL", !sanitizeLine(`a${NUL}b`).includes(NUL));
eq("egysoros mező hossza korlátozott", sanitizeLine("x".repeat(500), 200).length, 200);
check(
  "többsoros mezőben megmarad a sortörés",
  sanitizeBlock(`első${CRLF}második`).includes(String.fromCharCode(10)),
);
check(
  "többsoros mezőben nincs CR",
  !sanitizeBlock(`a${CRLF}b`).includes(String.fromCharCode(13)),
);

{
  const { sent, deps } = freshDeps();
  const evil = {
    ...base(),
    idempotencyKey: "soder-inj-0001",
    name: `Teszt${CRLF}Bcc: lopas@example.com`,
    address: `Fő utca 1.${CRLF}Subject: hamis`,
    note: `Megjegyzés${CRLF}X-Header: injekcio${NUL}`,
  };
  const res = await post(evil, deps);
  eq("injection-kísérlet feldolgozva, nem dob hibát", res.body.ok, true);
  const mail = sent[0];
  check("a levél tárgya egy sor", !mail.subject.includes(String.fromCharCode(10)));
  check("a tárgyban nincs CR", !mail.subject.includes(String.fromCharCode(13)));
  check(
    "a Bcc-kísérlet nem lett önálló fejlécsor",
    !new RegExp(`${String.fromCharCode(10)}Bcc:`).test(mail.text),
  );
  check("a NUL karakter eltűnt a levélből", !mail.text.includes(NUL));
  check("az ügyfél címe válaszcím (reply-to)", mail.replyTo === "teszt@example.com");
  eq("a címzett a jóváhagyott cím", mail.to, "info@soderarak.hu");
}

/* ─────────────── 9. Mock mód egyértelmű jelölése ─────────────── */
section("Mock mód");

{
  const { sent, deps } = freshDeps({ mock: true });
  const res = await post({ ...base(), idempotencyKey: "soder-mock-001" }, deps);
  eq("a válasz mock:true", res.body.mock, true);
  check(
    "a válasz üzenete kimondja, hogy nem ment ki e-mail",
    /MOCK|mock/i.test(res.body.message) && /NEM ment ki/i.test(res.body.message),
  );
  check("a levél tárgya [MOCK] jelölésű", sent[0].subject.startsWith("[MOCK] "));
  check("a levél törzse jelzi a mock módot", /MOCK MÓD/.test(sent[0].text));
}

{
  const { sent, deps } = freshDeps({ mock: false });
  const res = await post({ ...base(), idempotencyKey: "soder-live-001" }, deps);
  eq("éles módban mock:false", res.body.mock, false);
  check("éles módban nincs [MOCK] előtag", !sent[0].subject.includes("[MOCK]"));
  check(
    "a siker-üzenet NEM nevezi végleges megrendelésnek",
    !/végleges megrendelés(t|ét)? (rögzítettük|visszaigazoltuk)/i.test(res.body.message) &&
      /visszaigazolás/i.test(res.body.message),
  );
}

/* ─────────────── 10. A levél tartalmazza a kötelező adatokat ─────────────── */
section("A levél kötelező tartalma");

{
  const v = validateOrderRequest({
    ...base(),
    preferredDate: "2026-11-05",
    note: "Hátsó kapun kérem.",
    idempotencyKey: "soder-mail-0001",
  }).value;
  const mail = renderOrderEmail(v, recomputeOrderQuote(v), { mismatch: false, mock: false });
  // A hu-HU ezres elválasztó nem törhető szóköz (U+00A0) — az összehasonlításhoz
  // normál szóközre normalizálunk, hogy a teszt a TARTALMAT ellenőrizze.
  const NBSP = new RegExp(String.fromCharCode(160), "g");
  const text = mail.text.replace(NBSP, " ");
  const must = [
    ["név", "Teszt Elek"],
    ["email", "teszt@example.com"],
    ["telefon", "+36 30 123 4567"],
    ["anyag és termékváltozat", "0–24 sóder"],
    ["mennyiség", "8 m³"],
    ["település", "Budapest"],
    ["kerület", "XXII."],
    ["irányítószám", "1221"],
    ["szállítási cím", "Teszt utca 1."],
    ["kívánt időpont", "2026-11-05"],
    ["megjegyzés", "Hátsó kapun kérem."],
    ["árazási verzió", PRICING_VERSION],
    ["anyag bruttó egységár", "13 500 Ft"],
    ["anyag bruttó részösszeg", "108 000 Ft"],
    ["fuvar nettó", "45 000 Ft"],
    ["fuvar ÁFA", "12 150 Ft"],
    ["fuvar bruttó", "57 150 Ft"],
    ["teljes bruttó összeg", "165 150 Ft"],
    ["rendelési igény jellege", "rendelési igénynek minősül"],
  ];
  for (const [label, needle] of must) {
    check(`a levél tartalmazza: ${label}`, text.includes(needle));
  }
  check("a mosott jelölés is szerepel", /mosott sóder/i.test(text));
}

{
  // Ügyfél, 2026-11-02: töltősóder NEM mosott, kulé EGYSZER mosott — a levél is így írja.
  for (const [slug, label] of [["tolto-soder", "Mosottság: Nem mosott"], ["kule", "Mosottság: Egyszer mosott"]]) {
    const v = validateOrderRequest({ ...base(), materialSlug: slug, idempotencyKey: `wash-${slug}-0001` }).value;
    const text = renderOrderEmail(v, recomputeOrderQuote(v), { mismatch: false, mock: false }).text;
    check(`${slug}: a levélben „${label}”`, text.includes(label));
    check(`${slug}: a levél nem állítja „mosott sóder/kavics” minőségnek`, !/Jó minőségű, mosott/.test(text));
  }
}

{
  // Vár-státusz a levélben
  const v = validateOrderRequest({
    ...base(),
    postalCode: "1011",
    districtId: 1,
    m3: 5,
    castleAnswer: "nem-tudom",
    idempotencyKey: "soder-var-0001",
  }).value;
  const mail = renderOrderEmail(v, recomputeOrderQuote(v), { mismatch: false, mock: false });
  check("a levél tartalmazza a Vár-kérdést", /Vár területén/.test(mail.text));
  check("a levél tartalmazza a választ", /Nem tudom/.test(mail.text));
  check("a levél jelzi a külön engedélyt", /külön engedély/.test(mail.text));
  check(
    "a levél jelzi, hogy a végösszeg nem garantált",
    /nem ismert/.test(mail.text) && /nem garantált/.test(mail.text),
  );
  check(
    "a levél NEM ír teljes bruttó összeget",
    /Teljes bruttó összeg: egyeztetés után/.test(mail.text),
  );
}

{
  // Egyedi egyeztetés a levélben (V. kerület, 7 m³)
  const v = validateOrderRequest({
    ...base(),
    postalCode: "1051",
    districtId: 5,
    m3: 7,
    idempotencyKey: "soder-quote-001",
  }).value;
  const mail = renderOrderEmail(v, recomputeOrderQuote(v), { mismatch: false, mock: false });
  check("a levél jelzi, hogy nincs tarifa erre a mennyiségre", /nincs tarifa/.test(mail.text));
  check("a levél jelzi a profil korlátját", /5 m³/.test(mail.text));
  check("a levél szerint a fuvar egyedi egyeztetés", /egyedi egyeztetés/.test(mail.text));
}

/* ─────────────── 11. Számlázási adatok (opcionális blokk) ─────────────── */
section("Számlázási adatok");

const privBilling = () => ({
  customerType: "private",
  name: "Árvíztűrő Tükörfúrógép Zsuzsanna",
  taxNumber: "",
  address: {
    country: "Magyarország",
    postalCode: "1221",
    city: "Budapest",
    streetAddress: "Nagytétényi út 123. (hosszú, ékezetes őrültség: ŐŰÁÉÍÓÖÜÚ)",
    additionalAddress: "B lépcsőház, 4. emelet 12.",
  },
});
const bizBilling = () => ({
  customerType: "business",
  name: "Példa Építő Kft.",
  taxNumber: "12345678 2 42",
  address: { country: "Magyarország", postalCode: "2030", city: "Érd", streetAddress: "Fő utca 1.", additionalAddress: "" },
});

{
  const r = validateOrderRequest({ ...base(), idempotencyKey: "bill-none-001" });
  check("számlázási blokk nélkül is érvényes az ajánlatkérés", r.ok);
  check("billing hiányzik → nincs billing az adatban", r.ok && r.value.billing === undefined);
  const r2 = validateOrderRequest({ ...base(), billing: null, idempotencyKey: "bill-null-001" });
  check("billing: null is elfogadott (üres opcionális blokk)", r2.ok);
}
{
  const r = validateOrderRequest({ ...base(), billing: privBilling(), idempotencyKey: "bill-priv-001" });
  check("magánszemély: teljes blokk érvényes", r.ok);
  const sneaky = { ...privBilling(), taxNumber: "12345678-2-42" };
  const r2 = validateOrderRequest({ ...base(), billing: sneaky, idempotencyKey: "bill-priv-002" });
  check("magánszemély: a kliens által küldött adószámot a szerver eldobja", r2.ok && r2.value.billing.taxNumber === "");
  const mail = renderOrderEmail(r2.value, recomputeOrderQuote(r2.value), { mismatch: false, mock: false }).text;
  check("magánszemély levél: nincs Adószám sor", !/Adószám/.test(mail));
  check("magánszemély levél: Vevő típusa = Magánszemély", /── Vevő típusa ──\nMagánszemély/.test(mail));
  check("levél: ékezetes hosszú név", mail.includes("Árvíztűrő Tükörfúrógép Zsuzsanna"));
  check("levél: további címadat", mail.includes("B lépcsőház, 4. emelet 12."));
  check("levél: a szállítási cím külön blokkban marad", /── Szállítási adatok ──[\s\S]*Teszt utca 1\./.test(mail));
}
{
  const r = validateOrderRequest({ ...base(), billing: bizBilling(), idempotencyKey: "bill-biz-001" });
  check("cég: teljes blokk érvényes", r.ok);
  eq("cég: adószám normalizálva", r.ok && r.value.billing.taxNumber, "12345678-2-42");
  const mail = renderOrderEmail(r.value, recomputeOrderQuote(r.value), { mismatch: false, mock: false }).text;
  check("cég levél: Cég / egyéni vállalkozó", mail.includes("Cég / egyéni vállalkozó"));
  check("cég levél: adószám + formai jelzés", mail.includes("Adószám: 12345678-2-42 (formailag ellenőrizve, NAV-nál nem)"));
  check("cég levél: blokkok sorrendje", /Vevő típusa[\s\S]*Számlázási adatok[\s\S]*Kapcsolattartó[\s\S]*Szállítási adatok[\s\S]*Kalkuláció és kért anyag[\s\S]*Árösszesítő/.test(mail));
  // egyéni vállalkozó: saját név, nincs cégforma-követelmény
  const ev = { ...bizBilling(), name: "Kovács János e.v." };
  check("egyéni vállalkozó neve cégforma nélkül is elfogadott", validateOrderRequest({ ...base(), billing: { ...ev, name: "Kovács János" }, idempotencyKey: "bill-ev-001" }).ok);
}
{
  const noTax = { ...bizBilling(), taxNumber: "" };
  const r = validateOrderRequest({ ...base(), billing: noTax, idempotencyKey: "bill-biz-002" });
  check("cég adószám nélkül: hiba", !r.ok && Boolean(r.errors["billing.taxNumber"]));
  const bad = { ...bizBilling(), taxNumber: "1234567-2-42" };
  const r2 = validateOrderRequest({ ...base(), billing: bad, idempotencyKey: "bill-biz-003" });
  check("rossz adószám-formátum: hiba", !r2.ok && /12345678-1-12/.test(r2.errors["billing.taxNumber"] ?? ""));
  const badVat = { ...bizBilling(), taxNumber: "12345678-9-42" };
  check("áfakód 1–5-ön kívül: hiba", !validateOrderRequest({ ...base(), billing: badVat, idempotencyKey: "bill-biz-004" }).ok);
  check("formai ellenőrzés: 11 számjegy kötőjellel", isHuTaxNumberShape("12345678-1-12"));
  check("formai ellenőrzés: kötőjel nélkül is", isHuTaxNumberShape("12345678112"));
  eq("normalizálás", normalizeHuTaxNumber("12345678112"), "12345678-1-12");
  const foreign = { ...bizBilling(), taxNumber: "ATU12345678", address: { ...bizBilling().address, country: "Ausztria", postalCode: "1010", city: "Wien" } };
  const rf = validateOrderRequest({ ...base(), billing: foreign, idempotencyKey: "bill-biz-005" });
  check("külföldi cég: nem magyar formátumú adóazonosító elfogadott", rf.ok && rf.value.billing.taxNumber === "ATU12345678");
}
{
  const partial = { customerType: "private", name: "Teszt Elek", taxNumber: "", address: { country: "Magyarország", postalCode: "", city: "", streetAddress: "", additionalAddress: "" } };
  const r = validateOrderRequest({ ...base(), billing: partial, idempotencyKey: "bill-part-001" });
  check("részleges blokk: konkrét hiányzó mezőkre ad hibát", !r.ok && Boolean(r.errors["billing.address.postalCode"]) && Boolean(r.errors["billing.address.city"]) && Boolean(r.errors["billing.address.streetAddress"]));
  check("részleges blokk: a meglévő mezőkre nincs hiba", !r.ok && !r.errors["billing.name"] && !r.errors["name"]);
  const huZip = { ...privBilling(), address: { ...privBilling().address, postalCode: "12345" } };
  check("magyar irányítószám: 4 számjegy", !validateOrderRequest({ ...base(), billing: huZip, idempotencyKey: "bill-zip-001" }).ok);
}
{
  // injection: CR/LF a számlázási mezőkben nem törheti a levelet
  const inj = { ...bizBilling(), name: "Rossz Kft.\r\nBcc: x@example.com", address: { ...bizBilling().address, streetAddress: "Fő u. 1.\nSubject: hack" } };
  const r = validateOrderRequest({ ...base(), billing: inj, idempotencyKey: "bill-inj-001" });
  const mail = renderOrderEmail(r.value, recomputeOrderQuote(r.value), { mismatch: false, mock: false }).text;
  check("injection: a név egy sorban marad", mail.includes("Cégnév / számlázási név: Rossz Kft. Bcc: x@example.com"));
  check("injection: nincs új Subject-sor", !/\nSubject: hack/.test(mail));
}
{
  // a kalkuláció a számlázási adatoktól független
  const a = validateOrderRequest({ ...base(), idempotencyKey: "bill-calc-001" }).value;
  const b = validateOrderRequest({ ...base(), billing: bizBilling(), idempotencyKey: "bill-calc-002" }).value;
  eq("a hiteles végösszeg nem függ a számlázási adatoktól", recomputeOrderQuote(b).totalGross, recomputeOrderQuote(a).totalGross);
  eq("a végösszeg változatlan (165 150 Ft)", recomputeOrderQuote(b).totalGross, 165150);
}

finish("order.test.mjs");
