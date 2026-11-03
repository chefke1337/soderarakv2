/**
 * „Kavicsszegély" — a lábléc felső széle (2026-11-03). A korábbi, éles
 * színblokkokból álló anyagcsík helyett ömlesztett anyag-keresztmetszet:
 * egy vékony homok–sóder–föld rétegsor, rajta különböző méretű, az
 * anyagszínekből kevert „kavicsok". Determinisztikus (fix seed), ezért
 * SSR-biztos; egy ismétlődő SVG-mintából áll, JS nélkül.
 */
const COLORS = [
  "var(--color-mat-soder)",
  "var(--color-mat-homok)",
  "var(--color-mat-kavics)",
  "var(--color-mat-murva)",
  "var(--color-mat-andezit)",
  "var(--color-mat-fold)",
  "var(--color-accent)",
];

const TILE_W = 220;
const H = 22;

function pebbles() {
  // Egyszerű LCG — mindig ugyanaz a minta.
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const out: { cx: number; cy: number; rx: number; ry: number; rot: number; fill: string; o: number }[] = [];
  let x = 2;
  while (x < TILE_W - 2) {
    const rx = 2.2 + rnd() * 4.2;
    const ry = rx * (0.6 + rnd() * 0.25);
    // a nagyobb kavicsok lejjebb ülnek, a kisebbek „rájuk gurulnak"
    const cy = H - 7 - ry * 0.55 - rnd() * 3.5;
    const pick = rnd();
    const fill =
      pick < 0.06 ? COLORS[6]! : COLORS[Math.floor(rnd() * 6)]!;
    out.push({ cx: x + rx, cy, rx, ry, rot: Math.round((rnd() - 0.5) * 40), fill, o: 0.85 + rnd() * 0.15 });
    x += rx * (1.25 + rnd() * 0.9);
  }
  return out;
}

const PEBBLES = pebbles();

export default function PebbleBand({ id = "pebble" }: { id?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" className="pebble-band block h-[22px] w-full" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width={TILE_W} height={H} patternUnits="userSpaceOnUse">
          {/* rétegsor: homok · sóder · föld */}
          <rect x="0" y={H - 7} width={TILE_W} height="2" style={{ fill: "var(--color-mat-homok)" }} />
          <rect x="0" y={H - 5} width={TILE_W} height="3" style={{ fill: "var(--color-mat-soder)" }} />
          <rect x="0" y={H - 2} width={TILE_W} height="2" style={{ fill: "var(--color-mat-fold)" }} />
          {PEBBLES.map((p, i) => (
            <ellipse
              key={i}
              cx={p.cx.toFixed(1)}
              cy={p.cy.toFixed(1)}
              rx={p.rx.toFixed(1)}
              ry={p.ry.toFixed(1)}
              transform={`rotate(${p.rot} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)})`}
              style={{ fill: p.fill, fillOpacity: Number(p.o.toFixed(2)) }}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height={H} fill={`url(#${id})`} />
    </svg>
  );
}
