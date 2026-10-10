import { depot, settlements, zones, type Zone } from "@/content/site";

/**
 * Statikus zóna-vázlat (SVG, JS és térképcsempe nélkül) a főoldalra.
 * A site.ts tájékoztató zónakörvonalaiból és településkoordinátáiból
 * vetít — ugyanaz az adat, mint az interaktív Leaflet-térképen.
 */
const W = 640;
/** Ütközés elkerülése: ezek a feliratok a pont bal oldalára kerülnek. */
const LEFT_LABEL = new Set(["budafok", "diosd", "erd", "torokbalint"]);
const PAD = 22;

const ZONE_STYLE: Record<Zone["id"], { fill: string; stroke: string; label: string }> = {
  mag: { fill: "rgb(180 83 47 / 0.30)", stroke: "#b4532f", label: "1" },
  kozel: { fill: "rgb(217 183 122 / 0.32)", stroke: "#b08a4c", label: "2" },
  tavolabbi: { fill: "rgb(201 184 150 / 0.30)", stroke: "#9a8a6c", label: "3" },
};

export default function ZoneSketch({ className = "" }: { className?: string }) {
  // A keret a zónákra ÉS a településekre is illeszkedik (Újbuda ne essen a szélre)
  const pts: [number, number][] = [...zones.flatMap((z) => z.polygon.flat()), ...settlements.map((s) => s.latlng)];
  const lats = pts.map((p) => p[0]);
  const lons = pts.map((p) => p[1]);
  const lat0 = (Math.min(...lats) + Math.max(...lats)) / 2;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const minX = Math.min(...lons) * k;
  const maxX = Math.max(...lons) * k;
  const minY = -Math.max(...lats);
  const maxY = -Math.min(...lats);
  const LABEL_ROOM = 130; // jobb oldali hely a szélső (Újbuda, Csepel, Szigetszentmiklós) feliratoknak
  const scale = (W - PAD * 2 - LABEL_ROOM) / (maxX - minX);
  const H = Math.round((maxY - minY) * scale + PAD * 2);

  const proj = ([lat, lon]: [number, number]) =>
    [PAD + (lon * k - minX) * scale, PAD + (-lat - minY) * scale] as const;

  const path = (ring: [number, number][]) =>
    ring.map((p, i) => `${i ? "L" : "M"}${proj(p)[0].toFixed(1)} ${proj(p)[1].toFixed(1)}`).join(" ") + " Z";

  // a nagyobb zónát rajzoljuk alulra
  const order: Zone["id"][] = ["kozel", "tavolabbi", "mag"];
  const [dx, dy] = proj(depot.latlng);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Szállítási zónák vázlata: 1. Budafok és környéke, 2. közeli települések, 3. távolabbi települések, a budafoki telephely körül."
      className={`h-auto w-full ${className}`}
    >
      {order.map((id) => {
        const z = zones.find((zz) => zz.id === id)!;
        const st = ZONE_STYLE[id];
        return z.polygon.map((ring, i) => (
          <path key={`${id}-${i}`} d={path(ring)} fill={st.fill} stroke={st.stroke} strokeWidth={1.25} strokeLinejoin="round" />
        ));
      })}

      {settlements
        .filter((s) => s.slug !== "budapest-22-kerulet") /* kerület, nem pont: Budafok, Budatétény, Nagytétény jelöli */
        .map((s) => {
          const [x, y] = proj(s.latlng);
          const short = s.name.replace(/\s*\(.*\)$/, "");
          const left = LEFT_LABEL.has(s.slug);
          return (
            <g key={s.slug}>
              <circle cx={x} cy={y} r={3.6} fill="#24211d" stroke="#fffaf1" strokeWidth={1.2} />
              <text
                x={left ? x - 7 : x + 7}
                y={y + 4.5}
                textAnchor={left ? "end" : "start"}
                className="fill-ink"
                style={{ fontSize: 14, fontWeight: 600 }}
                paintOrder="stroke"
                stroke="#fffaf1"
                strokeWidth={3.5}
                strokeLinejoin="round"
              >
                {short}
              </text>
            </g>
          );
        })}

      {zones.map((z) => {
        const [x, y] = proj(z.center);
        const st = ZONE_STYLE[z.id];
        const ox = z.id === "mag" ? -30 : z.id === "kozel" ? -56 : -10;
        const oy = z.id === "mag" ? 34 : z.id === "kozel" ? 52 : -6;
        return (
          <g key={`lbl-${z.id}`} aria-hidden="true">
            <circle cx={x + ox} cy={y + oy} r={11} fill="#fbf8f2" stroke={st.stroke} strokeWidth={1.5} />
            <text x={x + ox} y={y + oy + 4.5} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700 }} className="fill-ink">
              {st.label}
            </text>
          </g>
        );
      })}

      <g aria-hidden="true">
        <rect x={dx - 7} y={dy - 7} width={14} height={14} rx={2} fill="#c2410c" stroke="#fbf8f2" strokeWidth={2} />
      </g>
    </svg>
  );
}
