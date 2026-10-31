import Link from "next/link";
import { EXAMPLE_CALC, FREIGHT_VAT_RATE } from "@/content/site";
import { formatFt, IconArrowRight, IconCalculator } from "@/lib/ui";

/**
 * Kalkulátor-belépő terrakotta panel. A „szelvény" ugyanabból a közös
 * EXAMPLE_CALC-ból számol (site.ts), mint a GYIK — a két megjelenés sosem
 * térhet el. A bontás a V3 ártermészetet követi: anyag BRUTTÓ, fuvar NETTÓ
 * + ÁFA, végül teljes BRUTTÓ.
 */
export default function CalculatorEntry() {
  const e = EXAMPLE_CALC;

  return (
    <section
      aria-labelledby="kalk-belepo-cim"
      className="on-accent relative isolate overflow-hidden bg-surface-accent text-on-dark"
    >
      <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-40 mix-blend-multiply" />
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:gap-10 md:px-6 md:py-20 lg:grid-cols-12 lg:gap-14">
        <div className="min-w-0 lg:col-span-6">
          <p className="label-strata text-on-dark">Árkalkulátor</p>
          <h2
            id="kalk-belepo-cim"
            className="mt-3 font-display text-[2rem] leading-[1.06] font-bold tracking-display text-balance md:text-heading-lg"
          >
            Mennyibe kerül házhoz szállítva?
          </h2>
          <p className="mt-4 max-w-[48ch] text-[1.0625rem] leading-relaxed text-on-accent-muted">
            Anyag, mennyiség, irányítószám — három lépés, és látja a bruttó
            anyagárat, a nettó fuvardíjat, a fuvar ÁFÁ-ját és a teljes bruttó
            tájékoztató összeget. Utána rendelési igényt is küldhet.
          </p>
          <div className="mt-6 grid max-w-[34rem] gap-3 sm:grid-cols-2 md:mt-8 [&>a]:w-full [&>a]:whitespace-nowrap">
            <Link href="/arkalkulator" className="btn btn-lg btn-cream">
              <IconCalculator size={20} className="btn-icon" />
              Árkalkulátor indítása
            </Link>
            <Link
              href={`/arkalkulator?anyag=${e.material.slug}&m3=${e.m3}&irsz=${e.postalCode}`}
              className="btn btn-lg btn-outline-cream"
            >
              Ezzel a példával kezdem
              <IconArrowRight size={18} className="btn-icon btn-icon-move" />
            </Link>
          </div>
        </div>

        {/* Példa-szelvény */}
        <figure className="min-w-0 lg:col-span-6">
          <div className="receipt-tilt relative rounded-[var(--radius-md)] bg-surface p-5 text-text shadow-[0_30px_60px_-30px_rgb(0_0_0_/_0.55)] md:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-dashed border-border-strong pb-4">
              <p className="font-display text-heading-sm font-bold">
                Példa: {e.m3} m³ {e.material.name}
              </p>
              <p className="num text-sm text-text-muted">{e.postalCode} irányítószám</p>
            </div>

            <dl className="num mt-4 space-y-2.5 text-[0.9375rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">
                  Anyag bruttó: {e.m3} × {formatFt(e.material.priceGross!)}
                </dt>
                <dd className="text-right font-semibold whitespace-nowrap">
                  {formatFt(e.materialGross)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border/70 pt-2.5">
                <dt className="text-text-muted">
                  Fuvar nettó
                  <span className="block text-xs">{e.bandLabel} sáv</span>
                </dt>
                <dd className="text-right font-semibold whitespace-nowrap">
                  {formatFt(e.freightNet)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">
                  Fuvar ÁFA ({Math.round(FREIGHT_VAT_RATE * 100)}%)
                </dt>
                <dd className="text-right font-semibold whitespace-nowrap">
                  {formatFt(e.freightVat)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Fuvar bruttó</dt>
                <dd className="text-right font-semibold whitespace-nowrap">
                  {formatFt(e.freightGross)}
                </dd>
              </div>
              <div className="border-t-2 border-text pt-3">
                <dt className="text-sm font-semibold">Teljes bruttó tájékoztató összeg</dt>
                <dd className="num mt-1 font-display text-[1.5rem] leading-tight font-bold tracking-tight whitespace-nowrap text-accent-deep sm:text-[1.875rem] md:text-[2.25rem]">
                  {formatFt(e.totalGross)}
                </dd>
              </div>
            </dl>

            <figcaption className="mt-4 text-xs leading-relaxed text-text-muted">
              Tájékoztató ár. Az anyagár bruttó, az ÁFÁ-t tartalmazza — rá nem kerül
              még egyszer ÁFA. A fuvardíj nettó, rá jön az ÁFA. A végleges ajánlatot
              egyeztetés után adjuk.
            </figcaption>
          </div>
        </figure>
      </div>
    </section>
  );
}
