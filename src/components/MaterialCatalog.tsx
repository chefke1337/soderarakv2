import Link from "next/link";
import {
  DISCLOSURE_FREIGHT,
  DISCLOSURE_GROSS,
  DISCLOSURE_PRICE,
  groupWashed,
  materialGroups,
} from "@/content/site";
import { CalculatorCta, formatFt, minPrice } from "@/lib/ui";
import { withBasePath } from "@/lib/basepath";
import MaterialGrain from "@/components/MaterialGrain";

/**
 * „Anyagok és induló árak" — katalógusszerű anyagválasztó a hero alatt.
 *
 * - Hat anyagcsoport, adat a catalog.ts-ből (név, legalacsonyabb BRUTTÓ ár,
 *   frakciószám, mosottság) — itt semmi nem számolódik újra.
 * - Tételenként hajszálvonal, nem doboz; a kattinthatóságot a név
 *   aláhúzása + egy szerény nyíl jelzi (nincs körbe tett ikon).
 * - Mobilon lista, sm-től két hasáb, lg-től 3×2.
 * - Az ármagyarázat a meglévő DISCLOSURE_* szövegekből épül (egy forrás).
 */
export default function MaterialCatalog() {
  return (
    <section
      aria-labelledby="anyagok-induloarak"
      className="border-b border-ink/15 bg-surface"
    >
      {/* Mobilon: cím → tételek → ármagyarázat; lg-től a magyarázat a cím alatt,
          a tételek jobbra, két soron át. */}
      <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-6 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
        <div className="lg:col-span-4">
          <h2
            id="anyagok-induloarak"
            className="font-display text-heading-lg font-bold tracking-display text-ink"
          >
            Anyagok és induló árak
          </h2>
        </div>
        <ul className="grid content-start sm:grid-cols-2 sm:gap-x-8 lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1 lg:grid-cols-3 lg:gap-x-6">
          {materialGroups.map((g) => {
            const min = minPrice(g.items);
            const wash = groupWashed(g);
            return (
              <li key={g.slug} className="border-t border-ink/15">
                <Link
                  href={`/anyagok/${g.slug}`}
                  className="catalog-item group grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-4 py-4 outline-offset-2 lg:grid-cols-1 lg:items-start lg:gap-3 lg:pt-5 lg:pb-6"
                >
                  {g.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- statikus export, kis forráskép
                    <img
                      src={withBasePath(g.photo.src)}
                      alt=""
                      width={400}
                      height={360}
                      loading="lazy"
                      decoding="async"
                      className="aspect-square h-auto w-16 rounded-[var(--radius-sm)] object-cover lg:aspect-[16/7] lg:w-full"
                      style={{ objectPosition: g.photo.position }}
                    />
                  ) : (
                    // Nincs ellenőrzött fotó (catalog.ts) → jelölt szemcse-illusztráció
                    <span className="block aspect-square w-16 overflow-hidden rounded-[var(--radius-sm)] lg:aspect-[16/7] lg:w-full">
                      <MaterialGrain tone={g.tone} id={`katalogus-${g.slug}`} scale={0.9} />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="flex items-baseline gap-2 font-display text-xl leading-tight font-bold text-ink">
                      <span className="catalog-name">{g.name}</span>
                      <span aria-hidden="true" className="catalog-arrow text-base font-medium text-ink-faint">
                        →
                      </span>
                    </span>
                    <span className="mt-1 block">
                      {min !== null ? (
                        <>
                          <span className="num text-lg font-semibold text-ink">{formatFt(min)}</span>
                          <span className="text-sm text-ink-soft">/m³-tól, bruttó</span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-ink">Ár egyeztetés után</span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-soft">
                      {g.items.length} tétel
                      {wash ? ` · ${wash.scope === "group" ? "mosott" : "mosott frakciók is"}` : ""}
                      {!g.photo ? " · illusztráció" : ""}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="lg:col-span-4 lg:col-start-1 lg:row-start-2">
          <dl className="divide-y divide-ink/15 border-y border-ink/15 text-sm leading-relaxed">
            <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-3">
              <dt className="font-semibold text-ink">Anyagár</dt>
              <dd className="text-ink-soft">{DISCLOSURE_GROSS}</dd>
            </div>
            <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-3">
              <dt className="font-semibold text-ink">Szállítás</dt>
              <dd className="text-ink-soft">{DISCLOSURE_FREIGHT}</dd>
            </div>
            <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-3">
              <dt className="font-semibold text-ink">Végleges ár</dt>
              <dd className="text-ink-soft">{DISCLOSURE_PRICE}</dd>
            </div>
          </dl>
          <CalculatorCta className="link mt-4 inline-flex min-h-11 items-center text-sm text-brand-deep">
            Anyag + szállítás együtt: árkalkulátor
          </CalculatorCta>
        </div>

      </div>
    </section>
  );
}
