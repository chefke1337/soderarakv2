import type { MaterialGroup } from "@/content/site";

/**
 * Anyagszerű szemcsemintázat SVG-ben (nincs fotó — docs/v2-design-direction.md
 * § V2.1 „assetigény"). Determinisztikus PRNG → SSR és kliens egyezik,
 * nincs layout shift. A szemcseméret aránya az anyag jellegét követi
 * (homok finom, kavics gömbölyű, murva szögletes, bazalt sötét törmelék).
 */

type Tone = MaterialGroup["tone"];

export const MATERIAL_COLOR: Record<Tone, { base: string; grains: string[]; ink: "dark" | "light" }> = {
  homok: { base: "#dcb767", grains: ["#c99f4c", "#e8cd8c", "#b88a3a", "#f1dca6"], ink: "dark" },
  soder: { base: "#b89a6e", grains: ["#d4bb92", "#8e7350", "#a68558", "#e3d0ad", "#7a6448"], ink: "dark" },
  kavics: { base: "#a49e94", grains: ["#cfc9be", "#7d776e", "#b7aa95", "#8f8a82", "#e0d8c9"], ink: "dark" },
  murva: { base: "#cbbfa9", grains: ["#ece4d4", "#a99b82", "#ddd3c0", "#8f826c"], ink: "dark" },
  bazalt: { base: "#45403b", grains: ["#5d5751", "#2c2926", "#6e6760", "#383430"], ink: "light" },
  fold: { base: "#6e4b31", grains: ["#5a3b26", "#83603f", "#4a3020", "#946e4a"], ink: "light" },
};

const SHAPE: Record<Tone, { count: number; min: number; max: number; kind: "round" | "pebble" | "angular" }> = {
  homok: { count: 160, min: 0.6, max: 1.4, kind: "round" },
  soder: { count: 90, min: 0.8, max: 4.2, kind: "pebble" },
  kavics: { count: 34, min: 3.2, max: 7.5, kind: "pebble" },
  murva: { count: 46, min: 2, max: 5.5, kind: "angular" },
  bazalt: { count: 50, min: 1.8, max: 5, kind: "angular" },
  fold: { count: 120, min: 0.6, max: 2.2, kind: "round" },
};

function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const SEED: Record<Tone, number> = { homok: 11, soder: 23, kavics: 37, murva: 41, bazalt: 53, fold: 67 };

/** Egy csempényi szemcse-alakzat (W×H egységben). */
function grains(tone: Tone, W: number, H: number) {
  const { count, min, max, kind } = SHAPE[tone];
  const { grains: cols } = MATERIAL_COLOR[tone];
  const r = prng(SEED[tone]);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const x = r() * W;
    const y = r() * H;
    const s = min + r() * (max - min);
    const fill = cols[Math.floor(r() * cols.length)];
    if (kind === "round") {
      out.push(<circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={s.toFixed(2)} fill={fill} />);
    } else if (kind === "pebble") {
      out.push(
        <ellipse
          key={i}
          cx={x.toFixed(1)}
          cy={y.toFixed(1)}
          rx={s.toFixed(2)}
          ry={(s * (0.65 + r() * 0.3)).toFixed(2)}
          transform={`rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})`}
          fill={fill}
        />,
      );
    } else {
      const pts = Array.from({ length: 5 }, (_, k) => {
        const a = (k / 5) * Math.PI * 2 + r() * 0.8;
        const rr = s * (0.6 + r() * 0.5);
        return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`;
      }).join(" ");
      out.push(<polygon key={i} points={pts} fill={fill} />);
    }
  }
  return out;
}

/** Kitölti a szülőt; `id` egyedi legyen oldalanként. */
export default function MaterialGrain({
  tone,
  id,
  className = "",
  scale = 1,
}: {
  tone: Tone;
  id: string;
  className?: string;
  scale?: number;
}) {
  const W = 120;
  const H = 60;
  const pid = `grain-${id}`;
  return (
    <svg aria-hidden="true" className={`block h-full w-full ${className}`} preserveAspectRatio="none">
      <defs>
        <pattern id={pid} width={W * scale} height={H * scale} patternUnits="userSpaceOnUse">
          <g transform={`scale(${scale})`}>
            <rect width={W} height={H} fill={MATERIAL_COLOR[tone].base} />
            {grains(tone, W, H)}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  );
}
