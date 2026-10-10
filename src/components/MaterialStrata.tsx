import Link from "next/link";
import { materialGroups, zones } from "@/content/site";
import { formatFt, minPrice } from "@/lib/ui";
import MaterialGrain from "@/components/MaterialGrain";

/**
 * Hero „rétegrend": a hat anyagcsoport egymásra rétegzett, anyagszerű
 * sávként — mint egy depó-halom keresztmetszete. Minden réteg az anyag
 * aloldalára visz, és a site.ts induló nettó árát mutatja (az előző
 * árjegyzék-szelvény tartalma, most a hero vizuális központjaként).
 */

// Szabálytalan, de determinisztikus rétegfelső él (clip-path)
function edge(i: number) {
  const pts = [0, 14, 31, 48, 66, 83, 100].map((x, k) => {
    const y = ((i * 7 + k * 13) % 9) / 2.4; // 0–3.3%
    return `${x}% ${y.toFixed(1)}%`;
  });
  return `polygon(${pts.join(", ")}, 100% 100%, 0% 100%)`;
}

export default function MaterialStrata() {
  const fuelMin = Math.min(...zones.map((z) => z.fuelMin));
  const fuelMax = Math.max(...zones.map((z) => z.fuelMax));

  return (
    <figure className="relative">
      <figcaption className="mb-3 flex items-baseline justify-between gap-4 text-sm text-on-dark-muted">
        <span className="font-display text-base font-bold text-on-dark">Anyagok és induló árak</span>
        <span>nettó Ft/m³-től</span>
      </figcaption>
      <ul className="overflow-hidden rounded-[var(--radius-lg)] bg-surface-dark ring-1 ring-black/30">
        {materialGroups.map((g, i) => {
          const min = minPrice(g.items);
          return (
            <li key={g.slug} className="strata-in -mt-1.5 first:mt-0" style={{ "--i": i, zIndex: i } as React.CSSProperties}>
              <Link
                href={`/anyagok/${g.slug}`}
                className="strata-band group relative flex h-[3.75rem] items-center justify-between gap-3 px-3 outline-offset-[-3px] sm:h-[4.25rem] sm:px-4"
                style={{ clipPath: i === 0 ? undefined : edge(i) }}
              >
                <span className="absolute inset-0 -z-0">
                  <MaterialGrain tone={g.tone} id={`strata-${g.slug}`} />
                </span>
                <span className="strata-tag relative z-10 inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-surface/92 px-2.5 py-1 font-display font-bold text-text shadow-card">
                  {g.name}
                </span>
                <span className="relative z-10 num rounded-[var(--radius-sm)] bg-surface-dark/88 px-2.5 py-1 text-right font-display font-bold text-on-dark">
                  {min !== null ? formatFt(min) : <span className="font-sans text-sm font-medium">egyeztetés után</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <dl className="num mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] bg-white/10 text-sm">
        <div className="bg-surface-dark-2 px-3.5 py-2.5">
          <dt className="text-on-dark-muted">Fuvar, zóna szerint</dt>
          <dd className="font-semibold text-on-dark">
            {formatFt(fuelMin).replace(" Ft", "")}–{formatFt(fuelMax)}
          </dd>
        </div>
        <div className="bg-surface-dark-2 px-3.5 py-2.5">
          <dt className="text-on-dark-muted">Egy fuvarban</dt>
          <dd className="font-semibold text-on-dark">4–23 m³</dd>
        </div>
      </dl>
    </figure>
  );
}
