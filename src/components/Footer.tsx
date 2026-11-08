import Link from "next/link";
import { company, guides, nav } from "@/content/site";
import { MailLink, PhoneLink } from "@/lib/ui";
import HeroGround from "@/components/HeroGround";

const FOOTER_GUIDES = 6;

export default function Footer() {
  return (
    <footer data-call-region="footer" className="on-dark bg-surface-dark text-on-dark">
      {/* Rétegrend: ugyanaz a térkő alatti rétegmetszet, mint a hero alján
          (ügyfél, 2026-11-07) — a talaj a sötét láblécbe fakul */}
      <HeroGround fadeTo="dark" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 pb-8 sm:grid-cols-2 md:gap-10 md:pt-14 md:pb-10 md:px-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Link href="/" aria-label="Sóderárak — főoldal" className="inline-block rounded-sm">
            <span className="font-display text-2xl font-bold">Sóder árak</span>
          </Link>
          <p className="mt-4 text-sm text-on-dark-muted">{company.businessUnit}</p>
          <p className="mt-4 text-sm leading-relaxed text-on-dark-muted">
            {company.hours.sentence}
          </p>
        </div>

        <nav aria-label="Lábléc navigáció" className="lg:col-span-2">
          <h2 className="text-sm font-medium text-on-dark-muted">Oldalak</h2>
          <ul className="mt-2 grid grid-cols-2 gap-x-6 text-sm sm:grid-cols-1 sm:gap-y-1 lg:mt-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex min-h-11 items-center hover:text-amber sm:min-h-8">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h2 className="text-sm font-medium text-on-dark-muted">Kapcsolat</h2>
          <PhoneLink className="num mt-3 block font-display text-xl font-bold hover:text-amber" />
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <MailLink className="inline-flex min-h-8 items-center hover:text-amber" />
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="text-sm font-medium text-on-dark-muted">Útmutatók</h2>
          <ul className="mt-2 text-sm">
            {guides.slice(0, FOOTER_GUIDES).map((g) => (
              <li key={g.slug}>
                <Link href={`/utmutatok/${g.slug}`} className="block py-1 leading-snug hover:text-amber">
                  {g.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/utmutatok" className="inline-flex min-h-8 items-center font-semibold hover:text-amber">
                Összes útmutató ({guides.length})
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-paper/15 pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs leading-relaxed text-on-dark-muted md:flex-row md:items-center md:justify-between md:px-6">
          <p>
            © {new Date().getFullYear()} {company.site.name}. Minden jog fenntartva.
          </p>
          <p className="md:max-w-[60ch] md:text-right">
            Az anyagárak tájékoztató jellegűek, bruttó árak (az ÁFÁ-t tartalmazzák); a fuvar díja
            külön. A végleges ajánlatot egyeztetés után adjuk.
          </p>
          <p className="flex gap-4">
            <Link href="/adatvedelem" className="inline-flex min-h-6 items-center underline underline-offset-2 hover:text-paper">Adatvédelem</Link>
            <Link href="/impresszum" className="inline-flex min-h-6 items-center underline underline-offset-2 hover:text-paper">Impresszum</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
