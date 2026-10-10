import Link from "next/link";
import { company, guides, nav } from "@/content/site";
import { MailLink, PhoneLink } from "@/lib/ui";

const FOOTER_GUIDES = 6;

export default function Footer() {
  return (
    <footer data-call-region="footer" className="bg-basalt text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-14 pb-10 sm:grid-cols-2 md:px-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Link href="/" aria-label="Sóderárak — főoldal" className="inline-block rounded-sm">
            {/* Az eredeti footer szöveges márkajelzése változatlan (a logó színe nem módosul) */}
            <span className="font-display text-xl font-bold">Sóderárak</span>
          </Link>
          <p className="mt-4 text-sm text-paper/70">{company.businessUnit}</p>
          <address className="mt-4 text-sm leading-relaxed text-paper/80 not-italic">
            {company.name}
            <br />
            {company.address.full}
            <br />
            {company.hours.days}, {company.hours.time}
          </address>
        </div>

        <nav aria-label="Lábléc navigáció" className="lg:col-span-2">
          <h2 className="text-sm font-medium text-paper/60">Oldalak</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex min-h-8 items-center hover:text-[#f0a274]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h2 className="text-sm font-medium text-paper/60">Kapcsolat</h2>
          <PhoneLink className="num mt-3 block font-display text-xl font-bold hover:text-[#f0a274]" />
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <MailLink className="inline-flex min-h-8 items-center hover:text-[#f0a274]" />
            </li>
            <li>
              <a href={company.waste.url} className="inline-flex min-h-8 items-center hover:text-[#f0a274]">
                Hulladék, konténer: {company.waste.domain}
              </a>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="text-sm font-medium text-paper/60">Útmutatók</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {guides.slice(0, FOOTER_GUIDES).map((g) => (
              <li key={g.slug}>
                <Link href={`/utmutatok/${g.slug}`} className="inline-flex min-h-8 items-center leading-snug hover:text-[#f0a274]">
                  {g.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/utmutatok" className="inline-flex min-h-8 items-center font-semibold hover:text-[#f0a274]">
                Összes útmutató ({guides.length})
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-paper/15 pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs leading-relaxed text-paper/65 md:flex-row md:items-center md:justify-between md:px-6">
          <p>
            © {new Date().getFullYear()} {company.name}. Minden jog fenntartva.
          </p>
          <p className="md:max-w-[60ch] md:text-right">
            Az árak tájékoztató jellegűek, nettó árak (ÁFA nélkül); a fuvar díja
            külön. A végleges ajánlatot egyeztetés után adjuk.
          </p>
          <p className="flex gap-4">
            <Link href="/adatvedelem" className="underline underline-offset-2 hover:text-paper">Adatvédelem</Link>
            <Link href="/impresszum" className="underline underline-offset-2 hover:text-paper">Impresszum</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
