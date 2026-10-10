/**
 * OG-kártya galéria — a statikus export összes Open Graph képét egyetlen,
 * böngészőben áttekinthető HTML-oldalon jeleníti meg vizuális QA-hoz
 * (vágott szöveg, átfedések, törékeny tördelés, kontraszt).
 *
 * Futtatás:
 *   npm run build && npm run og:gallery
 * Eredmény:
 *   og-gallery.html a projekt gyökerében — nyisd meg böngészőben.
 *
 * A képek base64-ként vannak beágyazva, így a fájl önállóan is működik.
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const OUT = join(process.cwd(), "out");
const TARGET = join(process.cwd(), "og-gallery.html");

const pngFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry === "opengraph-image.png") pngFiles.push(full);
  }
})(OUT);

if (pngFiles.length === 0) {
  console.error("Nincs egyetlen opengraph-image.png sem az out/ alatt — előbb futtasd: npm run build");
  process.exit(1);
}

const routeOf = (file) => {
  const rel = relative(OUT, file).split("\\").join("/");
  const route = rel.replace(/\/?opengraph-image\.png$/, "");
  return route === "" ? "/" : `/${route}/`;
};

const VARIANT_BY_SECTION = {
  anyagok: "materialIndex",
  teruletek: "areaIndex",
  utmutatok: "guideIndex",
  arak: "pricing",
  szallitas: "shipping",
  kapcsolat: "contact",
  rolunk: "company",
};

const variantOf = (route) => {
  if (route === "/404/") return "notFound";
  if (route === "/") return "standard";
  const segments = route.split("/").filter(Boolean);
  if (segments.length === 1) return VARIANT_BY_SECTION[segments[0]] ?? "standard";
  if (segments[0] === "anyagok") return "material";
  if (segments[0] === "teruletek") return "settlement";
  if (segments[0] === "utmutatok") return "guide";
  return "standard";
};

const SECTIONS = [
  ["Főoldal és fő oldalak", (route) => route.split("/").filter(Boolean).length <= 1],
  ["Anyagok", (route) => route.startsWith("/anyagok/") && route !== "/anyagok/"],
  ["Területek", (route) => route.startsWith("/teruletek/") && route !== "/teruletek/"],
  ["Útmutatók", (route) => route.startsWith("/utmutatok/") && route !== "/utmutatok/"],
];

const slugOf = (route) => (route === "/" ? "home" : route.split("/").filter(Boolean).join("-"));

const escapeHtml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const cards = pngFiles
  .map((file) => {
    const buffer = readFileSync(file);
    const signatureOk = buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
    const width = signatureOk ? buffer.readUInt32BE(16) : 0;
    const height = signatureOk ? buffer.readUInt32BE(20) : 0;
    const route = routeOf(file);
    return {
      route,
      variant: variantOf(route),
      slug: slugOf(route),
      dataUrl: `data:image/png;base64,${buffer.toString("base64")}`,
      width,
      height,
      signatureOk,
      kb: Math.max(1, Math.round(buffer.length / 1024)),
    };
  })
  .sort((a, b) => a.route.localeCompare(b.route, "hu"));

const brokenCards = cards.filter((card) => !card.signatureOk || card.width !== 1200 || card.height !== 630);

const cardHtml = (card) => {
  const ok = card.signatureOk && card.width === 1200 && card.height === 630;
  return `      <figure class="card${ok ? "" : " bad"}" id="card-${card.slug}">
        <img src="${card.dataUrl}" width="1200" height="630" alt="OG-kártya: ${escapeHtml(card.route)} (${escapeHtml(card.variant)} sablon)">
        <figcaption>
          <span class="route">${escapeHtml(card.route)}</span>
          <span class="variant">${escapeHtml(card.variant)}</span>
          <span class="meta">${ok ? `${card.width}×${card.height}` : "érvénytelen PNG"} · ${card.kb} kB</span>
        </figcaption>
      </figure>`;
};

const sectionsHtml = SECTIONS.map(([name, matches]) => {
  const list = cards.filter((card) => matches(card.route));
  if (list.length === 0) return "";
  return `  <section>
    <h2>${escapeHtml(name)} <span class="count">${list.length}</span></h2>
    <div class="grid">
${list.map(cardHtml).join("\n")}
    </div>
  </section>`;
}).join("\n");

const html = `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OG-kártya galéria — vizuális QA</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 28px 32px 72px; background: #14120f; color: #efe9dc; font: 15px/1.5 system-ui, "Segoe UI", sans-serif; }
  header, section { max-width: 1920px; margin-left: auto; margin-right: auto; }
  header { margin-bottom: 30px; }
  h1 { font-size: 24px; margin: 0 0 6px; letter-spacing: -0.02em; }
  .summary { color: #b5ab97; margin: 0 0 14px; }
  .summary strong { color: #efe9dc; }
  .summary .fail { color: #ff9d9d; font-weight: 700; }
  .checklist { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; margin: 0; padding: 0; }
  .checklist li { border: 1px solid #3a352c; border-radius: 999px; padding: 4px 12px; font-size: 13px; color: #cfc6b3; }
  section { margin-bottom: 38px; }
  h2 { font-size: 16px; letter-spacing: 0.08em; text-transform: uppercase; color: #d8cdb6; border-bottom: 1px solid #33302a; padding-bottom: 8px; margin: 0 0 16px; }
  h2 .count { color: #8f8674; font-weight: 600; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(560px, 1fr)); gap: 20px; }
  .card { margin: 0; border: 1px solid #3a352c; border-radius: 10px; overflow: hidden; background: #1d1a15; }
  .card img { display: block; width: 100%; height: auto; background: #fff; }
  .card.bad { outline: 3px solid #d05252; }
  figcaption { display: flex; align-items: baseline; gap: 10px; padding: 9px 12px; font-size: 13px; background: #171410; }
  .route { font-weight: 700; color: #f0d9a8; }
  .variant { color: #9aa88f; font-size: 12px; }
  .meta { margin-left: auto; color: #8f8674; }
</style>
</head>
<body>
<header>
  <h1>OG-kártya galéria</h1>
  <p class="summary"><strong>${cards.length}</strong> egyedi OG-kép az <strong>out/</strong> exportból · ${brokenCards.length === 0 ? "minden PNG aláírása és mérete (1200×630) rendben ✓" : `<span class="fail">${brokenCards.length} hibás kép: ${brokenCards.map((c) => c.route).join(", ")}</span>`} · a 404 oldal saját hibakártyát kapott</p>
  <ul class="checklist">
    <li>Vágott vagy kifutó szöveg?</li>
    <li>Átfedés szöveg és grafika között?</li>
    <li>Törékeny tördelés, árva szavak?</li>
    <li>Olvashatóság, kontraszt, hierarchia?</li>
  </ul>
</header>
${sectionsHtml}
</body>
</html>
`;

writeFileSync(TARGET, html);

const perSection = SECTIONS.map(([name, matches]) => `${name}: ${cards.filter((card) => matches(card.route)).length}`).join(" · ");
console.log(`OG galéria: ${TARGET}`);
console.log(`Kártyák: ${cards.length} (${perSection})`);
if (brokenCards.length > 0) {
  console.error(`Hibás képek: ${brokenCards.map((card) => card.route).join(", ")}`);
  process.exit(1);
}
