import Link from "next/link";
import { company } from "@/content/site";
import { IconPhone } from "@/lib/ui";
import NavLinks from "@/components/NavLinks";
import { withBasePath } from "@/lib/basepath";
import MobileMenu from "@/components/MobileMenu";

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
      <header className="header-bar sticky top-0 z-50 border-b border-border bg-page/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 md:h-[4.75rem] md:px-6">
          <Link
            href="/"
            className="group -m-1 flex shrink-0 items-center gap-2 rounded-sm p-1"
            aria-label="Sóderárak — főoldal"
          >
            {/* A logóikon és a felirat egy szoros egység (ügyfélkérés) */}
            <img
              src={withBasePath("/buda-kontener-logo-sotet-3-crop.png")}
              alt=""
              width={177}
              height={157}
              className="h-10 w-auto transition-transform duration-300 group-hover:-translate-x-0.5 md:h-12"
            />
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
              <span className="num font-medium text-ink">{company.hours.short}</span>
            </p>
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
