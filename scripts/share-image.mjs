/**
 * Főoldali linkmegosztási borítókép (1200×630 PNG) előállítása a valódi
 * árlista-anyagfotókból — statikus fájl, nincs futásidejű OG-generálás.
 *
 * Futtatás: node scripts/share-image.mjs
 * Kimenet:  public/soderarak-share-v3.png (a src/lib/share.ts hivatkozza)
 *
 * Tartalomváltozásnál új fájlnév (v4, …), hogy a megosztó platformok
 * cache-e ne a régi képet mutassa.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const OUT = join(ROOT, "public", "soderarak-share-v3.png");
const photo = (slug) =>
  `data:image/webp;base64,${readFileSync(join(ROOT, "public", "anyagok", "arlista", `${slug}-foto.webp`)).toString("base64")}`;

// Sorrend = árlista sorrendje; a középső oszlop lejjebb csúszik a ritmusért.
const tiles = [
  ["soder", "Sóder", "40% 55%"],
  ["kavics", "Kavics", "50% 45%"],
  ["bazalt", "Bazalt", "45% 40%"],
  ["homok", "Homok", "50% 50%"],
  ["murva", "Murva", "50% 50%"],
  ["fold", "Termőföld", "50% 60%"],
];

const html = `<!doctype html>
<html lang="hu"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600&family=Space+Grotesk:wght@600;700&display=block&subset=latin-ext" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #f4ead8; color: #24211d; font-family: Inter, sans-serif; }
  .card { position: relative; width: 1200px; height: 630px; overflow: hidden;
    background: radial-gradient(ellipse at 18% 8%, #fbf3e4 0%, #f4ead8 55%); }
  .slab { position: absolute; left: 620px; top: 0; width: 580px; height: 630px; background: #ead9bb; }
  .slab::after { content: ""; position: absolute; left: 0; bottom: 0; width: 580px; height: 10px; background: #c2410c; }
  .copy { position: absolute; left: 72px; top: 64px; bottom: 64px; width: 520px; display: flex; flex-direction: column; }
  .lockup { font-family: "Space Grotesk", sans-serif; font-weight: 700; text-transform: uppercase;
    font-size: 40px; line-height: 0.92; letter-spacing: -0.5px; }
  .lockup span { display: block; }
  .lockup .a { color: #2b2019; } .lockup .b { color: #c2410c; }
  h1 { margin-top: auto; font-family: "Space Grotesk", sans-serif; font-weight: 700; font-size: 74px;
    line-height: 1.0; letter-spacing: -2.4px; color: #24211d; }
  h1 em { font-style: normal; color: #a8401a; }
  .rule { width: 64px; height: 4px; background: #c2410c; margin: 30px 0 22px; border-radius: 2px; }
  .materials { white-space: nowrap; font-size: 21px; font-weight: 600; color: #3d362e; letter-spacing: -0.2px; }
  .chips { display: flex; gap: 10px; margin-top: 26px; }
  .chip { font-size: 19px; font-weight: 600; padding: 9px 16px; border-radius: 999px;
    background: #fffaf1; border: 1.5px solid #d8c4a0; color: #24211d; }
  .chip.num { background: #2b2019; border-color: #2b2019; color: #fbf3e4; }
  .grid { position: absolute; left: 660px; top: 78px; display: grid; grid-template-columns: repeat(3, 152px); gap: 14px; }
  .tile { width: 152px; height: 222px; border-radius: 18px; overflow: hidden; position: relative;
    box-shadow: 0 1px 0 rgba(43,32,25,.08), 0 14px 30px -12px rgba(43,32,25,.35); border: 3px solid #fffaf1; }
  .tile:nth-child(3n+2) { transform: translateY(26px); }
  .tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .tile b { position: absolute; left: 8px; bottom: 8px; font-size: 14px; font-weight: 600; color: #24211d;
    background: rgba(255,250,241,.92); padding: 4px 9px; border-radius: 999px; }
</style></head>
<body><div class="card">
  <div class="slab"></div>
  <div class="copy">
    <div class="lockup"><span class="a">Sóder</span><span class="b">Árak</span></div>
    <h1>Építőanyagok,<br><em>átlátható árak.</em></h1>
    <div class="rule"></div>
    <div class="materials">Sóder · Homok · Kavics · Murva · Bazalt · Termőföld</div>
    <div class="chips"><span class="chip num">1–20 m³</span><span class="chip">Árkalkulátor</span><span class="chip">Kiszállítás</span></div>
  </div>
  <div class="grid">
    ${tiles.map(([slug, , pos]) => `<div class="tile"><img src="${photo(slug)}" style="object-position:${pos}" alt=""></div>`).join("")}
  </div>
</div></body></html>`;

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({
  ...(proxy ? { proxy: { server: proxy } } : {}),
  // Eltérő Playwright-verziójú, előre telepített Chromiumhoz (pl. CI-konténer).
  ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const families = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family));
if (!families.some((f) => f.includes("Space Grotesk"))) {
  await browser.close();
  throw new Error("A Space Grotesk betűtípus nem töltődött be — a kép fallback-fonttal készülne.");
}
await page.screenshot({ path: OUT, type: "png", clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log(`Megosztási borítókép kész: ${OUT}`);
