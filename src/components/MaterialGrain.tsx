import type { MaterialGroup } from "@/content/site";
import { GRAIN_SEED, GRAIN_SHAPE, MATERIAL_COLOR, grainData } from "@/lib/grain";

/**
 * Anyagszerű szemcsemintázat SVG-ben (nincs fotó — docs/v2-design-direction.md
 * § V2.1 „assetigény"). Determinisztikus PRNG → SSR és kliens egyezik,
 * nincs layout shift. A szemcseméret aránya az anyag jellegét követi
 * (homok finom, kavics gömbölyű, murva szögletes, bazalt sötét törmelék).
 */

type Tone = MaterialGroup["tone"];

export { MATERIAL_COLOR };

/** Egy csempényi szemcse-alakzat (W×H egységben). */
function grains(tone: Tone, W: number, H: number) {
  return grainData(GRAIN_SHAPE[tone], MATERIAL_COLOR[tone].grains, GRAIN_SEED[tone], W, H).map((g, i) =>
    g.kind === "circle" ? (
      <circle key={i} cx={g.cx} cy={g.cy} r={g.r} fill={g.fill} />
    ) : g.kind === "ellipse" ? (
      <ellipse key={i} cx={g.cx} cy={g.cy} rx={g.rx} ry={g.ry} transform={`rotate(${g.rot} ${g.cx} ${g.cy})`} fill={g.fill} />
    ) : (
      <polygon key={i} points={g.points} fill={g.fill} />
    ),
  );
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
