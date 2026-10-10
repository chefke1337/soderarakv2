import Link from "next/link";
import { company, nav } from "@/content/site";
import { IconPhone } from "@/lib/ui";
import NavLinks from "@/components/NavLinks";
import { withBasePath } from "@/lib/basepath";

/**
 * V2 fejléc — egyetlen sáv (a korábbi fekete topbar + fejléc + gradiens vonal
 * helyett). A „SÓDER / ÁRAK" lockup változatlan színnel, szoros egységként.
 */
export default function Header() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[100] rounded-sm bg-paper px-4 py-3 font-semibold text-ink shadow-pop focus:not-sr-only"
      >
        Ugrás a tartalomra
      </a>
      <header className="header-bar sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 md:h-[4.75rem] md:px-6">
          <Link
            href="/"
            className="-m-1 flex shrink-0 items-center rounded-sm p-1"
            aria-label="Sóderárak — főoldal"
          >
            <span className="header-lockup font-display text-2xl leading-[0.92] font-bold tracking-tight uppercase sm:text-[1.75rem]">
              <span className="block text-basalt">Sóder</span>
              <span className="block text-brand-dark">Árak</span>
            </span>
          </Link>

          <nav
            className="hidden lg:block"
            aria-label="Fő navigáció"
          >
            <NavLinks />
          </nav>

          <div data-call-region="header_nav" className="hidden items-center gap-4 lg:flex">
            <p className="hidden text-right text-xs leading-tight whitespace-nowrap text-ink-soft 2xl:block">
              Hívható
              <br />
              <span className="num font-medium text-ink">{company.hours.short.replace("H–P ", "H–P ")}</span>
            </p>
            <a
              href={`tel:${company.phone.raw}`}
              className="num inline-flex min-h-11 items-center gap-2 rounded-sm bg-brand-dark px-4 font-semibold whitespace-nowrap text-paper transition-colors hover:bg-brand-deep"
            >
              <IconPhone size={17} />
              {company.phone.display}
            </a>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <a
              data-call-region="header_topbar"
              href={`tel:${company.phone.raw}`}
              className="num hidden min-h-11 items-center gap-1.5 rounded-sm px-2 text-sm font-semibold text-brand-deep min-[400px]:inline-flex sm:text-base"
            >
              <IconPhone size={16} />
              {company.phone.display}
            </a>
            <details className="group relative">
              <summary
                aria-controls="mobil-menu"
                className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-sm border border-line-strong bg-paper px-3.5 text-sm font-semibold transition-colors hover:bg-sand group-open:bg-sand"
              >
                Menü
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" className="transition-transform group-open:rotate-180">
                  <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <nav
                id="mobil-menu"
                data-call-region="header_mobile_menu"
                aria-label="Mobil navigáció"
                className="details-body absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-md border border-line bg-paper shadow-pop"
              >
                <ul className="px-4 py-1">
                  {nav.map((item) => (
                    <li key={item.href}>
                      <a
                        href={withBasePath(`${item.href}/`)}
                        className="flex min-h-12 items-center justify-between border-b border-line/70 py-3 text-base font-medium"
                      >
                        {item.label}
                        <span aria-hidden="true" className="text-ink-faint">›</span>
                      </a>
                    </li>
                  ))}
                  <li className="py-3">
                    <a
                      href={`tel:${company.phone.raw}`}
                      className="num flex min-h-12 items-center justify-center gap-2 rounded-sm bg-brand-dark px-4 py-3 text-center font-semibold text-paper"
                    >
                      <IconPhone size={18} /> {company.phone.display}
                    </a>
                    <p className="mt-2 text-center text-xs text-ink-soft">{company.hours.days}, {company.hours.time}</p>
                  </li>
                </ul>
              </nav>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
