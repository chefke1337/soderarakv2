/**
 * Anyagkupac-sziluettek (tiszta geometria, React nélkül).
 *
 * Valódi ömlesztett kupac: széles talp, fokozatosan lejtő oldalak, nincs
 * függőleges fal; a teteje nem félkör és nem háztető. A profil:
 *   h(t) = H · (1 − |t|^a)^b,   t ∈ [−1, 1] a csúcshoz viszonyítva
 * ahol `a` a csúcs gömbölyűségét (nagyobb = laposabb, lágyabb tető),
 * `b` a talp kifutását (nagyobb = hosszabban elnyúló láb) szabja meg.
 * A csúcs aszimmetrikus (peak ≠ 0.5), a kontúrra a magassággal arányos,
 * anyagonként eltérő finom egyenetlenség kerül — a talp így egyenes marad.
 * Lágy anyag (homok, sóder, kavics, föld): sűrű mintavétel + Catmull–Rom
 * görbe. Szögletes anyag (murva, bazalt): ritkább pontok, egyenes élek.
 */
import { GRAIN_SEED, GRAIN_SHAPE, MATERIAL_COLOR, grainData, grainToSvg, type Tone } from "./grain";

export const PILE_W = 200;
export const PILE_H = 72;
/** a talaj (kontaktárnyék közepe) y-koordinátája */
export const PILE_BASE = 66;

type Ripple = [amp: number, freq: number, phase: number];

export type PileSpec = {
  /** talp bal/jobb széle (viewBox x) */
  left: number;
  right: number;
  /** csúcs helye a talpon belül, 0–1 */
  peak: number;
  /** kupac magassága (viewBox egység) */
  height: number;
  a: number;
  b: number;
  ripples: Ripple[];
  /** szögletes kontúr: kevesebb pont, egyenes szakaszok */
  faceted: boolean;
  samples: number;
};

export const PILE: Record<Tone, PileSpec> = {
  // vegyes szemcse: kissé balra tolt csúcs, változatos, de nyugodt felszín
  soder: { left: 6, right: 194, peak: 0.46, height: 56, a: 1.75, b: 1.25, faceted: false, samples: 44,
    ripples: [[1.1, 5, 0.4], [0.7, 11, 1.9], [0.35, 19, 0.2]] },
  // homok: a leglágyabb, legsimább ív, hosszan elnyúló láb
  homok: { left: 5, right: 195, peak: 0.54, height: 52, a: 2.1, b: 1.4, faceted: false, samples: 40,
    ripples: [[0.6, 3, 2.1], [0.2, 9, 0.7]] },
  // kavics: kerekdedebb tető, a kontúron gömbölyű „kavicsdudorok"
  kavics: { left: 8, right: 192, peak: 0.5, height: 55, a: 2.3, b: 1.15, faceted: false, samples: 40,
    ripples: [[0.7, 4, 1.2], [0.55, 10, 0.5], [0.35, 14, 2.4]] },
  // murva: szögletes, enyhén egyenetlen, jobbra billenő csúcs
  murva: { left: 6, right: 194, peak: 0.42, height: 54, a: 1.42, b: 1.2, faceted: true, samples: 19,
    ripples: [[1.3, 6, 2.6], [0.8, 13, 1.1]] },
  // bazalt: kissé meredekebb, élesebb csúcs, tört élek
  bazalt: { left: 9, right: 191, peak: 0.56, height: 57, a: 1.45, b: 1.15, faceted: true, samples: 17,
    ripples: [[1.6, 7, 0.3], [1.0, 15, 1.4]] },
  // föld: organikus, rögös, kicsit kétpúpú
  fold: { left: 5, right: 195, peak: 0.44, height: 52, a: 1.85, b: 1.3, faceted: false, samples: 46,
    ripples: [[2.4, 2.6, 3.6], [1.2, 9, 0.8], [0.6, 17, 2.9]] },
};

function profile(spec: PileSpec, x: number): number {
  const { left, right, peak, height, a, b, ripples } = spec;
  const px = left + (right - left) * peak;
  const t = x < px ? (x - px) / (px - left) : (x - px) / (right - px);
  const u = Math.min(1, Math.abs(t));
  const base = height * Math.pow(1 - Math.pow(u, a), b);
  const w = (x - left) / (right - left);
  const noise = ripples.reduce((acc, [amp, f, ph]) => acc + amp * Math.sin(w * f * Math.PI * 2 + ph), 0);
  // a zaj a magassággal arányos → a talpon nulla, a talpvonal egyenes
  return Math.max(0, base + noise * (base / height));
}

const f1 = (n: number) => n.toFixed(1);

/** A kupac zárt SVG-útvonala (talpvonal: PILE_BASE). */
export function pilePath(tone: Tone): string {
  const spec = PILE[tone];
  const { left, right, samples, faceted } = spec;
  const pts: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    // a talp közelében sűrűbb mintavétel a lágy kifutáshoz
    const s = i / samples;
    const x = left + (right - left) * s;
    pts.push([x, PILE_BASE - profile(spec, x)]);
  }
  pts[0][1] = PILE_BASE;
  pts[pts.length - 1][1] = PILE_BASE;

  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  if (faceted) {
    for (let i = 1; i < pts.length; i++) d += `L${f1(pts[i][0])} ${f1(pts[i][1])}`;
  } else {
    // Catmull–Rom → köbös Bézier (feszesség 1/6)
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += `C${f1(c1x)} ${f1(Math.min(PILE_BASE, c1y))} ${f1(c2x)} ${f1(Math.min(PILE_BASE, c2y))} ${f1(p2[0])} ${f1(p2[1])}`;
    }
  }
  return `${d}Z`;
}

/** A csúcs x-helye (a fény–árnyék átmenethez). */
export function pilePeakX(tone: Tone): number {
  const { left, right, peak } = PILE[tone];
  return left + (right - left) * peak;
}

/** A csúcs legmagasabb pontja (y) — teszthez / méréshez. */
export function pileTopY(tone: Tone): number {
  const spec = PILE[tone];
  let top = PILE_BASE;
  for (let x = spec.left; x <= spec.right; x += 0.5) top = Math.min(top, PILE_BASE - profile(spec, x));
  return top;
}

/**
 * Anyagonkénti kiegészítő szemcseréteg a kupacon (a csempe fölött):
 * sóder finom frakció, murva/bazalt apró szögletes törmelék világos
 * élekkel (textúrakontraszt), föld nagyobb, áttetsző rögök.
 */
export const PILE_DETAIL: Partial<Record<Tone, { count: number; min: number; max: number; kind: "round" | "pebble" | "angular"; colors: string[]; opacity: number; seed: number }>> = {
  soder: { count: 70, min: 0.35, max: 0.9, kind: "round", colors: ["#6e5a40", "#efe2c8"], opacity: 0.9, seed: 101 },
  kavics: { count: 26, min: 0.9, max: 1.8, kind: "pebble", colors: ["#f0ebe2"], opacity: 0.55, seed: 103 },
  murva: { count: 44, min: 0.8, max: 2, kind: "angular", colors: ["#857760", "#f6f1e7"], opacity: 0.9, seed: 107 },
  bazalt: { count: 46, min: 0.8, max: 2.2, kind: "angular", colors: ["#8c847b", "#1d1a18", "#a39a90"], opacity: 0.85, seed: 109 },
  fold: { count: 16, min: 3, max: 6.5, kind: "round", colors: ["#4a3020", "#8a6644"], opacity: 0.45, seed: 113 },
};

/**
 * A kupac teljes SVG-tartalma (viewBox 0 0 PILE_W PILE_H). Egységes fény
 * balról-felülről: világosabb bal lejtő, sötétebb jobb lejtő és talp,
 * halvány perem-fény a kontúron, lágy kontaktárnyék a talajon.
 * A szemcsecsempe torzítatlan (a viewBox arányos, nincs nyújtás).
 * Csak saját, determinisztikus adatból épül — nincs felhasználói bemenet.
 */
export function pileSvg(tone: Tone, id: string): string {
  const spec = PILE[tone];
  const d = pilePath(tone);
  const px = ((pilePeakX(tone) - spec.left) / (spec.right - spec.left));
  const top = pileTopY(tone);
  const col = MATERIAL_COLOR[tone];
  const k = `pile-${id}`;
  const tile = 0.82;
  const base = grainData(GRAIN_SHAPE[tone], col.grains, GRAIN_SEED[tone], 120, 60).map(grainToSvg).join("");
  const det = PILE_DETAIL[tone];
  const detail = det
    ? grainData({ count: det.count, min: det.min, max: det.max, kind: det.kind }, det.colors, det.seed, 70, 40).map(grainToSvg).join("")
    : "";
  const light = tone === "bazalt" || tone === "fold" ? 0.2 : 0.16;
  return [
    "<defs>",
    `<pattern id="${k}-t" width="${120 * tile}" height="${60 * tile}" patternUnits="userSpaceOnUse"><g transform="scale(${tile})"><rect width="120" height="60" fill="${col.base}"/>${base}</g></pattern>`,
    det ? `<pattern id="${k}-d" width="${70 * tile}" height="${40 * tile}" patternUnits="userSpaceOnUse"><g transform="scale(${tile})" opacity="${det.opacity}">${detail}</g></pattern>` : "",
    `<clipPath id="${k}-c"><path d="${d}"/></clipPath>`,
    `<linearGradient id="${k}-x" gradientUnits="userSpaceOnUse" x1="${spec.left}" y1="0" x2="${spec.right}" y2="0">`,
    `<stop offset="0" stop-color="#fff" stop-opacity="${light}"/>`,
    `<stop offset="${Math.max(0, px - 0.06).toFixed(2)}" stop-color="#fff" stop-opacity="0.05"/>`,
    `<stop offset="${Math.min(1, px + 0.08).toFixed(2)}" stop-color="#000" stop-opacity="0.08"/>`,
    `<stop offset="1" stop-color="#000" stop-opacity="0.32"/></linearGradient>`,
    `<linearGradient id="${k}-y" gradientUnits="userSpaceOnUse" x1="0" y1="${top.toFixed(1)}" x2="0" y2="${PILE_BASE}">`,
    `<stop offset="0" stop-color="#fff" stop-opacity="0.1"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/></linearGradient>`,
    `<radialGradient id="${k}-s"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="0.6" stop-color="#000" stop-opacity="0.22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`,
    "</defs>",
    `<ellipse class="pile-shadow" cx="${((spec.left + spec.right) / 2).toFixed(1)}" cy="${PILE_BASE + 0.5}" rx="${((spec.right - spec.left) / 2 + 4).toFixed(1)}" ry="5" fill="url(#${k}-s)"/>`,
    `<g clip-path="url(#${k}-c)">`,
    `<rect width="${PILE_W}" height="${PILE_H}" fill="url(#${k}-t)"/>`,
    det ? `<rect width="${PILE_W}" height="${PILE_H}" fill="url(#${k}-d)"/>` : "",
    `<rect class="pile-shade" width="${PILE_W}" height="${PILE_H}" fill="url(#${k}-x)"/>`,
    `<rect width="${PILE_W}" height="${PILE_H}" fill="url(#${k}-y)"/>`,
    // perem-fény: a kontúr belső fele (a clip levágja a külsőt)
    `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1.6"/>`,
    "</g>",
  ].join("");
}
