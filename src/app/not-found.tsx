import Link from "next/link";
import { company } from "@/content/site";
import { PhoneLink } from "@/lib/ui";

export default function NotFound() {
  return (
    <div data-call-region="not_found" className="mx-auto max-w-6xl px-4 py-24 text-center">
      <p aria-hidden="true" className="font-display text-6xl font-bold text-brand-dark">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold">
        Ez az oldal nem található
      </h1>
      <p className="mx-auto mt-3 max-w-md text-ink-soft">
        Lehet, hogy áthelyeztük. Hívjon bátran, vagy indítsa el a
        kalkulátort — az anyag, mennyiség és helyszín alapján számolunk.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <PhoneLink className="inline-flex items-center justify-center rounded-sm bg-brand-dark px-6 py-3.5 font-semibold text-paper shadow-card transition-colors hover:bg-brand-deep" />
        <Link
          href="/arkalkulator"
          className="inline-flex items-center justify-center rounded-sm border border-line bg-paper px-6 py-3.5 font-semibold shadow-card transition-colors hover:bg-sand"
        >
          Árkalkulátor
        </Link>
      </div>
      <p className="mt-6 text-xs text-ink-soft">{company.hours.short}</p>
      <nav aria-label="Hasznos oldalak" className="mx-auto mt-10 max-w-md border-t border-line pt-6">
        <p className="text-sm font-medium text-ink-soft">Hasznos oldalak</p>
        <ul className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
          <li><Link href="/arak" className="rounded-full border border-line bg-sand px-3 py-1.5 hover:border-brand">Árlista</Link></li>
          <li><Link href="/utmutatok/mennyibe-kerul-a-soder" className="rounded-full border border-line bg-sand px-3 py-1.5 hover:border-brand">Mennyibe kerül a sóder?</Link></li>
          <li><Link href="/teruletek" className="rounded-full border border-line bg-sand px-3 py-1.5 hover:border-brand">Szállítási területek</Link></li>
        </ul>
      </nav>
    </div>
  );
}
