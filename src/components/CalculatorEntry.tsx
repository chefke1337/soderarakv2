import Link from "next/link";
import { findMaterial, findZone } from "@/content/site";
import { formatFt, IconArrowRight, IconCalculator } from "@/lib/ui";

/**
 * Kalkulátor-belépő terrakotta panel. A „számla" a GYIK meglévő
 * példáját (8 m³ Sóder 0/24 Budafokra) számolja ki ugyanazzal a
 * képlettel, mint az ArkalkulatorForm — site.ts adatokból, így a két
 * megjelenés soha nem tér el. Nincs külön, működésképtelen demo-input.
 */
export default function CalculatorEntry() {
  const m = findMaterial("soder-0-24");
  const z = findZone("mag");
  const qty = 8;
  if (!m || m.priceNet === null) return null;
  const material = m.priceNet * qty;

  return (
    <section aria-labelledby="kalk-belepo-cim" className="on-accent relative isolate overflow-hidden bg-surface-accent text-on-dark">
      <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-40 mix-blend-multiply" />
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:gap-10 md:px-6 md:py-20 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-6">
          <p className="label-strata text-on-dark">Árkalkulátor</p>
          <h2 id="kalk-belepo-cim" className="mt-3 font-display text-[2rem] leading-[1.06] font-bold tracking-display text-balance md:text-heading-lg">
            Mennyibe kerül házhoz szállítva?
          </h2>
          <p className="mt-4 max-w-[48ch] text-[1.0625rem] leading-relaxed text-on-accent-muted">
            Anyag, mennyiség, település — három választás, és látja a
            tájékoztató nettó összeget fuvarral együtt. Utána egy névvel és
            telefonszámmal ajánlatot kérhet.
          </p>
          <div className="mt-6 grid max-w-[34rem] md:mt-8 gap-3 sm:grid-cols-2 [&>a]:w-full [&>a]:whitespace-nowrap">
            <Link href="/arkalkulator" className="btn btn-lg btn-cream">
              <IconCalculator size={20} className="btn-icon" />
              Árkalkulátor indítása
            </Link>
            <Link href={`/arkalkulator?anyag=${m.slug}`} className="btn btn-lg btn-outline-cream">
              Ezzel a példával kezdem
              <IconArrowRight size={18} className="btn-icon btn-icon-move" />
            </Link>
          </div>
        </div>

        {/* Példa-szelvény */}
        <figure className="lg:col-span-6">
          <div className="relative rotate-[-1.2deg] rounded-[var(--radius-md)] bg-surface p-5 text-text shadow-[0_30px_60px_-30px_rgb(0_0_0_/_0.55)] transition-transform duration-[var(--dur-enter)] ease-[var(--ease-out-soft)] hover:rotate-0 md:p-8">
            <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-border-strong pb-4">
              <p className="font-display text-heading-sm font-bold">Példa: {qty} m³ {m.name}</p>
              <p className="text-sm text-text-muted">Budafokra</p>
            </div>
            <dl className="num mt-4 space-y-3 text-[0.9375rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">
                  {qty} × {formatFt(m.priceNet)}
                </dt>
                <dd className="font-semibold">{formatFt(material)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Fuvar — {z.name}</dt>
                <dd className="text-right font-semibold whitespace-nowrap">
                  {formatFt(z.fuelMin)} – {formatFt(z.fuelMax)}
                </dd>
              </div>
              <div className="border-t-2 border-text pt-3">
                <dt className="text-sm font-semibold">Összesen, nettó</dt>
                <dd className="mt-1 num font-display text-[1.5rem] leading-tight font-bold tracking-tight whitespace-nowrap text-accent-deep sm:text-[1.875rem] md:text-[2.25rem]">
                  {formatFt(material + z.fuelMin)} – {formatFt(material + z.fuelMax)}
                </dd>
              </div>
            </dl>
            <figcaption className="mt-4 text-xs leading-relaxed text-text-muted">
              Tájékoztató ár, ÁFA nélkül. A végleges ajánlatot egyeztetés után adjuk.
            </figcaption>
          </div>
        </figure>
      </div>
    </section>
  );
}
