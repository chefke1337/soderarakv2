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
 * görbe. Szögletes anyag (murva, andezit): ritkább pontok, egyenes élek.
 */
import { MATERIAL_COLOR, grainData, grainToSvg, type Tone } from "./grain";

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

/*
 * MÉRETARÁNY — egy valós, 10 m³-es lerakott kupac (2026-11-07 kutatás).
 * Kúp-közelítés: V = π·r²·h/3, h = r·tg(φ) → r = ∛(3V / (π·tg φ)).
 * Természetes rézsűszög (φ) források alapján (Engineering ToolBox
 * „Angles of Repose", Wikipedia „Angle of repose"):
 *   homok (száraz) ≈ 34° · sóder (homokos természetes kavics) ≈ 30° ·
 *   kavics (mosott, gömbölyű) ≈ 35° · zúzott kő (murva, andezit) ≈ 40° ·
 *   laza föld ≈ 35°
 * 10 m³-re: φ=30° → Ø 5,1 m, h 1,47 m · φ=34° → Ø 4,85 m, h 1,63 m ·
 *           φ=35° → Ø 4,8 m, h 1,67 m · φ=40° → Ø 4,5 m, h 1,89 m
 * Rajzlépték: 33 egység / m (a legszélesebb, a sóder 168 egység). Így a
 * kupacok egymáshoz képest is helyes arányúak (a zúzott kő keskenyebb és
 * magasabb, a sóder laposabb és szélesebb).
 */
export const PILE_SCALE = 33; // viewBox-egység / méter

const fromCone = (diaM: number, hM: number) => {
  const half = (diaM * PILE_SCALE) / 2;
  return { left: 100 - half, right: 100 + half, height: Math.round(hM * PILE_SCALE * 10) / 10 };
};

export const PILE: Record<Tone, PileSpec> = {
  // sóder (0–24, homokos kavics), φ≈30°: legszélesebb, leglaposabb
  soder: { ...fromCone(5.1, 1.47), peak: 0.46, a: 1.75, b: 1.25, faceted: false, samples: 44,
    ripples: [[0.8, 5, 0.4], [0.5, 11, 1.9], [0.25, 19, 0.2]] },
  // homok, φ≈34°: lágy, sima ív
  homok: { ...fromCone(4.85, 1.63), peak: 0.54, a: 2.1, b: 1.4, faceted: false, samples: 40,
    ripples: [[0.4, 3, 2.1], [0.15, 9, 0.7]] },
  // kavics (mosott, gömbölyű), φ≈35°
  kavics: { ...fromCone(4.8, 1.67), peak: 0.5, a: 2.3, b: 1.15, faceted: false, samples: 40,
    ripples: [[0.5, 4, 1.2], [0.35, 10, 0.5], [0.2, 14, 2.4]] },
  // murva (zúzott), φ≈40°: keskenyebb, meredekebb, szögletes kontúr
  murva: { ...fromCone(4.5, 1.89), peak: 0.42, a: 1.42, b: 1.2, faceted: true, samples: 19,
    ripples: [[0.9, 6, 2.6], [0.5, 13, 1.1]] },
  // andezit (zúzott), φ≈40°
  andezit: { ...fromCone(4.5, 1.89), peak: 0.56, a: 1.45, b: 1.15, faceted: true, samples: 17,
    ripples: [[1.0, 7, 0.3], [0.6, 15, 1.4]] },
  // föld (laza), φ≈35°: organikus, rögös
  fold: { ...fromCone(4.8, 1.67), peak: 0.44, a: 1.85, b: 1.3, faceted: false, samples: 46,
    ripples: [[1.6, 2.6, 3.6], [0.8, 9, 0.8], [0.4, 17, 2.9]] },
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
 * SZEMCSEMÉRET a kupacon — valós léptékben (PILE_SCALE = 33 egység/m →
 * 1 mm = 0,033 egység; a sugár = szemcseátmérő/2). A katalógus frakciói:
 *   homok 0–1 mm / bányahomok  → egyedi szem nem látszik: csak finom tónuszaj
 *   sóder 0–24 mm (jellemző)   → túlnyomóan finom, szórt 4–24 mm-es szemek
 *   kavics 16–32 mm (jellemző) → sűrűn rakott, gömbölyű szemek
 *   murva 0–22 mm (jellemző)   → finom zúzalék + 5–22 mm szögletes szemek
 *   andezit 4–22 mm            → szögletes zúzalék, egyenletesebb
 *   föld                       → 10–80 mm-es rögök + morzsa
 * Valós léptékben a szem pixel alatti lenne (32 mm ≈ 0,7 px), ami a kártyán
 * csíkos/rácsos moiré-t adott (ügyfél, 2026-11-08) — ezért a szemek
 * ábrázolási célból NAGYÍTVA (≈1–3 CSS px) jelennek meg; az anyagok egymáshoz
 * viszonyított szemcsemérete (homok < sóder finom része < murva < kavics,
 * föld rögök) megmarad. A finom felületi zajt feTurbulence adja (nem csempe).
 */
type GrainLayer = { count: number; min: number; max: number; kind: "round" | "pebble" | "angular"; colors: string[]; seed: number };
export const PILE_GRAIN: Record<Tone, { tile: [number, number]; layers: GrainLayer[] }> = {
  // 2026-11-08 ügyfél: „csíkos, rácsos" — a pixel alatti, kis csempés szemek
  // moiré-t adtak. Most NAGYOBB, jól látható szemek (≈1–3 CSS px), nagyobb
  // csempe és közeli tónusok → egyenletes, „szemcsés" felület, ismétlődés nélkül.
  homok: { tile: [48, 24], layers: [
    { count: 620, min: 0.42, max: 0.72, kind: "round", colors: ["#d9b462", "#e8cd8c", "#cfa652", "#efd9a2", "#c99d4a"], seed: 201 },
  ] },
  soder: { tile: [48, 24], layers: [
    { count: 460, min: 0.45, max: 0.75, kind: "round", colors: ["#d4bb92", "#c3a67a", "#e0cba6", "#b8996b"], seed: 211 },
    { count: 90, min: 0.9, max: 1.8, kind: "pebble", colors: ["#8c7457", "#e3d0ad", "#a68558", "#cfc9be", "#9e9389"], seed: 212 },
  ] },
  kavics: { tile: [48, 24], layers: [
    { count: 330, min: 0.95, max: 1.7, kind: "pebble", colors: ["#c3bcb1", "#a9a297", "#b8af9f", "#9d978e", "#d0c9bd", "#8f897f"], seed: 221 },
  ] },
  murva: { tile: [48, 24], layers: [
    { count: 340, min: 0.45, max: 0.8, kind: "round", colors: ["#c9bda6", "#ddd3c0", "#b3a68d"], seed: 231 },
    { count: 170, min: 0.9, max: 1.7, kind: "angular", colors: ["#ece4d4", "#b7aa92", "#ddd3c0", "#9d907a"], seed: 232 },
  ] },
  andezit: { tile: [48, 24], layers: [
    { count: 360, min: 0.75, max: 1.5, kind: "angular", colors: ["#8a8077", "#6e665e", "#9b9188", "#5f574f", "#a9a097"], seed: 241 },
  ] },
  fold: { tile: [48, 24], layers: [
    { count: 420, min: 0.5, max: 1.0, kind: "round", colors: ["#6a4a33", "#83603f", "#5a3b26", "#94704d"], seed: 251 },
    { count: 46, min: 1.2, max: 2.6, kind: "round", colors: ["#4a3020", "#8a6644", "#5a3b26"], seed: 252 },
  ] },
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
  const g = PILE_GRAIN[tone];
  const [tw, th] = g.tile;
  const grains = g.layers
    .map((l) => grainData({ count: l.count, min: l.min, max: l.max, kind: l.kind }, l.colors, l.seed, tw, th).map(grainToSvg).join(""))
    .join("");
  const light = tone === "andezit" || tone === "fold" ? 0.2 : 0.16;
  return [
    "<defs>",
    `<pattern id="${k}-t" width="${tw}" height="${th}" patternUnits="userSpaceOnUse"><rect width="${tw}" height="${th}" fill="${col.base}"/>${grains}</pattern>`,
    `<clipPath id="${k}-c"><path d="${d}"/></clipPath>`,
    `<filter id="${k}-n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${tone.length * 7}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.2 -0.55"/></filter>`,
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
    `<rect width="${PILE_W}" height="${PILE_H}" filter="url(#${k}-n)" opacity="0.35"/>`,
    `<rect class="pile-shade" width="${PILE_W}" height="${PILE_H}" fill="url(#${k}-x)"/>`,
    `<rect width="${PILE_W}" height="${PILE_H}" fill="url(#${k}-y)"/>`,
    // perem-fény: a kontúr belső fele (a clip levágja a külsőt)
    `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="1.6"/>`,
    "</g>",
  ].join("");
}
