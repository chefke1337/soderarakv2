import Link from "next/link";
import { company } from "@/content/site";
import { IconPhone } from "@/lib/ui";
import NavLinks from "@/components/NavLinks";
import MobileMenu from "@/components/MobileMenu";
import LogoMark from "@/components/LogoMark";

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
      <header className="header-bar hdr sticky top-0 z-50 border-b border-border bg-page/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 md:h-[4.75rem] md:px-6">
          <Link
            href="/"
            className="-m-1 flex shrink-0 items-center rounded-sm p-1"
            aria-label="Sóderárak — főoldal"
          >
            <span className="header-lockup flex items-center gap-2.5 sm:gap-3">
              <LogoMark size={44} className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
              <span className="flex flex-col items-stretch lg:hidden xl:flex">
                <span className="font-display text-[1.375rem] leading-none font-bold tracking-[0.01em] hdr-word whitespace-nowrap uppercase sm:text-[1.625rem]">
                  Sóder Árak
                </span>
                <span className="lockup-domain mt-1 flex items-center gap-1.5 text-[0.5625rem] leading-none font-semibold tracking-[0.28em] text-ink-soft uppercase sm:text-[0.625rem]">
                  <span aria-hidden="true" className="h-px flex-1 bg-brand" />
                  soderarak.hu
                  <span aria-hidden="true" className="h-px flex-1 bg-brand" />
                </span>
              </span>
            </span>
          </Link>

          <nav
            className="hidden lg:block"
            aria-label="Fő navigáció"
          >
            <NavLinks />
          </nav>

          <div data-call-region="header_nav" className="hidden items-center gap-4 lg:flex">
            <a
              href={`tel:${company.phone.raw}`}
              className="num btn btn-primary min-h-11 whitespace-nowrap"
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
