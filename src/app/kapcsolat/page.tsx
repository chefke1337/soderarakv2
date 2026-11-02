import type { Metadata } from "next";
import Link from "next/link";
import {
  budapestDistricts,
  company,
  ORDER_INTENT_NOTICE,
  PERMIT_NOTICE,
  quoteOnlyAreas,
  serviceAreas,
} from "@/content/site";
import { IconArrowRight, IconPhone, MailLink, PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";
import LefedettsegTerkepLazy from "@/components/LefedettsegTerkepLazy";

export const metadata: Metadata = pageMeta({
  title: "Kapcsolat — hívás, rendelési igény",
  description: `Hívja a ${company.phone.display}-os számot hétköznap 07:00–17:00 között, vagy küldjön rendelési igényt az árkalkulátorból. Ömlesztett anyag kiszállítás Budapest mind a ${budapestDistricts.length} kerületébe és Érdre.`,
  path: "/kapcsolat",
});

export default function KapcsolatPage() {
  return (
    <Section
      kicker="Kapcsolat"
      title="Hívjon, vagy küldjön rendelési igényt"
      lead="A rendelés telefonon a leggyorsabb — hétköznap 07:00 és 17:00 között érjük el. Az árkalkulátorból rendelési igényt is küldhet e-mailben."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Kapcsolat", path: "/kapcsolat" },
        ])}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 lg:col-span-5">
          <div
            data-call-region="kapcsolat"
            className="on-dark rounded-[var(--radius-lg)] bg-surface-dark p-6 text-on-dark shadow-pop md:p-7"
          >
            <p className="label-strata text-amber">Telefonon</p>
            <PhoneLink className="num mt-3 flex items-center justify-between gap-4 font-display text-[1.75rem] leading-tight font-bold tracking-tight transition-colors hover:text-amber sm:text-[2.125rem]">
              {company.phone.display}
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-on-dark"
              >
                <IconPhone size={20} />
              </span>
            </PhoneLink>
            <p className="mt-3 text-sm leading-relaxed text-on-dark-muted">
              {company.hours.days}, {company.hours.time}. Mondja el, milyen anyagra,
              mennyire és melyik irányítószámra van szüksége.
            </p>
          </div>

          <dl className="mt-6 border-t border-border-strong">
            <div className="border-b border-line py-4">
              <dt className="text-sm text-ink-soft">E-mail</dt>
              <dd className="mt-1 font-semibold break-all">
                <MailLink className="link" />
              </dd>
            </div>
            <div className="border-b border-line py-4">
              <dt className="text-sm text-ink-soft">Rendelési igény</dt>
              <dd className="mt-1 text-sm leading-relaxed">
                <span className="block">{ORDER_INTENT_NOTICE}</span>
                <Link href="/arkalkulator" className="btn btn-primary mt-3 w-fit">
                  Árkalkulátor és beküldés
                  <IconArrowRight size={17} className="btn-icon btn-icon-move" />
                </Link>
              </dd>
            </div>
            <div className="border-b border-line py-4">
              <dt className="text-sm text-ink-soft">Üzemeltető</dt>
              <dd className="mt-1 text-sm leading-relaxed">
                {company.name} — {company.businessUnit}.{" "}
                <Link href="/impresszum" className="link">
                  Impresszum
                </Link>
              </dd>
            </div>
            <div className="border-b border-line py-4">
              <dt className="text-sm text-ink-soft">Behajtási engedély</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{PERMIT_NOTICE}</dd>
            </div>
          </dl>
        </div>

        <div className="min-w-0 lg:col-span-7">
          <h2 className="font-display text-heading-md font-bold">Lefedettség</h2>
          <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
            Budapest mind a {budapestDistricts.length} kerületébe és Érdre szállítunk. A
            térkép áttekintés — a pontos szállítási díjért használja az árkalkulátort, vagy
            kérjen telefonos egyeztetést.
          </p>
          <Link href="/arkalkulator" className="btn btn-outline mt-3">
            Szállítási díj kiszámítása
            <IconArrowRight size={17} className="btn-icon btn-icon-move" />
          </Link>
          <div className="mt-4 rounded-[var(--radius-lg)] bg-surface p-3 shadow-pop">
            <LefedettsegTerkepLazy height={420} />
          </div>

          <h2 className="mt-10 font-display text-heading-sm font-bold">
            Kiszolgált területek saját oldallal
          </h2>
          {/* Csipkés lista vesszős prózafolyam helyett: mobilon minden
              terület önálló, tömör érintési célpont (a sorok közé tört
              inline link középpontja nem esne a linkre). */}
          <ul className="mt-3 flex flex-wrap gap-2">
            {serviceAreas.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/teruletek/${s.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-surface px-3.5 text-sm font-medium transition-colors hover:border-ink hover:bg-sand"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {quoteOnlyAreas.map((a) => a.name).join(", ")} esetén egyedi szállítási
            egyeztetés szükséges.
          </p>
        </div>
      </div>
    </Section>
  );
}
