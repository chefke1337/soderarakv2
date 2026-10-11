import Link from "next/link";
import { materialGroups, zones } from "@/content/site";
import { formatFt, IconArrowRight, minPrice } from "@/lib/ui";
import MaterialGrain from "@/components/MaterialGrain";
import HeapRail from "@/components/HeapRail";

/**
 * Hero „mintasor": a hat anyagcsoport egymás melletti halomként, valódi
 * induló nettó árral (site.ts). A halom teteje kupac-ív (clip-path), a
 * felület SVG-szemcse. Minden halom az anyag aloldalára visz.
 * lg alatt egyetlen, oldalirányban lapozható sor (HeapRail), lg-től 6 hasáb.
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
      {/* < lg: egyetlen, natívan lapozható sor (a következő kártya belóg, ezért
          egyértelmű, hogy van még); csak ez a sáv görget oldalra, az oldal nem.
          lg+: a változatlan hathasábos rács. */}
      <HeapRail className="heap-rail -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 pt-2 pb-3 md:-mx-6 md:scroll-px-6 md:px-6 lg:mx-0 lg:grid lg:snap-none lg:grid-cols-6 lg:gap-3 lg:overflow-visible lg:px-0 lg:pt-0 lg:pb-0">
        {materialGroups.map((g, i) => {
          const min = minPrice(g.items);
          return (
            <li key={g.slug} className="heap-in w-[8.75rem] shrink-0 snap-start sm:w-[10rem] lg:w-auto" style={{ "--i": i } as React.CSSProperties}>
              <Link
                href={`/anyagok/${g.slug}`}
                className="heap group relative flex h-[7.75rem] flex-col justify-end overflow-hidden rounded-b-[var(--radius-md)] outline-offset-[-3px] sm:h-36 lg:h-52 lg:outline-offset-4"
              >
                {/* halom: kupac-ív tetejű szemcsés felület */}
                <span aria-hidden="true" className="heap-body absolute inset-0">
                  <MaterialGrain tone={g.tone} id={`heap-${g.slug}`} />
                </span>
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 to-transparent" />
                <span className="relative z-10 flex items-end justify-between gap-2 p-2.5 lg:p-3">
                  <span className="min-w-0">
                    <span className="block font-display text-[1.0625rem] leading-tight font-bold text-on-dark lg:text-lg">{g.name}</span>
                    <span className="num mt-0.5 block text-sm leading-snug font-semibold text-on-dark">
                      {min !== null ? formatFt(min) : "egyeztetés után"}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-on-dark/15 text-on-dark transition-[background-color,transform] duration-[var(--dur-fast)] group-hover:bg-accent group-focus-visible:bg-accent lg:h-8 lg:w-8"
                  >
                    <IconArrowRight size={15} className="heap-arrow" />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </HeapRail>
      <p className="num mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-on-dark-muted lg:mt-4 lg:gap-x-6">
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
