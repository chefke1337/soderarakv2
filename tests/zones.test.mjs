/**
 * Zóna-konzisztencia: minden település markerpontja a SAJÁT zónája
 * körvonalán belül van-e (ray casting). A site.ts TypeScript, ezért
 * Node ≥ 22.6 kell: `node --experimental-strip-types tests/zones.test.mjs`
 * (npm run test:zones). Nem módosít adatot; csak jelent.
 */
import { settlements, zones } from "../src/content/site.ts";

function inside([lat, lng], ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const KNOWN = new Set(process.argv.slice(2)); // ismert, döntésre váró eltérések
let failed = 0;
for (const s of settlements) {
  const z = zones.find((zz) => zz.id === s.zone);
  const ok = z.polygon.some((ring) => inside(s.latlng, ring));
  const tag = ok ? "OK  " : KNOWN.has(s.slug) ? "KNOWN" : "FAIL";
  if (!ok && !KNOWN.has(s.slug)) failed++;
  console.log(`${tag} ${s.slug.padEnd(28)} → ${s.zone}`);
}
// Önmetszés-ellenőrzés zónánként
function segX(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}
for (const z of zones) for (const ring of z.polygon) {
  const n = ring.length;
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    if (segX(ring[i], ring[(i + 1) % n], ring[j], ring[(j + 1) % n])) {
      console.log(`FAIL self-intersection ${z.id} edges ${i}/${j}`);
      failed++;
    }
  }
}
process.exit(failed ? 1 : 0);
