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

const TILE_W = 260;
const H = 30;
const BED = 6; // rétegsor magassága alul

type Pebble = { cx: number; cy: number; rx: number; ry: number; rot: number; fill: string; o: number; front: boolean };

function pebbles(): Pebble[] {
  // Egyszerű LCG — mindig ugyanaz a minta (SSR-biztos).
  let seed = 11;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const color = () => (rnd() < 0.07 ? COLORS[6]! : COLORS[Math.floor(rnd() * 6)]!);
  const out: Pebble[] = [];
  // hátsó sor: kisebb, halványabb kavicsok
  for (let x = 1; x < TILE_W - 4; ) {
    const rx = 2.5 + rnd() * 3.5;
    const ry = rx * (0.62 + rnd() * 0.22);
    out.push({ cx: x + rx, cy: H - BED - ry - 3 - rnd() * 4, rx, ry, rot: Math.round((rnd() - 0.5) * 50), fill: color(), o: 0.55, front: false });
    x += rx * (1.5 + rnd() * 1.2);
  }
  // első sor: nagyobb kavicsok a rétegsoron ülve
  for (let x = 0; x < TILE_W - 6; ) {
    const rx = 3.5 + rnd() * 5;
    const ry = rx * (0.58 + rnd() * 0.22);
    out.push({ cx: x + rx, cy: H - BED - ry * 0.7, rx, ry, rot: Math.round((rnd() - 0.5) * 30), fill: color(), o: 1, front: true });
    x += rx * (1.6 + rnd() * 0.9);
  }
  return out;
}

const PEBBLES = pebbles();

export default function PebbleBand({ id = "pebble" }: { id?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" className="pebble-band block h-[30px] w-full" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width={TILE_W} height={H} patternUnits="userSpaceOnUse">
          {/* rétegsor: homok · sóder · föld */}
          <rect x="0" y={H - BED} width={TILE_W} height="2" style={{ fill: "var(--color-mat-homok)" }} />
          <rect x="0" y={H - BED + 2} width={TILE_W} height="2" style={{ fill: "var(--color-mat-soder)" }} />
          <rect x="0" y={H - 2} width={TILE_W} height="2" style={{ fill: "var(--color-mat-fold)" }} />
          {PEBBLES.map((p, i) => {
            const cx = p.cx.toFixed(1);
            const cy = p.cy.toFixed(1);
            return (
              <g key={i} transform={`rotate(${p.rot} ${cx} ${cy})`}>
                <ellipse cx={cx} cy={cy} rx={p.rx.toFixed(1)} ry={p.ry.toFixed(1)} style={{ fill: p.fill, fillOpacity: p.o }} />
                {p.front && (
                  <>
                    {/* árnyék alul, fényfolt felül: térbeli kavics */}
                    <ellipse cx={cx} cy={(p.cy + p.ry * 0.35).toFixed(1)} rx={(p.rx * 0.85).toFixed(1)} ry={(p.ry * 0.5).toFixed(1)} style={{ fill: "#000", fillOpacity: 0.18 }} />
                    <ellipse cx={(p.cx - p.rx * 0.3).toFixed(1)} cy={(p.cy - p.ry * 0.4).toFixed(1)} rx={(p.rx * 0.35).toFixed(1)} ry={(p.ry * 0.22).toFixed(1)} style={{ fill: "#fff", fillOpacity: 0.28 }} />
                  </>
                )}
              </g>
            );
          })}
        </pattern>
      </defs>
      <rect width="100%" height={H} fill={`url(#${id})`} />
    </svg>
  );
}
