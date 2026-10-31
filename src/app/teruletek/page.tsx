import type { Metadata } from "next";
import Link from "next/link";
import {
  budapestDistricts,
  company,
  freightProfiles,
  quoteOnlyAreas,
  serviceAreas,
  tariffedAreas,
} from "@/content/site";
import { IconArrowRight } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";
import LefedettsegTerkepLazy from "@/components/LefedettsegTerkepLazy";
import AreaFinder from "@/components/AreaFinder";

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
        {/* ── Kereshető területlista (kerület, terület, irányítószám) ── */}
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-display text-heading-md font-bold">
              Budapest — mind a {budapestDistricts.length} kerület, és Érd
            </h2>
            <p className="num text-sm font-semibold text-brand-deep">
              {freightProfiles.length} díjprofil
            </p>
          </div>
          <p className="mt-2 mb-5 max-w-[66ch] text-sm leading-relaxed text-ink-soft">
            Minden kerületbe szállítunk. Kereshet kerületre, városrészre (pl. Kelenföld,
            Rákoshegy) vagy irányítószámra. A XI. kerületben az 1112 és 1118 irányítószám
            eltérő díjprofilba tartozik — ezért a díjhoz mindig a pontos irányítószám kell.
          </p>
          <AreaFinder />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/arkalkulator" className="btn btn-primary">
              Árkalkulátor indítása
              <IconArrowRight size={17} className="btn-icon btn-icon-move" />
            </Link>
            <Link href="/szallitas#fuvardijak" className="btn btn-outline">
              Teljes díjlista irányítószám szerint
            </Link>
          </div>
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
