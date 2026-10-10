/**
 * PNG-ikon-generátor: a manifest hivatkozott /icons/icon-512.png (maskable)
 * legyártása a scripts/icon-512.svg raszterizálásával (sharp).
 * Futtatás: npm run icons (a build NEM függ tőle — az ikon a repóban él,
 * a public/-ból az exportba másolódik). Regenerálás csak a mark változásakor.
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const svg = await readFile(path.join(root, "scripts", "icon-512.svg"));

const png = await sharp(svg, { density: 96 })
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toBuffer();

await mkdir(path.join(root, "public", "icons"), { recursive: true });
await writeFile(path.join(root, "public", "icons", "icon-512.png"), png);

console.log("icon-512.png legyártva:", png.length, "bájt");
