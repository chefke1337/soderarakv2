import Link from "next/link";
import { company, guides, nav } from "@/content/site";
import { MailLink, PhoneLink } from "@/lib/ui";
import { withBasePath } from "@/lib/basepath";

const FOOTER_GUIDES = 6;

export default function Footer() {
  return (
    <footer data-call-region="footer" className="on-dark bg-surface-dark text-on-dark">
      {/* Rétegcsík: a hero anyag-rétegrendjének visszhangja, a lezárás jele */}
      <div aria-hidden="true" className="flex h-2">
        <span className="flex-[3] bg-mat-homok" />
        <span className="flex-[4] bg-mat-soder" />
        <span className="flex-[2] bg-mat-kavics" />
        <span className="flex-[3] bg-accent" />
        <span className="flex-[2] bg-mat-murva" />
        <span className="flex-[1] bg-mat-bazalt" />
        <span className="flex-[3] bg-mat-fold" />
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-14 pb-10 sm:grid-cols-2 md:px-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Link href="/" aria-label="Sóderárak — főoldal" className="inline-block rounded-sm">
            {/* Logóikon + szöveges márkajelzés; a logó színe nem módosul */}
            <span className="flex items-center gap-3">
              <span className="flex h-12 w-14 items-center justify-center rounded-[var(--radius-md)] bg-on-dark p-1.5">
                <img src={withBasePath("/buda-kontener-logo-sotet-3-crop.png")} alt="" width={177} height={157} className="h-full w-auto" />
              </span>
              <span className="font-display text-2xl font-bold">Sóderárak</span>
            </span>
          </Link>
          <p className="mt-4 text-sm text-on-dark-muted">{company.businessUnit}</p>
          <address className="mt-4 text-sm leading-relaxed text-on-dark-muted not-italic">
            {company.name}
            <br />
            {company.address.full}
            <br />
            {company.hours.days}, {company.hours.time}
          </address>
        </div>

        <nav aria-label="Lábléc navigáció" className="lg:col-span-2">
          <h2 className="text-sm font-medium text-on-dark-muted">Oldalak</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex min-h-8 items-center hover:text-amber">
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
            <li>
              <a href={company.waste.url} className="inline-flex min-h-8 items-center hover:text-amber">
                Hulladék, konténer: {company.waste.domain}
              </a>
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
