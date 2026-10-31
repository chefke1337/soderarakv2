import Link from "next/link";
import {
  freightProfiles,
  materialGroups,
  MIN_ORDER_M3,
  SINGLE_TRIP_MAX_M3,
} from "@/content/site";
import { formatFt, IconArrowRight, IconDroplets, minPrice } from "@/lib/ui";
import MaterialPile from "@/components/MaterialPile";
import HeapRail from "@/components/HeapRail";

/**
 * Hero „mintasor": a hat anyagcsoport egymás mellett, valódi induló BRUTTÓ
 * árral (catalog.ts). Minden kártya: alacsony, széles, anyagonként eltérő
 * kupac-sziluett (MaterialPile), alatta név, ár és nyíl. A teljes kártya egy
 * link az anyag aloldalára.
 *
 * Mobilon/tableten szándékosan EGYETLEN, oldalirányban görgethető sor
 * (HeapRail) — nem lesz belőle magas, boltíves kártyarács. lg-től 6 hasáb.
 */
export default function MaterialHeaps() {
  // A legalacsonyabb nettó fuvardíj a jóváhagyott díjprofilokból (nem becsült).
  const freightMinNet = Math.min(
    ...freightProfiles.flatMap((p) => p.bands.map((b) => b.netFee)),
  );

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4 text-sm text-on-dark-muted">
        <h2 className="font-display text-base font-bold text-on-dark">
          Anyagok és induló árak
        </h2>
        <span className="num">bruttó Ft/m³-től</span>
      </div>

      {/* < lg: egyetlen, natívan lapozható sor (a következő kártya belóg, ezért
          egyértelmű, hogy van még); csak ez a sáv görget oldalra, az oldal nem.
          lg+: a változatlan hathasábos rács. */}
      <HeapRail className="heap-rail -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 pt-2 pb-3 md:-mx-6 md:scroll-px-6 md:px-6 lg:mx-0 lg:grid lg:snap-none lg:grid-cols-6 lg:gap-3 lg:overflow-visible lg:px-0 lg:pt-0 lg:pb-0">
        {materialGroups.map((g, i) => {
          const min = minPrice(g.items);
          return (
            <li
              key={g.slug}
              className="heap-in w-[clamp(7.75rem,40vw,10rem)] shrink-0 snap-start lg:w-auto"
              style={{ "--i": i } as React.CSSProperties}
            >
              <Link
                href={`/anyagok/${g.slug}`}
                className="heap group flex h-full flex-col rounded-[var(--radius-md)] p-2 outline-offset-2 lg:p-3"
              >
                {/* a kupac: önálló sziluett a „talajon", kontaktárnyékkal */}
                <MaterialPile tone={g.tone} id={`heap-${g.slug}`} />
                {/* név + nyíl egy sorban, alatta az ár teljes szélességben */}
                <span className="mt-1 flex items-center justify-between gap-2">
                  <span className="min-w-0 font-display text-[1.0625rem] leading-tight font-bold text-on-dark lg:text-lg">
                    {g.name}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-on-dark/12 text-on-dark transition-colors duration-[var(--dur-fast)] group-hover:bg-accent group-focus-visible:bg-accent lg:h-8 lg:w-8"
                  >
                    <IconArrowRight size={15} className="heap-arrow" />
                  </span>
                </span>
                <span className="num mt-0.5 block text-sm leading-snug font-semibold text-on-dark">
                  {min !== null ? `${formatFt(min)}-tól` : "egyeztetés után"}
                </span>
                {g.washed && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-amber">
                    <IconDroplets size={11} />
                    mosott
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </HeapRail>

      <p className="num mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-on-dark-muted lg:mt-4 lg:gap-x-6">
        <span>
          Anyagár:{" "}
          <strong className="font-semibold text-on-dark">bruttó, ÁFÁ-val</strong>
        </span>
        <span>
          Fuvar nettó:{" "}
          <strong className="font-semibold text-on-dark">
            {formatFt(freightMinNet)}-tól
          </strong>
        </span>
        <span>
          Egy fuvarban:{" "}
          <strong className="font-semibold text-on-dark">
            {MIN_ORDER_M3}–{SINGLE_TRIP_MAX_M3} m³
          </strong>
        </span>
      </p>
    </div>
  );
}
