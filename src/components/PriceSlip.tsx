import Link from "next/link";
import { allMaterials, materialGroups, zones } from "@/content/site";
import { formatFt, minPrice } from "@/lib/ui";
import { withBasePath } from "@/lib/basepath";

/**
 * Hero árjegyzék-szelvény — a V2 egyetlen „hangos" eleme.
 * Mind a hat anyagcsoport induló nettó ára + a fuvarsáv, közvetlenül
 * a site.ts-ből. Minden sor az anyag aloldalára visz.
 */
export default function PriceSlip() {
  const fuelMin = Math.min(...zones.map((z) => z.fuelMin));
  const fuelMax = Math.max(...zones.map((z) => z.fuelMax));

  return (
    <div className="relative">
      {/* hátsó „másolati" lap — anyagszerű mélység árnyék helyett */}
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden translate-x-2 translate-y-2 rounded-sm bg-sand-deep md:block"
      />
      <section
        aria-labelledby="arjegyzek-cim"
        className="relative rounded-sm border border-line-strong bg-paper"
      >
        <header className="flex items-baseline justify-between gap-4 border-b border-dashed border-line-strong px-5 pb-3 pt-4 md:px-6">
          <h2 id="arjegyzek-cim" className="font-display text-heading-sm font-bold">
            Árjegyzék
          </h2>
          <p className="text-xs text-ink-soft">nettó, Ft/m³-től</p>
        </header>

        <ul className="px-2 py-1.5 md:px-3">
          {materialGroups.map((g, i) => {
            const min = minPrice(g.items);
            return (
              <li key={g.slug} className="print-row" style={{ "--i": i } as React.CSSProperties}>
                <Link
                  href={`/anyagok/${g.slug}`}
                  className="group flex min-h-11 items-center gap-3 rounded-sm px-3 py-2 transition-colors hover:bg-sand"
                >
                  <img
                    src={withBasePath(g.texture)}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 rounded-full border border-line object-cover"
                  />
                  <span className="min-w-0 flex-1 sm:flex-none">
                    <span className="block font-semibold leading-tight group-hover:text-brand-deep">
                      {g.name}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden h-px flex-1 translate-y-1 border-b border-dotted border-line-strong sm:block"
                  />
                  <span className="num shrink-0 text-right font-display font-bold">
                    {min !== null ? (
                      formatFt(min)
                    ) : (
                      <span className="font-sans text-sm font-medium text-ink-soft">egyeztetés után</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <footer className="border-t border-dashed border-line-strong px-5 py-4 text-sm md:px-6">
          <dl className="num grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <dt className="text-ink-soft">Fuvar</dt>
            <dd className="text-right font-semibold">
              {formatFt(fuelMin).replace(" Ft", "")} – {formatFt(fuelMax)}
              <span className="font-normal text-ink-soft"> / fuvar, zóna szerint</span>
            </dd>
            <dt className="text-ink-soft">Mennyiség</dt>
            <dd className="text-right font-semibold">4–23 m³ egy fuvarban</dd>
          </dl>
          <Link
            href="/arak"
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-deep underline decoration-brand-dark/40 underline-offset-4 hover:decoration-brand-dark"
          >
            Teljes árlista, {allMaterials.length} tétel
          </Link>
        </footer>
      </section>
    </div>
  );
}
