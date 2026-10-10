#!/usr/bin/env node
/**
 * qa-regression — daekon-quality-master: FÜGGETLEN regressziós QA (6. kapu).
 *
 * Nem hiszi el a kapukat: az exportált out/ könyvtárból önállóan újraellenőrzi
 * az invariánsokat, és kockázat szerint sorol (skill: qa-regression.md).
 *   - blocker találat → exit 1 (a kapu FAIL, a release elutasítva)
 *   - tiszta futás    → exit 0, összefoglaló kimenettel (üres kimenet sosem PASS)
 *
 * Ellenőrzések (mind a felhasználó számára látható felületet érintenek):
 *   1. Export váza: out/index.html, out/404.html létezik.
 *   2. Minden HTML: title, canonical (saját domain), og:title/og:description/og:image,
 *      lang="hu", viewport.
 *   3. Minden og:image hivatkozás létező, érvényes 1200×630 PNG-re mutat.
 *   4. Minden opengraph-image.png bent van a hash-bázisban (nincs rögzítetlen kártya).
 *   5. Sitemap: minden <loc> létező HTML-re mutat; robots.txt hivatkozik rá.
 *   6. JSON-LD: minden application/ld+json blokk értelmezhető JSON.
 *   7. Üzleti adat: cégnév és telefonszám a site.ts-ből a kapcsolat/impresszum
 *      oldalakon is megjelenik (adat-helyesség, source-of-truth).
 *   8. Manifest: minden icons[].src létező, érvényes fájlra mutat (PNG-aláírás).
 *   9. GA4-kapcsolási állapot (metrics-plan §2/§9): GA_ID-val mért buildnél a
 *      gtag-betöltő és a consent-banner minden oldalon jelen van; méretlen
 *      buildnél EGYETLEN analytics-hivatkozás sincs (félkész mérés = blocker).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "out");
const SITE_TS = join(ROOT, "src", "content", "site.ts");
const BASELINE = join(ROOT, "scripts", "og-baseline.json");
const DOMAIN = "soderarak.hu";

const blockers = [];
const notes = [];
const check = (ok, blocker, message) => {
  if (ok) {
    console.log(`  ✓ ${message}`);
  } else if (blocker) {
    blockers.push(message);
    console.log(`  ✗ BLOCKER ${message}`);
  } else {
    notes.push(message);
    console.log(`  ! advisory ${message}`);
  }
};

if (!existsSync(OUT)) {
  console.error("QA-regresszió: nincs out/ export — előbb futtass buildet. A kapu nem verifikálható.");
  process.exit(1);
}

// --- HTML gyűjtés -----------------------------------------------------------
const htmlFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith(".html")) htmlFiles.push(full);
  }
})(OUT);

console.log(`▶ qa-regression — független QA ${htmlFiles.length} HTML-oldalra\n`);

// --- 1. Export váza ----------------------------------------------------------
check(existsSync(join(OUT, "index.html")), true, "out/index.html létezik");
check(existsSync(join(OUT, "404.html")), true, "out/404.html létezik");

// --- Üzleti adat a forrásból (site.ts) ---------------------------------------
let companyName = null;
let phoneDisplay = null;
if (existsSync(SITE_TS)) {
  const src = readFileSync(SITE_TS, "utf8");
  companyName = src.match(/export const company = \{[\s\S]*?name: "([^"]+)"/)?.[1] ?? null;
  phoneDisplay = src.match(/phone: \{[\s\S]*?display: "([^"]+)"/)?.[1] ?? null;
} else {
  check(false, true, "src/content/site.ts olvasható");
}
check(Boolean(companyName && phoneDisplay), true, "site.ts: cégnév és telefonszám kinyerve");

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// --- 2–3. Per-oldal meta + OG-kép felbontás ----------------------------------
const ogTargets = new Set(); // kimeneti PNG-útvonalak, amiket a HTML-ek hivatkoznak
const resolveOgFile = (raw) => {
  if (!raw) return null;
  let pathname;
  try {
    pathname = new URL(raw, `https://${DOMAIN}`).pathname;
  } catch {
    return null;
  }
  const candidates = [];
  if (pathname.endsWith(".png")) candidates.push(pathname);
  if (pathname.endsWith("/opengraph-image")) candidates.push(`${pathname}.png`);
  if (pathname.endsWith("/")) candidates.push(`${pathname}opengraph-image.png`);
  if (pathname === "/") candidates.push("/opengraph-image.png");
  for (const c of candidates) {
    const full = join(OUT, c.replace(/^\//, "").split("/").join("/"));
    if (existsSync(full)) return full;
  }
  return null;
};
const pngDims = (file) => {
  try {
    const buf = readFileSync(file);
    if (buf.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
};

let jsonLdBlocks = 0;
let jsonLdBroken = 0;
let canonicalOk = 0;
let metaOk = 0;
const dataMissing = [];

for (const file of htmlFiles) {
  const route = `/${relative(OUT, file).split("\\").join("/")}`;
  const html = readFileSync(file, "utf8");

  const hasTitle = /<title>[^<]{3,}<\/title>/i.test(html);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? null;
  const ogTitle = /<meta property="og:title" content="[^"]+"/i.test(html);
  const ogDesc = /<meta property="og:description" content="[^"]+"/i.test(html);
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] ?? null;
  const lang = /<html[^>]*\slang="hu"/i.test(html);
  const viewport = /<meta name="viewport"/i.test(html);

  const metaOkAll = hasTitle && Boolean(canonical) && ogTitle && ogDesc && lang && viewport;
  if (metaOkAll) metaOk += 1;
  else check(false, true, `${route}: hiányos meta (title/canonical/og:image/lang/viewport)`);

  if (canonical && new URL(canonical, `https://${DOMAIN}`).hostname === DOMAIN) canonicalOk += 1;
  else check(false, true, `${route}: canonical nem a ${DOMAIN} domainre mutat`);

  const ogFile = resolveOgFile(ogImage);
  if (!ogFile) {
    check(false, true, `${route}: og:image hivatkozás nem oldható fel létező PNG-re`);
  } else {
    ogTargets.add(ogFile);
    const dims = pngDims(ogFile);
    if (!dims || dims.width !== 1200 || dims.height !== 630) {
      check(false, true, `${route}: OG-kép nem érvényes 1200×630 PNG (${dims ? `${dims.width}×${dims.height}` : "érvénytelen"} )`);
    }
  }

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    jsonLdBlocks += 1;
    try {
      JSON.parse(m[1]);
    } catch {
      jsonLdBroken += 1;
      check(false, true, `${route}: érvénytelen JSON-LD blokk`);
    }
  }

  if (route.includes("kapcsolat") || route.includes("impresszum")) {
    if (companyName && !new RegExp(esc(companyName)).test(html)) dataMissing.push(`${route}: cégnév (${companyName})`);
    if (route.includes("kapcsolat") && phoneDisplay && !html.includes(phoneDisplay)) dataMissing.push(`${route}: telefon (${phoneDisplay})`);
  }
}

check(metaOk === htmlFiles.length, true, `minden HTML meta-készlete teljes (${metaOk}/${htmlFiles.length})`);
check(canonicalOk === htmlFiles.length, true, `minden kanonikus URL a saját domainre mutat (${canonicalOk}/${htmlFiles.length})`);
check(jsonLdBroken === 0 && jsonLdBlocks > 0, true, `JSON-LD blokkok értelmezhetők (${jsonLdBlocks} blokk, ${jsonLdBroken} hibás)`);
for (const miss of dataMissing) check(false, true, `üzleti adat hiányzik: ${miss}`);
if (companyName && phoneDisplay && dataMissing.length === 0) {
  check(true, true, `üzleti adat a site.ts-ből jelen van (cégnév, telefon)`);
}

// --- 4. Hash-bázis lefedettség ------------------------------------------------
const ogPngs = [];
(function walkPng(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkPng(full);
    else if (entry === "opengraph-image.png") ogPngs.push(full);
  }
})(OUT);
const routeOf = (file) => {
  const rel = relative(OUT, file).split("\\").join("/");
  const route = rel.replace(/\/?opengraph-image\.png$/, "");
  return route === "" ? "/" : `/${route}/`;
};
let baseline = {};
if (existsSync(BASELINE)) {
  baseline = JSON.parse(readFileSync(BASELINE, "utf8")).images ?? {};
} else {
  check(false, true, "scripts/og-baseline.json hiányzik");
}
const uncovered = ogPngs.map(routeOf).filter((route) => !(route in baseline));
check(uncovered.length === 0 && ogPngs.length > 0, true, `minden OG-kártya rögzítve a hash-bázisban (${ogPngs.length} PNG, ${uncovered.length} rögzítetlen)`);
const brokenRefs = [...ogTargets].filter((f) => !ogPngs.includes(f));
check(brokenRefs.length === 0, true, `minden hivatkozott OG-kép valós kártyafájl (${ogTargets.size} hivatkozás)`);

// --- 5. Sitemap + robots -------------------------------------------------------
const sitemapPath = join(OUT, "sitemap.xml");
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const missingPages = locs.filter((loc) => {
    try {
      const pathname = new URL(loc).pathname.replace(/\/$/, "");
      const target = pathname === "" ? join(OUT, "index.html") : join(OUT, pathname, "index.html");
      return !existsSync(target);
    } catch {
      return true;
    }
  });
  check(locs.length > 0 && missingPages.length === 0, true, `sitemap URL-ek létező oldalakra mutatnak (${locs.length} URL, ${missingPages.length} hiányzó)`);
  const robotsPath = join(OUT, "robots.txt");
  const robotsOk = existsSync(robotsPath) && /sitemap/i.test(readFileSync(robotsPath, "utf8"));
  check(robotsOk, true, "robots.txt hivatkozik a sitemapra");
} else {
  check(false, true, "out/sitemap.xml létezik");
}

// --- 8. Manifest ikonok --------------------------------------------------------
const manifestPath = join(OUT, "manifest.webmanifest");
if (existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const iconSrcs = (manifest.icons ?? []).map((i) => i.src).filter(Boolean);
    check(iconSrcs.length > 0, true, "manifest.icons legalább egy ikont hivatkozik");
    const missingIcons = iconSrcs.filter((src) => {
      const p = join(OUT, src.replace(/^\//, ""));
      if (!existsSync(p)) return true;
      if (src.endsWith(".png")) {
        const buf = readFileSync(p);
        return buf.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a";
      }
      return false;
    });
    check(missingIcons.length === 0, true, `manifest ikonok léteznek és érvényesek (${iconSrcs.length} hivatkozás)`);
  } catch {
    check(false, true, "manifest.webmanifest értelmezhető JSON");
  }
} else {
  check(false, true, "out/manifest.webmanifest létezik");
}

// --- 9. GA4-kapcsolási állapot (env-alapú mérés, metrics-plan §2/§9) -----------
const chunkDir = join(OUT, "_next", "static", "chunks");
const jsChunks = [];
(function walkJs(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkJs(full);
    else if (entry.endsWith(".js")) jsChunks.push(full);
  }
})(chunkDir);
let gaIdHit = null;
let debugModeHit = false;
let bannerInBundle = false;
for (const file of jsChunks) {
  const src = readFileSync(file, "utf8");
  // A döntő jel: a G- ID be van-e égetve a bundle-be (NEXT_PUBLIC inline).
  // A loadGa4() kód (gtag-loader string) GA_ID nélkül is kompilálódik — NEM jel!
  if (!gaIdHit) gaIdHit = src.match(/["']G-[A-Z0-9]{6,12}["']/)?.[0] ?? null;
  if (src.includes("debug_mode")) debugModeHit = true;
  // A consent-banner ssr:false + next/dynamic → kliens-oldalon töltődik be, a HTML-be
  // SOSEM kerül. A minifier az ékezetes stringeket \xe1 hex-escape-re cseréli, ezért
  // csak tiszta ASCII needle-ek megbízhatók: a banner gombja (Elfogadom) + a szöveg
  // "Google Analytics 4" része (mindkettő a 511 dynamic-chunkban, máshol nem szerepel).
  if (src.includes("Elfogadom") && src.includes("Google Analytics 4")) bannerInBundle = true;
}

if (gaIdHit) {
  check(true, true, `GA4: mért build (${gaIdHit} beégetve a bundle-be)`);
  check(bannerInBundle, true, "GA4: consent-banner a bundle-ben (ssr:false → kliens-oldalon töltődik be)");
  if (debugModeHit) {
    check(false, false, "GA4: debug_mode bekapcsolva — élesítés előtt vedd ki a NEXT_PUBLIC_GA4_DEBUG=1-t");
  }
} else {
  const htmlGa = htmlFiles.filter((f) => readFileSync(f, "utf8").includes("googletagmanager")).length;
  check(htmlGa === 0, true, "GA4: méretlen build — nincs googletagmanager a HTML-ekben");
  check(false, false, "GA4: mérés nincs bekapcsolva — a .env.local NEXT_PUBLIC_GA4_ID mezőjébe valós G- ID, majd npm run build (metrics-plan §2)");
}

// --- Eredmény ------------------------------------------------------------------
console.log("");
if (blockers.length > 0) {
  console.error(`QA-regresszió: ${blockers.length} blocker találat — a kapu FAIL:`);
  for (const b of blockers) console.error(`  ✗ ${b}`);
  process.exit(1);
}
console.log(`QA-regresszió: ${htmlFiles.length} HTML · ${ogPngs.length} OG-kártya · ${jsonLdBlocks} JSON-LD blokk — minden blocker-ellenőrzés zöld ✓`);
if (notes.length > 0) {
  console.log(`Advisory jegyzetek (${notes.length}):`);
  for (const n of notes) console.log(`  ! ${n}`);
}
process.exit(0);
