import { PILE_H, PILE_W, pileSvg } from "@/lib/pile";
import { GRAIN_SEED, type Tone } from "@/lib/grain";

/**
 * Anyagkupac-sziluettek statikus SVG-fájlként (/kupac/<tone>.svg).
 *
 * Miért nem inline: a hat kupac inline SVG-je ~70 KB volt, és a statikus
 * export kétszer tartalmazta (HTML + React-payload) — a főoldali HTML fele
 * ebből állt (2026-11-01 audit, Lighthouse: lassabb FCP/LCP a főoldalon). Fájlként
 * egyszer töltődnek le és gyorsítótárazhatók. A rajz ugyanaz (pile.ts).
 */
export const dynamic = "force-static";

const TONES = Object.keys(GRAIN_SEED) as Tone[];

export function generateStaticParams() {
  return TONES.map((t) => ({ fajl: `${t}.svg` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ fajl: string }> }) {
  const { fajl } = await params;
  const tone = fajl.replace(/\.svg$/, "") as Tone;
  if (!TONES.includes(tone)) return new Response("Not found", { status: 404 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PILE_W} ${PILE_H}" width="${PILE_W}" height="${PILE_H}">${pileSvg(tone, tone)}</svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8" } });
}
