import type { Metadata } from "next";
import Link from "next/link";
import {
  budapestDistricts,
  company,
  freightProfiles,
  quoteOnlyAreas,
  romanDistrict,
  serviceAreas,
  tariffedAreas,
  UNSUPPORTED_NOTICE,
} from "@/content/site";
import { IconArrowRight, PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";
import LefedettsegTerkepLazy from "@/components/LefedettsegTerkepLazy";

export const metadata: Metadata = pageMeta({
  title: "Területek — hol szállítunk sódert és ömlesztett anyagot",
  description: `Szolgáltatási terület: Budapest mind a ${budapestDistricts.length} kerülete és Érd, irányítószám-alapú fuvardíjjal. További településekhez (${quoteOnlyAreas.map((a) => a.name).join(", ")}) egyedi szállítási egyeztetés szükséges.`,
  path: "/teruletek",
});

export default function TeruletekPage() {
  return (
    <Section
      kicker="Szolgáltatási terület"
      title="Budapest és Érd — irányítószám szerint"
      lead="A fuvardíj alapja mindig a megadott irányítószám. A lenti oldalak a kiszolgált területeket mutatják; a konkrét díjakat a szállítási oldal kereshető díjlistája tartalmazza."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Területek", path: "/teruletek" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Kiszállítási területek",
          url: `${company.site.url}/teruletek/`,
          itemListElement: serviceAreas.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.name,
            url: `${company.site.url}/teruletek/${s.slug}/`,
          })),
        }}
      />

      <div className="space-y-12">
        {/* ── Budapest kerületei ── */}
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-display text-heading-md font-bold">
              Budapest — mind a {budapestDistricts.length} kerület
            </h2>
            <p className="num text-sm font-semibold text-brand-deep">
              {freightProfiles.filter((p) => p.municipalityId === "budapest").length} díjprofil
            </p>
          </div>
          <p className="mt-2 max-w-[66ch] text-sm leading-relaxed text-ink-soft">
            Minden kerületbe szállítunk. A XI. kerületben az 1112 és 1118 irányítószám
            eltérő díjprofilba tartozik. A XXI. kerület (Csepel) a V3 árlistával ismét
            támogatott.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {budapestDistricts.map((d) => (
              <li
                key={d.id}
                className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3"
              >
                <p className="font-display text-heading-xs font-bold">
                  {romanDistrict(d.id)} kerület
                </p>
                <p className="num mt-0.5 text-xs leading-relaxed text-ink-soft">
                  {d.postalCodes.join(", ")}
                </p>
              </li>
            ))}
          </ul>
          <Link href="/szallitas#fuvardijak" className="btn btn-primary mt-5">
            Fuvardíjak irányítószám szerint
            <IconArrowRight size={17} className="btn-icon btn-icon-move" />
          </Link>
        </div>

        {/* ── Kiemelt területek saját oldallal ── */}
        <div>
          <h2 className="font-display text-heading-md font-bold">
            Kiemelt területek, saját oldallal
          </h2>
          <p className="mt-2 max-w-[66ch] text-sm leading-relaxed text-ink-soft">
            Ezekhez a területekhez van jóváhagyott, irányítószám-alapú fuvardíjunk.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tariffedAreas.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/teruletek/${s.slug}`}
                  className="block rounded-[var(--radius-md)] border border-border bg-surface p-4 shadow-card transition-shadow hover:shadow-pop"
                >
                  <span className="font-semibold">{s.name}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                    Sóder, homok, kavics, murva, andezit, föld szállítás
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Egyedi egyeztetés ── */}
        <div>
          <h2 className="font-display text-heading-md font-bold">Egyedi egyeztetés</h2>
          <p className="mt-2 max-w-[66ch] text-sm leading-relaxed text-ink-soft">
            {UNSUPPORTED_NOTICE} Az alábbi településekhez a V3 árlistában nincs
            feltüntetett fuvardíj — a korábbi zónás díjakat automatikusan nem
            alkalmazzuk.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {quoteOnlyAreas.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/teruletek/${s.slug}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium hover:border-ink"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
          <PhoneLink className="num btn btn-outline mt-5" />
        </div>

        {/* ── Térkép ── */}
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-card sm:p-6">
          <h2 className="font-display text-heading-md font-bold">Lefedettség a térképen</h2>
          <p className="mt-1 mb-4 max-w-[66ch] text-sm leading-relaxed text-ink-soft">
            Áttekintő jelölések a kiszolgált területekről. A térkép nem rajzol
            irányítószám-határokat — az árazás alapja a kereshető irányítószámos
            díjlista.
          </p>
          <LefedettsegTerkepLazy />
        </div>
      </div>
    </Section>
  );
}
