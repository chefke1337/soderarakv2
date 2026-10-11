import Link from "next/link";
import { materialGroups, zones } from "@/content/site";
import { formatFt, IconArrowRight, minPrice } from "@/lib/ui";
import MaterialGrain from "@/components/MaterialGrain";

/**
 * Hero „mintasor": a hat anyagcsoport egymás melletti halomként, valódi
 * induló nettó árral (site.ts). A halom teteje kupac-ív (clip-path), a
 * felület SVG-szemcse. Minden halom az anyag aloldalára visz.
 * Mobilon 2×3 rács, alacsonyabb halmokkal.
 */
export default function MaterialHeaps() {
  const fuelMin = Math.min(...zones.map((z) => z.fuelMin));
  const fuelMax = Math.max(...zones.map((z) => z.fuelMax));

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4 text-sm text-on-dark-muted">
        <h2 className="font-display text-base font-bold text-on-dark">Anyagok és induló árak</h2>
        <span>nettó Ft/m³-től</span>
      </div>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
        {materialGroups.map((g, i) => {
          const min = minPrice(g.items);
          return (
            <li key={g.slug} className="heap-in" style={{ "--i": i } as React.CSSProperties}>
              <Link
                href={`/anyagok/${g.slug}`}
                className="heap group relative flex h-36 flex-col justify-end overflow-hidden rounded-b-[var(--radius-md)] outline-offset-4 sm:h-40 lg:h-52"
              >
                {/* halom: kupac-ív tetejű szemcsés felület */}
                <span aria-hidden="true" className="heap-body absolute inset-0">
                  <MaterialGrain tone={g.tone} id={`heap-${g.slug}`} />
                </span>
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 to-transparent" />
                <span className="relative z-10 flex items-end justify-between gap-2 p-3">
                  <span className="min-w-0">
                    <span className="block font-display text-lg leading-tight font-bold text-on-dark">{g.name}</span>
                    <span className="num mt-0.5 block text-sm font-semibold text-on-dark">
                      {min !== null ? formatFt(min) : "egyeztetés után"}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-on-dark/15 text-on-dark transition-[background-color,transform] duration-[var(--dur-fast)] group-hover:bg-accent group-focus-visible:bg-accent"
                  >
                    <IconArrowRight size={15} className="heap-arrow" />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="num mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-on-dark-muted">
        <span>
          Fuvar, zóna szerint: <strong className="font-semibold text-on-dark">{formatFt(fuelMin).replace(" Ft", "")}–{formatFt(fuelMax)}</strong>
        </span>
        <span>
          Egy fuvarban: <strong className="font-semibold text-on-dark">4–23 m³</strong>
        </span>
      </p>
    </div>
  );
}
