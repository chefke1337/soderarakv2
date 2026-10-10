#!/usr/bin/env node
/**
 * Deploy-csomag készítő: az out/ tartalmát valódi ZIP-be csomagolja a dist/ alá.
 * A .gz ikertestvérek is bekerülnek (gzip_static kiszolgáláshoz).
 *
 * Futtatás: node scripts/package-deploy.mjs
 *
 * 2026-10-03 hibajavítás: a korábbi `tar.exe -a -c` a PATH-ról a Git Bash GNU tar-ját
 * hívta, amely a .zip utószóra sima TAR-archívumot írt (Windows Explorer /
 * Expand-Archive nem tudta kibontani). Most: explicit bsdtar (System32) +
 * `--format zip`, majd kötelező struktúra-ellenőrzés (PK local header + EOCD).
 * Az ellenőrzés nélkül a csomag NEM készülhet el — a tar-.zip csendben nem mehet ki.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
const DIST = "dist";

if (!existsSync(OUT)) {
  console.error("Nincs out/ — előbb futtasd: npm run build");
  process.exit(1);
}
if (!existsSync(join(OUT, "index.html"))) {
  console.error("Az out/ nem tartalmaz index.html-t — hiányos export.");
  process.exit(1);
}

mkdirSync(DIST, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const zipName = `soderarak-deploy-${stamp}.zip`;
const zipPath = join(DIST, zipName);

/** Valódi zip-e a fájl? PK\x03\x04 (empty/local header) az elején + EOCD (PK\x05\x06) a végén. */
function verifyZip(path) {
  let buf;
  try {
    buf = readFileSync(path);
  } catch {
    return false;
  }
  if (buf.length < 22) return false;
  const okHeader =
    buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07) &&
    (buf[3] === 0x04 || buf[3] === 0x06 || buf[3] === 0x08);
  let okEocd = false;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65536); i--) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      okEocd = true;
      break;
    }
  }
  return okHeader && okEocd;
}

// Csak bsdtar-jelöltek: a GNU tar (Git Bash tar.exe) .zip utószára TAR-t ír!
const candidates = [];
const sysTar = join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe");
if (existsSync(sysTar)) candidates.push(sysTar);
candidates.push("bsdtar");

let packed = false;
let lastErr = "";
for (const tar of candidates) {
  try {
    execFileSync(tar, ["--format", "zip", "-c", "-f", zipPath, "-C", OUT, "."], { stdio: "inherit" });
    if (verifyZip(zipPath)) {
      packed = true;
      break;
    }
    lastErr = `${tar}: a kimenet nem érvényes zip`;
    try { unlinkSync(zipPath); } catch {}
  } catch (err) {
    lastErr = `${tar}: ${err?.message ?? err}`;
    try { unlinkSync(zipPath); } catch {}
  }
}

if (!packed) {
  console.error(`HIBA: egyetlen zip-író sem működött (${lastErr}).`);
  console.error("Telepíts zip-eszközt, vagy futtasd kézzel: bsdtar --format zip -cf <cél> -C out .");
  process.exit(1);
}

const size = statSync(zipPath).size;
const files = readFileSync(join(OUT, "sitemap.xml"), "utf8").match(/<loc>/g)?.length ?? 0;
console.log(`ZIP-ellenőrzés: PK header ✓, EOCD ✓ — valódi zip archívum.`);
console.log(`Deploy-csomag: ${zipPath} (${Math.round(size / 1024)} kB, ${files} sitemap URL)`);
console.log("Feltöltés után ellenőrizd: daekon/deploy-checklist.md");
