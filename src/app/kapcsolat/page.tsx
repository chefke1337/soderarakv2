import type { Metadata } from "next";
import Link from "next/link";
import { company, settlements } from "@/content/site";
import { IconPhone, MailLink, PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

export const metadata: Metadata = pageMeta({
  title: "Kapcsolat — hívás, ajánlatkérés, telephely Budafokon",
  description:
    "Hívja a +36 30 954 6156-os számot hétköznap 07:00–17:00 között, vagy írjon az info@soderarak.hu címre. Telephely: 1221 Budapest, Arany János út 152. (Budafok).",
  path: "/kapcsolat",
});

import ZonaTerkepLazy from "@/components/ZonaTerkepLazy";

export default function KapcsolatPage() {
  return (
    <Section
      kicker="Kapcsolat"
      title="Hívjon, vagy kérjen ajánlatot"
      lead="A rendelés telefonon a leggyorsabb — hétköznap 07:00 és 17:00 között érjük el. E-mailben is küldheti az anyagot, mennyiséget és a helyszínt."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Kapcsolat", path: "/kapcsolat" },
        ])}
      />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 space-y-8 lg:col-span-5">
          <div data-call-region="contact_page" className="on-accent relative overflow-hidden rounded-[var(--radius-lg)] bg-surface-accent p-6 text-on-dark shadow-pop md:p-7">
            <div aria-hidden="true" className="grain absolute inset-0 opacity-30 mix-blend-multiply" />
            <h2 className="relative text-sm font-semibold text-on-accent-muted">Telefonos rendelés — a leggyorsabb</h2>
            <PhoneLink className="num group relative mt-2 flex items-center justify-between gap-4 font-display text-[2rem] leading-tight font-bold tracking-tight md:text-[2.375rem]">
              {company.phone.display}
              <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-on-dark text-accent-deep transition-transform duration-[var(--dur-ui)] group-hover:-rotate-12 group-hover:scale-105">
                <IconPhone size={22} />
              </span>
            </PhoneLink>
            <p className="relative mt-1 text-on-accent-muted">{company.hours.days}, {company.hours.time}</p>
          </div>

          <dl className="divide-y divide-line border-y border-line">
            <div className="grid grid-cols-[7rem_1fr] gap-4 py-4">
              <dt className="text-sm text-ink-soft">E-mail</dt>
              <dd>
                <MailLink className="font-semibold break-all text-brand-deep underline decoration-brand-dark/40 underline-offset-4 hover:decoration-brand-dark" />
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  Kérjük, írja meg: milyen anyag, hány m³, melyik település —
                  válaszunkban egyeztetünk.
                </p>
              </dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-4 py-4">
              <dt className="text-sm text-ink-soft">Telephely</dt>
              <dd>
                <address className="not-italic font-semibold">{company.address.full}</address>
                <p className="mt-1 text-sm text-ink-soft">
                  {company.address.district} — depó: itt is átveheti az anyagot.
                </p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(company.address.full)}`}
                  className="link mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm"
                  rel="noopener"
                  target="_blank"
                >
                  Útvonaltervezés a telephelyhez
                  <span className="sr-only">(új lapon, Google Térkép)</span>
                </a>
              </dd>
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-4 py-4">
              <dt className="text-sm text-ink-soft">Cég</dt>
              <dd className="text-sm">{company.name}</dd>
            </div>
          </dl>

          <Link
            href="/arkalkulator"
            className="btn btn-outline w-full"
          >
            Ajánlatkérés az árkalkulátorban
          </Link>

          <p className="flex gap-3 text-sm leading-relaxed text-ink-soft">
            <span aria-hidden="true" className="mt-1 h-8 w-1 shrink-0 rounded-full bg-petrol" />
            <span>
              Építési törmelék, sitt, zöldhulladék: ez <strong className="font-semibold text-ink">külön üzletág</strong>, a{" "}
              <a href={company.waste.url} className="font-medium text-petrol-deep underline underline-offset-2">
                {company.waste.domain}
              </a>{" "}
              oldalon rendelhető.
            </span>
          </p>
        </div>

        <div className="min-w-0 lg:col-span-7">
          <h2 className="font-display text-heading-md font-bold">Telephely és szállítási zónák</h2>
          <div className="mt-4 rounded-[var(--radius-lg)] bg-surface p-3 shadow-pop">
            <ZonaTerkepLazy height={420} />
          </div>

          <h2 className="mt-10 font-display text-heading-sm font-bold">Hol szállítunk?</h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed">
            {settlements.map((s, i) => (
              <span key={s.slug}>
                <Link href={`/teruletek/${s.slug}`} className="underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  {s.name}
                </Link>
                {i < settlements.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        </div>
      </div>
    </Section>
  );
}
