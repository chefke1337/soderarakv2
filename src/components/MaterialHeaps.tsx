import Link from "next/link";
import {
  materialGroups,
  MIN_ORDER_M3,
  SINGLE_TRIP_MAX_M3,
  groupWashed,
} from "@/content/site";
import { formatFt, IconArrowRight, IconDroplets, minPrice } from "@/lib/ui";
import { PILE_H, PILE_W } from "@/lib/pile";
import { withBasePath } from "@/lib/basepath";
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
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-4 text-sm text-on-dark-muted sm:mb-3 lg:mb-4">
        <div>
          <h2 className="font-display text-[1.0625rem] leading-tight font-bold text-on-dark min-[400px]:text-lg md:text-xl lg:text-2xl">
            Anyagok és induló árak
          </h2>
          <span className="num block text-[0.6875rem] sm:mt-0.5 sm:text-xs md:text-sm">bruttó Ft/m³-től</span>
        </div>
        <Link
          href="/anyagok"
          className="heap-all inline-flex min-h-11 shrink-0 items-center gap-1.5 font-semibold text-on-dark underline-offset-4 hover:text-amber hover:underline"
        >
          <span className="sm:hidden">Összes anyag</span>
          <span className="hidden sm:inline">Összes anyag megtekintése</span>
          <IconArrowRight size={16} />
        </Link>
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
              className="heap-in w-[calc((100vw-2rem-1.25rem)/3)] shrink-0 snap-start sm:w-[clamp(7.75rem,26vw,10rem)] lg:w-auto"
              style={{ "--i": i } as React.CSSProperties}
            >
              <Link
                href={`/anyagok/${g.slug}`}
                className="heap group flex h-full flex-col rounded-[var(--radius-md)] p-2 outline-offset-2 lg:p-3"
              >
                {/* matt üveg: a kupac elmosott, felnagyított színe „átdereng" a csempén */}
                {/* eslint-disable-next-line @next/next/no-img-element -- díszítő háttér: a korábbi kupac-grafika
                    rögzített kis raszterképe (ügyfél, 2026-11-08: „a háttér maradjon ami volt") */}
                <img aria-hidden="true" src={withBasePath(`/kupac-hatter/${g.tone}.webp`)} alt="" width={PILE_W} height={PILE_H} decoding="async" className="heap-bleed" />
                {/* a kupac: önálló sziluett a „talajon", kontaktárnyékkal */}
                {/* eslint-disable-next-line @next/next/no-img-element -- statikus export, előre
                    generált SVG; next/image itt nem optimalizálna semmit */}
                <img
                  src={withBasePath(`/kupac/${g.tone}.svg`)}
                  alt=""
                  width={PILE_W}
                  height={PILE_H}
                  decoding="async"
                  fetchPriority={i < 3 ? "high" : "auto"}
                  className="pile-img block h-auto w-full"
                />
                {/* név, alatta ár + nyíl egy sorban (app-szerű kártya, mockup 2026-11-20) */}
                <span className="mt-1 block min-w-0 font-display text-[1rem] leading-tight font-bold text-on-dark sm:text-[1.0625rem] lg:text-lg">
                  {g.name}
                </span>
                <span className="mt-1 flex items-center justify-between gap-1.5">
                  <span className="num min-w-0 text-[0.75rem] leading-snug font-semibold tracking-[-0.01em] whitespace-nowrap text-on-dark min-[400px]:text-[0.8125rem] sm:text-sm">
                    {min !== null ? `${formatFt(min)}-tól` : "egyeztetés után"}
                  </span>
                  <span
                    aria-hidden="true"
                    className="heap-go max-sm:absolute max-sm:top-1.5 max-sm:right-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-on-dark/12 text-on-dark transition-colors duration-[var(--dur-fast)] group-hover:bg-accent group-hover:text-on-dark group-focus-visible:bg-accent group-focus-visible:text-on-dark sm:h-7 sm:w-7 lg:h-8 lg:w-8"
                  >
                    <IconArrowRight size={14} className="heap-arrow" />
                  </span>
                </span>
                {groupWashed(g) && (
                  <span className="heap-washed mt-1 inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-amber">
                    <IconDroplets size={11} />
                    <span className="sm:hidden">mosott</span>
                    <span className="hidden sm:inline">{groupWashed(g)!.scope === "group" ? "mosott" : "mosott frakciók"}</span>
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
          Szállítási díj:{" "}
          <strong className="font-semibold text-on-dark">az árkalkulátorban</strong>
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
