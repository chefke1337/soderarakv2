/**
 * Anyagszemcse-adatok (React nélkül, tiszta függvények) — a MaterialGrain
 * csempéje és a MaterialPile kupacai közösen használják. Determinisztikus
 * PRNG → SSR és kliens egyezik, nincs layout shift.
 */

export type Tone = "homok" | "soder" | "kavics" | "murva" | "bazalt" | "fold";

export const MATERIAL_COLOR: Record<Tone, { base: string; grains: string[]; ink: "dark" | "light" }> = {
  homok: { base: "#dcb767", grains: ["#c99f4c", "#e8cd8c", "#b88a3a", "#f1dca6"], ink: "dark" },
  soder: { base: "#b89a6e", grains: ["#d4bb92", "#8e7350", "#a68558", "#e3d0ad", "#7a6448"], ink: "dark" },
  kavics: { base: "#a49e94", grains: ["#cfc9be", "#7d776e", "#b7aa95", "#8f8a82", "#e0d8c9"], ink: "dark" },
  murva: { base: "#cbbfa9", grains: ["#ece4d4", "#a99b82", "#ddd3c0", "#8f826c"], ink: "dark" },
  bazalt: { base: "#45403b", grains: ["#5d5751", "#2c2926", "#6e6760", "#383430"], ink: "light" },
  fold: { base: "#6e4b31", grains: ["#5a3b26", "#83603f", "#4a3020", "#946e4a"], ink: "light" },
};

export type GrainKind = "round" | "pebble" | "angular";
export type GrainSpec = { count: number; min: number; max: number; kind: GrainKind };

export const GRAIN_SHAPE: Record<Tone, GrainSpec> = {
  homok: { count: 160, min: 0.6, max: 1.4, kind: "round" },
  soder: { count: 90, min: 0.8, max: 4.2, kind: "pebble" },
  kavics: { count: 34, min: 3.2, max: 7.5, kind: "pebble" },
  murva: { count: 46, min: 2, max: 5.5, kind: "angular" },
  bazalt: { count: 50, min: 1.8, max: 5, kind: "angular" },
  fold: { count: 120, min: 0.6, max: 2.2, kind: "round" },
};

export const GRAIN_SEED: Record<Tone, number> = { homok: 11, soder: 23, kavics: 37, murva: 41, bazalt: 53, fold: 67 };

export function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export type Grain =
  | { kind: "circle"; cx: string; cy: string; r: string; fill: string }
  | { kind: "ellipse"; cx: string; cy: string; rx: string; ry: string; rot: number; fill: string }
  | { kind: "polygon"; points: string; fill: string };

/** Egy W×H csempényi szemcse. A PRNG-hívások sorrendje rögzített (a meglévő minták nem változnak). */
export function grainData(spec: GrainSpec, colors: string[], seed: number, W: number, H: number): Grain[] {
  const { count, min, max, kind } = spec;
  const r = prng(seed);
  const out: Grain[] = [];
  for (let i = 0; i < count; i++) {
    const x = r() * W;
    const y = r() * H;
    const s = min + r() * (max - min);
    const fill = colors[Math.floor(r() * colors.length)];
    if (kind === "round") {
      out.push({ kind: "circle", cx: x.toFixed(1), cy: y.toFixed(1), r: s.toFixed(2), fill });
    } else if (kind === "pebble") {
      const ry = (s * (0.65 + r() * 0.3)).toFixed(2);
      const rot = Math.round(r() * 180);
      out.push({ kind: "ellipse", cx: x.toFixed(1), cy: y.toFixed(1), rx: s.toFixed(2), ry, rot, fill });
    } else {
      const pts = Array.from({ length: 5 }, () => {
        const a = r();
        const rr = r();
        return [a, rr];
      }).map(([a0, rr0], k) => {
        const a = (k / 5) * Math.PI * 2 + a0 * 0.8;
        const rr = s * (0.6 + rr0 * 0.5);
        return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`;
      });
      out.push({ kind: "polygon", points: pts.join(" "), fill });
    }
  }
  return out;
}

/** Egy szemcse SVG-jelölőként (a prototípus-renderhez és tesztekhez). */
export function grainToSvg(g: Grain): string {
  if (g.kind === "circle") return `<circle cx="${g.cx}" cy="${g.cy}" r="${g.r}" fill="${g.fill}"/>`;
  if (g.kind === "ellipse")
    return `<ellipse cx="${g.cx}" cy="${g.cy}" rx="${g.rx}" ry="${g.ry}" transform="rotate(${g.rot} ${g.cx} ${g.cy})" fill="${g.fill}"/>`;
  return `<polygon points="${g.points}" fill="${g.fill}"/>`;
}
