import Link from "next/link";
import { company } from "@/content/site";
import { IconPhone } from "@/lib/ui";
import NavLinks from "@/components/NavLinks";
import MobileMenu from "@/components/MobileMenu";

/**
 * Fejléc — „Anyag és szerkezet": tömör mészkő-törtfehér sáv, határozott alsó
 * vonallal (nincs áttetszőség, blur, lebegő kártya). Három zóna: logó |
 * navigáció | kapcsolat; a kapcsolat-zónát vékony függőleges vonal választja
 * le. A „SÓDER / ÁRAK" lockup változatlan.
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
      <header className="header-bar sticky top-0 z-50 border-b border-ink/20 bg-limestone">
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

          <div
            data-call-region="header_nav"
            className="hidden items-center gap-4 self-stretch border-l border-ink/15 pl-5 lg:flex xl:pl-6"
          >
            <p className="hidden text-xs leading-tight whitespace-nowrap text-ink-soft xl:block">
              Hívható
              <br />
              <span className="num font-semibold text-ink">{company.hours.short}</span>
            </p>
            <a
              href={`tel:${company.phone.raw}`}
              className="num btn btn-ink min-h-11 whitespace-nowrap"
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
            <MobileMenu />
          </div>
        </div>
      </header>
    </>
  );
}
