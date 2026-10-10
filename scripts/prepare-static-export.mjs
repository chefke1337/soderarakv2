/**
 * Post-build: makes Next's extensionless Open Graph routes MIME-safe and
 * validates accessibility, SEO metadata/schema, sitemap, and export invariants across every page.
 * CSS remains a shared stylesheet instead of being duplicated into HTML.
 *
 * Futtatás: node scripts/prepare-static-export.mjs (a `next build` után)
 */
import {
  copyFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const OUT = "out";
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
// Must mirror next.config.ts's basePath: same-origin asset links in the
// exported HTML (e.g. the stylesheet <link>) carry this prefix, but the
// files on disk under OUT/ never do (GitHub Pages applies the "/repo-name"
// prefix itself at serve time, it isn't baked into the export's file tree).
const BASE_PATH = process.env.GH_PAGES_BASE_PATH ?? "";
// Next's own file-convention metadata routes (opengraph-image, manifest, …)
// resolve through the router and so DO carry basePath even though the
// canonical URL (built explicitly in src/lib/meta.tsx against the real
// production domain) deliberately doesn't. Strip it before touching disk
// or comparing against a canonical-derived path.
function stripBasePath(pathname) {
  return BASE_PATH && pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) || "/" : pathname;
}

function walk(dir, files = [], suffix = ".html") {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files, suffix);
    else if (full.endsWith(suffix)) files.push(full);
  }
  return files;
}

function fail(file, message) {
  throw new Error(`${file}: ${message}`);
}

function getMetaContent(html, attribute, value) {
  const tag = html.match(
    new RegExp(`<meta\\b[^>]*${attribute}="${value}"[^>]*>`),
  )?.[0];
  return tag?.match(/\bcontent="([^"]+)"/)?.[1];
}

const htmlFiles = walk(OUT);
const chunksDir = join(OUT, "_next", "static", "chunks");
const jsChunkFiles = existsSync(chunksDir) ? walk(chunksDir, [], ".js") : [];

// ── CSS tartalom-hash (2026-10-03) ──
// Megfigyelve: a Next nem mindig cseréli a CSS-fájlnevet tartalomváltozáskor
// (két különböző tartalom futott ugyanazon d71139589bb5e92d.css néven) — így az
// immutable böngésző-/szerver-cache régies CSS-t szolgáltatna a visszatérő
// látogatóknak. Minden hivatkozott megosztott CSS-t tartalom-hashelt névre
// nevezünk, a HTML- és JS-hivatkozásokat átírjuk, a nem hivatkozottakat töröljük.
//
// FONTOS (2026-10-04, térkép-hiba javítás): egy csak dinamikusan (next/dynamic,
// ssr:false) betöltött komponens saját CSS-chunkja SOSEM jelenik meg szó
// szerint egyetlen exportált HTML-ben sem — csak a webpack runtime JS-ében,
// egy `miniCssF=e=>"static/css/<hash>.css"` féle literál stringként. Ha csak a
// HTML-eket néztük volna, ezt a fájlt töröltük volna (ahogy a Leaflet-térkép
// CSS-ével meg is történt — innentől globálisan importáljuk, hogy ne is legyen
// külön chunk, de a szkript maga is JS-tudatos lett, hogy ez a hibaosztály más
// jövőbeli dinamikus komponenssel se ismétlődhessen meg).
const cssDir = join(OUT, "_next", "static", "css");
const cssRenameMap = new Map();
if (existsSync(cssDir)) {
  const referencedCssNames = new Set();
  for (const file of htmlFiles) {
    for (const ref of readFileSync(file, "utf8").match(/_next\/static\/css\/[A-Za-z0-9._-]+\.css/g) ?? []) {
      referencedCssNames.add(ref.split("/").pop());
    }
  }
  for (const file of jsChunkFiles) {
    for (const ref of readFileSync(file, "utf8").match(/static\/css\/[A-Za-z0-9._-]+\.css/g) ?? []) {
      referencedCssNames.add(ref.split("/").pop());
    }
  }
  for (const entry of readdirSync(cssDir)) {
    if (!entry.endsWith(".css")) continue;
    const full = join(cssDir, entry);
    if (!referencedCssNames.has(entry)) {
      unlinkSync(full);
      const staleGz = `${full}.gz`;
      if (existsSync(staleGz)) unlinkSync(staleGz);
      continue;
    }
    const hash = createHash("sha256").update(readFileSync(full)).digest("hex").slice(0, 8);
    const renamed = entry.replace(/\.css$/, `.${hash}.css`);
    if (renamed !== entry) {
      const target = join(cssDir, renamed);
      if (existsSync(target)) unlinkSync(target);
      renameSync(full, target);
      const staleGz = `${full}.gz`;
      if (existsSync(staleGz)) unlinkSync(staleGz);
      cssRenameMap.set(`_next/static/css/${entry}`, `_next/static/css/${renamed}`);
      cssRenameMap.set(`static/css/${entry}`, `static/css/${renamed}`);
    }
  }
}
// A JS chunkokban lévő literál CSS-fájlnév-hivatkozásokat is átírjuk, különben
// a webpack runtime a régi (át nem nevezett) fájlt keresné futásidőben.
if (cssRenameMap.size > 0) {
  for (const file of jsChunkFiles) {
    const original = readFileSync(file, "utf8");
    let patched = original;
    for (const [from, to] of cssRenameMap) patched = patched.split(from).join(to);
    if (patched !== original) writeFileSync(file, patched);
  }
}

const indexableCanonicals = new Set();
const pageSchemas = [];
let socialImagePages = 0;
let referencedCss = 0;

for (const file of htmlFiles) {
  const originalHtml = readFileSync(file, "utf8");
  let html = originalHtml;
  for (const [from, to] of cssRenameMap) html = html.split(from).join(to);

  // Accessibility and responsive-output guardrails.
  const h1Count = (html.match(/<h1\b/g) ?? []).length;
  if (h1Count !== 1) fail(file, `expected one h1, found ${h1Count}`);
  if (!html.includes('id="main-content"') || !html.includes("Ugrás a tartalomra")) {
    fail(file, "missing keyboard skip link or its main landmark target");
  }
  if (/data-inline-critical/.test(html)) {
    fail(file, "duplicated inline critical CSS found; keep CSS in shared assets");
  }

  for (const [, tag] of html.matchAll(/(<img\b[^>]*>)/g)) {
    if (!/\bwidth="[1-9][0-9]*"/.test(tag) || !/\bheight="[1-9][0-9]*"/.test(tag)) {
      fail(file, "image is missing intrinsic width/height dimensions");
    }
  }

  const stylesheetTag = html.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
  const cssHref = stylesheetTag?.[1];
  if (!cssHref || !stylesheetTag) fail(file, "no shared stylesheet link found");
  const cssPathname = stripBasePath(new URL(cssHref, "https://soderarak.hu").pathname);
  const cssFile = join(OUT, decodeURIComponent(cssPathname).replace(/^\//, ""));
  if (!existsSync(cssFile)) fail(file, `stylesheet asset not exported: ${cssHref}`);
  referencedCss += statSync(cssFile).size;

  // Preload shared CSS, then apply it without blocking first paint; no-JS still gets styles.
  // MÉRT KOMPROMISSZUM (2026-10-03 A/B): az async (FOUC-os) verzió adja a legjobb
  // pontszámot — a blokkoló (87–89) és a teljes inline (87) alternatíva is rosszabb,
  // mert a styled first-paint a betűk-hálózati láncára esik (FCP 909 → 2266–2488).
  // Az async ár a FOUC-okozta CLS 0,05–0,07 — mérve, tudatosan elfogadva.
  const asyncStylesheet = `<link rel="preload" as="style" href="${cssHref}"/><link rel="stylesheet" href="${cssHref}" media="print" onload="this.media='all'"/><noscript><link rel="stylesheet" href="${cssHref}"/></noscript>`;
  html = html.replace(stylesheetTag[0], asyncStylesheet);

  const title = html.split("<title>", 2)[1]?.split("</title>", 1)[0]?.trim();
  const description = getMetaContent(html, "name", "description");
  const ogTitle = getMetaContent(html, "property", "og:title");
  const twitterTitle = getMetaContent(html, "name", "twitter:title");
  const twitterDescription = getMetaContent(html, "name", "twitter:description");
  if (!title || !description || !ogTitle || !twitterTitle || !twitterDescription) {
    fail(file, "page title, description, og:title, and Twitter title/description are required");
  }
  if (description !== twitterDescription) fail(file, "Twitter description does not match page description");

  const canonicalHref = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const ogPageUrl = getMetaContent(html, "property", "og:url");
  if (!canonicalHref || !ogPageUrl) fail(file, "canonical and og:url are required");
  const canonicalUrl = new URL(canonicalHref);
  if (new URL(ogPageUrl).href !== canonicalUrl.href) {
    fail(file, `og:url ${ogPageUrl} does not match canonical ${canonicalUrl.href}`);
  }
  if (canonicalUrl.pathname !== "/" && !canonicalUrl.pathname.endsWith("/")) {
    fail(file, `canonical URL must use the exported trailing-slash route: ${canonicalUrl.href}`);
  }
  const robots = getMetaContent(html, "name", "robots")?.toLowerCase() ?? "";
  // V2 preview: a teljes oldal globálisan „noindex, follow" (layout.tsx), hogy ne
  // versenyezzen az eredeti oldallal. Ez a globális preview-jelzés nem tünteti el
  // az oldalt a sitemap/breadcrumb/schema invariánsok alól — azokat ugyanúgy
  // ellenőrizzük, mintha indexelhető lenne. A szándékosan noindex oldalak
  // (jogi oldalak: „noindex", 404) továbbra is kimaradnak.
  const directives = robots.split(",").map((d) => d.trim()).filter(Boolean);
  const isPreviewNoindex = directives.length === 2 && directives[0] === "noindex" && directives[1] === "follow";
  const isIndexable = isPreviewNoindex || !directives.includes("noindex");
  if (isIndexable) indexableCanonicals.add(canonicalUrl.href);
  const schemas = html.split('<script type="application/ld+json">').slice(1).map((segment) => {
    const json = segment.split("</script>", 1)[0];
    try {
      return JSON.parse(json);
    } catch {
      fail(file, "malformed JSON-LD script");
    }
  });
  pageSchemas.push({ file, canonicalUrl, indexable: isIndexable, schemas });
  const baseUrl = canonicalUrl.href;
  // A 404-es dokumentum a gyökér kanonikus útját örökli (nincs saját URL-je),
  // de saját metaadatot és saját hibakártyát kap — a fájlnév egyértelmű jelző.
  const isNotFoundPage = /(?:^|[\\/])404\.html$/.test(file);
  if (isNotFoundPage) {
    // Next nem köti be a /404/opengraph-image útvonalat a 404 dokumentumba,
    // ezért itt irányítjuk át a közösségi kép hivatkozásokat a hibakártyára.
    html = html.replace(
      /(<meta\b[^>]*(?:property="og:image"|name="twitter:image")[^>]*content=")([^"]*)(")/g,
      (tag, pre, url, post) => {
        const parsed = new URL(url, baseUrl);
        return /^\/opengraph-image(\.png)?$/.test(stripBasePath(parsed.pathname))
          ? `${pre}${canonicalUrl.href.replace(/\/$/, "")}/404/opengraph-image.png${post}`
          : tag;
      },
    );
    html = html
      .replace(/<title>[\s\S]*?<\/title>/, "<title>404 — Az oldal nem található | Sóderárak</title>")
      .replace(/(<meta name="description" content=")[^"]*("\/>)/, `$1A kért oldal nem található. Sóder, homok, kavics és murva szállítás Budafokról — hívjon, vagy indítsa el az árkalkulátort.$2`)
      .replace(/(<meta property="og:title" content=")[^"]*("\/>)/, `$1404 — Az oldal nem található$2`)
      .replace(/(<meta property="og:description" content=")[^"]*("\/>)/, `$1A kért oldal nem található. Hívjon, vagy indítsa el az árkalkulátort.$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*("\/>)/, `$1404 — Az oldal nem található$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*("\/>)/, `$1A kért oldal nem található. Hívjon, vagy indítsa el az árkalkulátort.$2`)
      .replace(/<meta name="robots" content="([^"]*)"\/>/, (tag, content) =>
        content.includes("noindex") ? tag : `<meta name="robots" content="${content}, noindex"/>`);
    if (!/name="robots"/.test(html)) {
      html = html.replace(/(<meta name="description"[^>]*\/>)/, `$1<meta name="robots" content="noindex"/>`);
    }
  }
  if (!isNotFoundPage && ogTitle !== title) fail(file, "og:title must mirror the page title");
  // V2: a kanonikus URL a basePath-ot is tartalmazza (project page) — a lemezen
  // lévő kártya-útvonal anélkül értendő.
  const canonicalPathOnDisk = stripBasePath(canonicalUrl.pathname.replace(/\/$/, "")) || "/";
  const ogImagePath = canonicalPathOnDisk === "/" ? "/opengraph-image.png" : `${canonicalPathOnDisk}/opengraph-image.png`;
  const ownCardPath = isNotFoundPage ? "/404/opengraph-image.png" : ogImagePath;
  let socialTags = 0;

  // Next emits metadata-route files without extensions; create a public .png
  // sibling and remove build query hashes from the social-card URL.
  html = html.replace(/<meta\b[^>]*>/g, (tag) => {
    if (!/\bproperty="og:image"|\bname="twitter:image"/.test(tag)) return tag;
    const contentMatch = tag.match(/\bcontent="([^"]+)"/);
    if (!contentMatch) return tag;

    const imageUrl = new URL(contentMatch[1], baseUrl);
    const rawPath = imageUrl.pathname;
    const extensionlessPath = rawPath.endsWith("/opengraph-image.png")
      ? rawPath.slice(0, -4)
      : rawPath.endsWith("/opengraph-image")
        ? rawPath
        : null;
    if (!extensionlessPath) fail(file, `unexpected social image URL ${imageUrl.href}`);
    if (stripBasePath(extensionlessPath) !== ownCardPath.slice(0, -4)) {
      fail(file, `social image ${extensionlessPath} does not match the page's own card ${ownCardPath}`);
    }

    const sourcePath = join(OUT, ...decodeURIComponent(stripBasePath(extensionlessPath)).split("/").filter(Boolean));
    if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
      fail(file, `missing prerendered Open Graph image: ${extensionlessPath}`);
    }

    copyFileSync(sourcePath, `${sourcePath}.png`);
    imageUrl.pathname = `${extensionlessPath}.png`;
    imageUrl.search = "";
    imageUrl.hash = "";
    socialTags++;
    return tag.replace(contentMatch[0], `content="${imageUrl.href}"`);
  });

  const ogImage = getMetaContent(html, "property", "og:image");
  const twitterImage = getMetaContent(html, "name", "twitter:image");
  if (!ogImage || !twitterImage) fail(file, "both og:image and twitter:image are required");
  const ogUrl = new URL(ogImage, baseUrl);
  const twitterUrl = new URL(twitterImage, baseUrl);
  if (stripBasePath(ogUrl.pathname) !== ownCardPath || stripBasePath(twitterUrl.pathname) !== ownCardPath) {
    fail(file, `social card does not point to the page's own PNG ${ownCardPath}`);
  }
  if (socialTags < 2) fail(file, "both social image tags must use the exported PNG route");

  for (const imageUrl of [ogUrl, twitterUrl]) {
    const imagePath = join(OUT, ...decodeURIComponent(stripBasePath(imageUrl.pathname)).split("/").filter(Boolean));
    if (!existsSync(imagePath)) fail(file, `social image does not exist: ${imageUrl.pathname}`);
    const png = readFileSync(imagePath);
    if (!png.subarray(0, 8).equals(PNG_SIGNATURE)) fail(file, `social image is not a PNG: ${imageUrl.pathname}`);
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    if (width !== 1200 || height !== 630) {
      fail(file, `social image dimensions are ${width}×${height}, expected 1200×630`);
    }
  }

  socialImagePages++;
  if (html !== originalHtml) writeFileSync(file, html);
}

if (socialImagePages !== htmlFiles.length) {
  throw new Error(`Open Graph coverage is incomplete: ${socialImagePages}/${htmlFiles.length} pages.`);
}

// Tömörítési harness: minden szöveges eszköz mellé .gz ikertestvér (statikus hoszt
// gzip_static/brotli-kiszolgáláshoz), méret- és arány-validációval.
const GZIP_EXTENSIONS = new Set([".html", ".css", ".js", ".svg", ".xml", ".json", ".txt"]);
let gzipRawTotal = 0;
let gzipTotal = 0;
let gzipCount = 0;
(function walkAll(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkAll(full);
    } else if (GZIP_EXTENSIONS.has(entry.slice(entry.lastIndexOf(".")))) {
      const raw = readFileSync(full);
      const gz = gzipSync(raw, { level: 9 });
      if (gz.length >= raw.length) fail(full, `gzip did not shrink asset (${raw.length} -> ${gz.length} bytes)`);
      if (gz.length > 150 * 1024) fail(full, `gzipped asset larger than 150 kB: ${gz.length} bytes`);
      writeFileSync(`${full}.gz`, gz);
      gzipRawTotal += raw.length;
      gzipTotal += gz.length;
      gzipCount++;
    }
  }
})(OUT);

const sitemapPath = join(OUT, "sitemap.xml");
if (!existsSync(sitemapPath)) fail(sitemapPath, "sitemap.xml was not exported");
const sitemapXml = readFileSync(sitemapPath, "utf8");
const sitemapUrls = [...sitemapXml.matchAll(/<loc>(.*?)<[/]loc>/g)].map(([, url]) =>
  url.replace(/&amp;/g, "&"),
);
const sitemapSet = new Set(sitemapUrls);
if (sitemapUrls.length !== sitemapSet.size) fail(sitemapPath, "duplicate URL found");
for (const url of sitemapUrls) {
  if (!indexableCanonicals.has(new URL(url).href)) {
    fail(sitemapPath, `URL is missing an indexable exported page: ${url}`);
  }
}
for (const url of indexableCanonicals) {
  if (!sitemapSet.has(url)) fail(sitemapPath, `indexable canonical missing from sitemap: ${url}`);
}

const businessIds = new Set(
  pageSchemas.flatMap(({ schemas }) => schemas)
    .filter((schema) => schema["@type"] === "LocalBusiness" && schema["@id"])
    .map((schema) => schema["@id"]),
);
for (const { file, canonicalUrl, indexable, schemas } of pageSchemas) {
  if (indexable && !schemas.some((schema) => schema["@type"] === "LocalBusiness")) {
    fail(file, "indexable page is missing the shared LocalBusiness JSON-LD");
  }
  const breadcrumbs = schemas.filter((schema) => schema["@type"] === "BreadcrumbList");
  if (indexable && stripBasePath(canonicalUrl.pathname.replace(/\/$/, "")) !== "/" && breadcrumbs.length !== 1) {
    fail(file, `expected one BreadcrumbList for indexable route, found ${breadcrumbs.length}`);
  }
  for (const breadcrumb of breadcrumbs) {
    const items = breadcrumb.itemListElement ?? [];
    if (!items.length) fail(file, "BreadcrumbList has no items");
    for (const item of items) {
      if (!item.item || !indexableCanonicals.has(new URL(item.item).href)) {
        fail(file, `breadcrumb URL is not an indexable canonical: ${item.item}`);
      }
    }
    if (new URL(items.at(-1).item).href !== canonicalUrl.href) {
      fail(file, "last breadcrumb URL does not match page canonical");
    }
  }
  for (const schema of schemas) {
    if (schema["@type"] === "Service" || schema["@type"] === "OfferCatalog") {
      if (!schema.url || new URL(schema.url).href !== canonicalUrl.href) {
        fail(file, `${schema["@type"]} URL does not match page canonical`);
      }
    }
    if (schema["@type"] === "Service" && !businessIds.has(schema.provider?.["@id"])) {
      fail(file, "Service provider @id does not resolve to the shared LocalBusiness");
    }
  }
}

const robotsPath = join(OUT, "robots.txt");
if (!existsSync(robotsPath)) fail(robotsPath, "robots.txt was not exported");
const robotsTxt = readFileSync(robotsPath, "utf8");
const sitemapDirective = robotsTxt
  .split(/\r?\n/)
  .find((line) => line.startsWith("Sitemap:"))
  ?.slice("Sitemap:".length)
  .trim();
// A sitemap a site gyökere alatt van — basePath-os (project page) site-on is.
const siteRoot = [...indexableCanonicals].find((u) => new URL(u).pathname === `${BASE_PATH}/`) ?? [...indexableCanonicals][0];
const expectedSitemapUrl = `${siteRoot.replace(/\/$/, "")}/sitemap.xml`;
if (sitemapDirective !== expectedSitemapUrl) {
  fail(robotsPath, `expected sitemap directive ${expectedSitemapUrl}, found ${sitemapDirective ?? "none"}`);
}

// ── Záró védőháló: a végleges (már átírt) HTML-ek és JS-chunkok által szó
// szerint hivatkozott static/css/*.css és static/chunks/*.js fájl tényleg
// létezzen a lemezen. Ez nem helyettesíti a fenti, konkrét hibát okozó
// mechanizmus megértését — csak biztosítja, hogy *bármilyen más jövőbeli*
// hasonló hiba (hiányzó/átnevezett, de futásidőben hivatkozott asset) a
// buildet buktassa el, ne a felhasználó böngészőjében derüljön ki
// CSS_CHUNK_LOAD_FAILED / ChunkLoadError formájában.
{
  const allSourceFiles = [...htmlFiles, ...jsChunkFiles];
  const referencedAssets = new Set();
  for (const file of allSourceFiles) {
    const content = readFileSync(file, "utf8");
    for (const ref of content.match(/static\/css\/[A-Za-z0-9._-]+\.css/g) ?? []) referencedAssets.add(ref);
    for (const ref of content.match(/static\/chunks\/[A-Za-z0-9._/-]+\.js/g) ?? []) referencedAssets.add(ref);
  }
  const missing = [...referencedAssets].filter((ref) => !existsSync(join(OUT, "_next", ref)));
  if (missing.length > 0) {
    fail("build", `hivatkozott, de hiányzó static asset(ek) az exportból: ${missing.join(", ")}`);
  }
}

console.log(
  `Export QA: ${htmlFiles.length} HTML-oldal, ${socialImagePages} saját OG-kép (1200×630), ${indexableCanonicals.size} kanonikus indexelhető oldal és ${sitemapUrls.length} sitemap URL ellenőrizve, ${Math.round(referencedCss / 1024)} kB megosztott CSS-hivatkozással. Gzip-harness: ${gzipCount} eszköz, ${Math.round(gzipRawTotal / 1024)} kB → ${Math.round(gzipTotal / 1024)} kB (${Math.round((1 - gzipTotal / gzipRawTotal) * 100)}% megtakarítás).`,
);
