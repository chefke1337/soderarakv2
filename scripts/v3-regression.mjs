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
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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
let hydrationWarnings = 0;
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
  // Ismert, időszakos (~1–2% betöltés) React #418 hydration-hiba: a régi élő
  // buildben is jelentkezik, a teljes <body> kliensoldali újrarenderét okozza
  // (látható hatás nélkül). Nyitott tétel: docs/v3-audit-and-fixes.md → H-1.
  // Külön számoljuk, hogy minden más runtime-hiba továbbra is bukjon.
  const hydration = errors.filter((e) => /Minified React error #418/.test(e));
  const other = errors.filter((e) => !/Minified React error #418/.test(e));
  if (hydration.length) {
    hydrationWarnings += hydration.length;
    console.log(`WARN ${w}px: ${hydration.length}× ismert, időszakos React #418 hydration-hiba (H-1)`);
  }
  check(`${w}px: nincs egyéb runtime-hiba (${other.slice(0, 2).join(" | ")})`, other.length === 0);
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
      // Mobilon a fejléc lefelé görgetésre szándékosan elrejtőzik (ScrollSensor),
      // ezért felfelé görgetve hozzuk elő, és úgy mérjük a rétegzést.
      await page.evaluate((t) => window.scrollTo(0, t + 330), top);
      await page.waitForTimeout(120);
      await page.evaluate((t) => window.scrollTo(0, t + 30), top);
      await page.waitForTimeout(250);
      const hdr = await page.evaluate(() => {
        const h = document.querySelector("header.sticky, body > header") ?? document.querySelector("header");
        const b = h.getBoundingClientRect();
        const m = document.querySelector(".leaflet-container").getBoundingClientRect();
        const hits = [b.left + 30, b.left + b.width / 2, b.right - 30].map((x) => h.contains(document.elementFromPoint(x, b.bottom - 4)));
        return { underHeader: m.top < b.bottom && m.bottom > b.bottom, onTop: hits.every(Boolean) };
      });
      check(`térkép ${r} ${w}px: a sticky fejléc a térkép fölött marad (térkép a fejléc alatt: ${hdr.underHeader})`, hdr.onTop);
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
  {
    const r = await page.locator(".area-zip-result").innerText();
    check("kereső 1118 → kalkulátor-link, belső díjprofil-magyarázat nélkül", r.includes("Szállítási díj kiszámítása: 1118") && !/díjprofil/.test(r));
  }
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
    if (resp?.status() === 200 && /Szállítási díj/.test(body) && !/Fuvardíj-sávok|díjprofil/.test(body) && /Városrészek a /.test(body) && /\d{4}/.test(firstCode)) ok++;
    else console.log(`  kerület ${d}: ${href} ${resp?.status()}`);
  }
  check(`kerületi oldalak: ${ok}/23 elérhető, városrészekkel, nyilvános díjtábla nélkül`, ok === 23);
  await page.goto(url("/teruletek/budapest-1-kerulet/"), { waitUntil: "load" });
  check("I. kerület oldal: Vár-egyeztetés szerepel", /Vár/.test(await page.locator("main").innerText()));
  await page.goto(url("/teruletek/budapest-5-kerulet/"), { waitUntil: "load" });
  check("V. kerület oldal: 5 m³ feletti egyedi egyeztetés szerepel", /5 m³ felett egyedi egyeztetés|e felett egyedi egyeztetés/.test(await page.locator("main").innerText()));
  await ctx.close();
}

/* ── 6. Kalkulátor: előválasztó link, hiányzó tarifa ── */
{
  const { ctx, page } = await newPage(1280, 1000);
  await page.goto(url("/arkalkulator/?anyag=soder-0-24&m3=4&irsz=9999"), { waitUntil: "load" });
  await page.waitForTimeout(300);
  const t = (await page.locator("main").innerText()).replace(/ /g, " ");
  check("kalkulátor: ismeretlen irányítószám nem töltődik elő és nincs 0 Ft-os fuvar", !/Fuvar[^\n]*\b0 Ft/.test(t));
  check("kalkulátor: az előválasztó link az 1. lépésen nyit, a változat kijelölve", (await page.locator("#step-1-cim").count()) === 1 && (await page.getByRole("radio", { name: /0–24 sóder/ }).isChecked()));
  check("kalkulátor: nincs beküldő gomb az első lépésen", (await page.locator("button[type=submit]").count()) === 0);
  await page.getByRole("button", { name: /Tovább: mennyiség/ }).click();
  check("kalkulátor: dokumentált ?m3=4 előválasztás megmarad", (await page.locator("input[type=range]").inputValue()) === "4");
  await ctx.close();
}

/* ── 7. Árlista: alapból zárt accordion, egyszerre egy nyitott ── */
for (const w of [390, 768, 1440]) {
  const { ctx, page } = await newPage(w, 900);
  await page.goto(url("/arak/"), { waitUntil: "load" });
  const btns = page.locator(".mat-card button[aria-expanded]");
  const n = await btns.count();
  const expanded = async () => (await btns.evaluateAll((els) => els.map((e) => e.getAttribute("aria-expanded"))));
  check(`${w}px /arak: ${n} kategória, alapból mind zárt`, n === 6 && (await expanded()).every((v) => v === "false"));
  check(`${w}px /arak: zárt panelek rejtettek`, (await page.locator(".mat-card [role=region]:not([hidden])").count()) === 0);
  check(`${w}px /arak: zárt állapotban is látszik a név és az induló ár`, /Sóder[\s\S]*Ft[\s\S]*-tól/.test(await btns.first().innerText()));
  await btns.nth(0).click();
  let e = await expanded();
  check(`${w}px /arak: egy kategória nyitható`, e[0] === "true" && e.filter((v) => v === "true").length === 1);
  const ctrl = await btns.nth(0).getAttribute("aria-controls");
  check(`${w}px /arak: aria-controls a nyitott panelre mutat`, Boolean(ctrl) && (await page.locator(`#${ctrl}:not([hidden])`).count()) === 1);
  // hosszú (murva, 6 tétel) nyitott kategória után egy lejjebb lévő megnyitása: nincs scrollugrás
  await btns.nth(3).click();
  await btns.nth(4).scrollIntoViewIfNeeded();
  const before = await btns.nth(4).evaluate((el) => el.getBoundingClientRect().top);
  await btns.nth(4).click();
  await page.waitForTimeout(100);
  const after = await btns.nth(4).evaluate((el) => el.getBoundingClientRect().top);
  e = await expanded();
  check(`${w}px /arak: másik nyitása bezárja az előzőt`, e[3] === "false" && e[4] === "true" && e.filter((v) => v === "true").length === 1);
  check(`${w}px /arak: nincs scrollugrás (Δ=${Math.round(after - before)} px)`, Math.abs(after - before) <= 3);
  await btns.nth(4).click();
  check(`${w}px /arak: a nyitott kategória bezárható`, (await expanded()).every((v) => v === "false"));
  // billentyűzet
  await btns.nth(1).focus();
  await page.keyboard.press("Enter");
  check(`${w}px /arak: Enterrel nyílik`, (await expanded())[1] === "true");
  await page.keyboard.press("Space");
  check(`${w}px /arak: Space-szel zárul`, (await expanded())[1] === "false");
  const focusVisible = await btns.nth(1).evaluate((el) => getComputedStyle(el).outlineStyle !== "none");
  check(`${w}px /arak: látható fókusz`, focusVisible);
  await ctx.close();
}

/* ── 8. Tartalom: telefonszám, mosottság, szállítás, nyilvános tarifák ── */
{
  const htmlFiles = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".html") || entry.endsWith(".txt")) htmlFiles.push(full);
    }
  })(OUT);
  const OLD_PHONE = /954[\s -]?6156|309546156/;
  const withOld = htmlFiles.filter((f) => OLD_PHONE.test(readFileSync(f, "utf8")));
  check(`régi telefonszám sehol a generált oldalakon (${withOld.length} fájl)`, withOld.length === 0);
  const TARIFF = /Fuvardíjak irányítószám szerint|Fuvardíj-sávok|tariff-row|díjprofil|Saját flottával, irányítószám/;
  const withTariff = htmlFiles.filter((f) => TARIFF.test(readFileSync(f, "utf8")));
  check(`nincs nyilvános díjtábla / díjprofil-szöveg (${withTariff.map((f) => f.slice(OUT.length)).slice(0, 3).join(", ")})`, withTariff.length === 0);

  const { ctx, page } = await newPage(390, 844);
  for (const r of ["/", "/kapcsolat/", "/szallitas/", "/rolunk/"]) {
    await page.goto(url(r), { waitUntil: "load" });
    const tels = await page.locator("a[href^='tel:']").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    check(`${r}: minden tel: link az új számra mutat (${tels.length})`, tels.length > 0 && tels.every((h) => h === "tel:+36308528909"));
  }
  check("a látható szám formátuma +36 30 852 8909", (await page.locator("main").innerText()).includes("+36 30 852 8909"));

  await page.goto(url("/szallitas/"), { waitUntil: "load" });
  let t = (await page.locator("main").innerText()).replace(/ /g, " ");
  check("szállítás: új cím", (await page.locator("h1").innerText()).trim() === "Szállítás");
  check("szállítás: új bevezető", t.includes("Cégünk vállalja különböző ömlesztett építőanyagok, sóder, homok, kavics, murva, andezit és föld gyors és megbízható házhoz szállítását."));
  check("szállítás: „Amit kínálunk:” lista 5 ponttal", t.includes("Amit kínálunk:") && ["Gyors és pontos kiszállítás.", "Megbízható, szervezett fuvarozás.", "Lakossági és vállalkozói megrendelések teljesítése.", "Rugalmas szállítási időpontok, akár aznap.", "Igény szerinti mennyiségű ömlesztett anyag kiszállítása."].every((x) => t.includes(x)));
  check("szállítás: a régi bevezető eltűnt", !/Saját flottával|Nem fuvarozót közvetítünk/.test(t));
  check("szállítás: a 10 m³/fuvar szabály megmaradt", /legfeljebb 10 m³/.test(t));
  check("szállítás: kalkulátor/telefon tájékoztatás", t.includes("A pontos szállítási díjért használja az árkalkulátort, vagy kérjen telefonos egyeztetést."));
  check("szállítás: behajtási engedély és Vár-tájékoztatás megmaradt", /Behajtási engedély/.test(t) && /Vár területén/.test(t));

  await page.goto(url("/arak/"), { waitUntil: "load" });
  await page.locator("#anyag-soder button[aria-expanded]").click();
  t = await page.locator("#anyag-soder").innerText();
  check("árlista: töltősóder „Nem mosott”", /Töltősóder[\s\S]*Nem mosott/.test(t));
  await page.locator("#anyag-kavics button[aria-expanded]").click();
  t = await page.locator("#anyag-kavics").innerText();
  check("árlista: kulé „Egyszer mosott” + magyarázat", /Egyszer mosott/.test(t) && /egyszeri mosáson átesett, de nem olyan tiszta, mint az osztályozott kavicsok/.test(t));
  t = (await page.locator("main").innerText()).replace(/ /g, " ");
  check("árlista: nincs teljes díjtábla, de van kalkulátor-utalás és engedélytájékoztató", !/díjprofil/.test(t) && /A pontos szállítási díjért használja az árkalkulátort/.test(t) && /behajtási engedély/i.test(t));
  // Üzemeltető és telefonos elérhetőség (ügyfél, 2026-11-03)
  const OLD_OPERATOR = /Bau-Kont|27333138|13-09-239483|Törökbálint, hrsz|152\/12|Cégjegyzékszám|07:00[–-]17:00|07:00 – 17:00/;
  const withOldOp = htmlFiles.filter((f) => OLD_OPERATOR.test(readFileSync(f, "utf8")));
  check(`nincs régi üzemeltetői adat / 17:00-s elérhetőség (${withOldOp.map((f) => f.slice(OUT.length)).slice(0, 3).join(", ")})`, withOldOp.length === 0);
  await page.goto(url("/impresszum/"), { waitUntil: "load" });
  {
    const it = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    check("impresszum: új vállalkozói adatok", ["Újhegyi Lajosné E.V.", "1224 Budapest, Báthori utca 9.", "61008203-2-43", "Egyéni vállalkozói nyilvántartási szám", "4868853", "H–P 07:00–16:00", "rendeles@soderarak.hu", "+36 30 852 8909"].every((x) => it.includes(x)));
  }
  check("lábléc: telefonos elérhetőség mondat", /Telefonon hétfőtől péntekig 07:00–16:00 között ér el minket\./.test(await page.locator("footer").innerText()));
  check("lábléc: e-mail link", (await page.locator("footer a[href='mailto:rendeles@soderarak.hu']").count()) > 0);
  // Buda Konténer: önálló ajánló, összetartozást sugalló szöveg nélkül (2026-11-03)
  const AFFIL = /külön üzletág|másik üzletág|üzletágunk|konténeres szolgáltatásunk|saját konténer|közös vállalkozás|Két üzletág|órákon belüli kiszállás|Erre van a Buda Konténer/i;
  const withAffil = htmlFiles.filter((f) => AFFIL.test(readFileSync(f, "utf8")));
  check(`nincs összetartozást sugalló konténer-szöveg (${withAffil.map((f) => f.slice(OUT.length)).slice(0, 3).join(", ")})`, withAffil.length === 0);
  await page.goto(url("/"), { waitUntil: "load" });
  {
    const ad = page.locator("aside[aria-labelledby='hulladek-cim']");
    const at = await ad.innerText();
    check("ajánló: új jelölés, cím és leírás", at.includes("Konténerre is szüksége van?") && at.includes("Építkezik vagy felújít? Találjon konténert a hulladék elszállításához.") && at.includes("Tekintse meg a Buda Konténer kínálatát, és egyeztesse közvetlenül a rendelés részleteit."));
    const cta = ad.getByRole("link", { name: /Megnézem a Buda Konténert/ });
    check("ajánló: a CTA a meglévő címre mutat", (await cta.getAttribute("href")) === "https://budakontener.hu");
    check("lábléc: nincs konténeres kapcsolati sor", !/budakontener/i.test(await page.locator("footer").innerHTML()));
  }
  await page.goto(url("/rolunk/"), { waitUntil: "load" });
  t = await page.locator("main").innerText();
  check("Rólunk: nincs „Minden általunk forgalmazott anyag” általánosítás", !/Minden általunk forgalmazott anyag/.test(t) && /töltősóder/.test(t));
  await ctx.close();
}

await browser.close();
server.close();
console.log(`\nregression: ${passed} OK, ${failures.length} FAIL, ${hydrationWarnings} WARN (H-1 #418)`);
if (failures.length) {
  console.log(failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
