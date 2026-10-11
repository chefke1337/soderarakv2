import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  company,
  findZone,
  materialGroups,
  settlements,
} from "@/content/site";
import { PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, faqJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

export function generateStaticParams() {
  return settlements.map((s) => ({ telepules: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ telepules: string }>;
}): Promise<Metadata> {
  const { telepules } = await params;
  const s = settlements.find((x) => x.slug === telepules);
  if (!s) return {};
  const zone = findZone(s.zone);
  return pageMeta({
    title: `Sóder szállítás ${s.name} — árak, kiszállás`,
    description: `Sóder, homok, kavics, murva és föld szállítás ${s.name} területére (${zone.name}). Fuvar ${(zone.fuelMin / 1000).toLocaleString("hu-HU")}–${(zone.fuelMax / 1000).toLocaleString("hu-HU")} ezer Ft nettó, tájékoztató ár. Hívás: ${company.phone.display}.`,
    path: `/teruletek/${s.slug}`,
  });
}

export default async function SettlementPage({
  params,
}: {
  params: Promise<{ telepules: string }>;
}) {
  const { telepules } = await params;
  const s = settlements.find((x) => x.slug === telepules);
  if (!s) notFound();
  const zone = findZone(s.zone);
  const others = settlements.filter((x) => x.zone === s.zone && x.slug !== s.slug);

  const settlementFaq = [
    {
      q: `Mennyibe kerül a sóder szállítás ${s.name} területére?`,
      a: `A fuvar ${s.name} területére (${zone.name}) tájékoztató jelleggel ${(zone.fuelMin / 1000).toLocaleString("hu-HU")}–${(zone.fuelMax / 1000).toLocaleString("hu-HU")} ezer forint nettó. Az anyag ára külön, frakciónként eltér — a végleges árat egyeztetés után adjuk.`,
    },
    {
      q: `Mennyire gyors a kiszállás ${s.name}?`,
      a: `${zone.name === "Budafok és környéke" ? "Budafok környékén a kiszállás gyakran aznap megtörténik." : `${zone.name} egyeztetett időpontban szállítunk, gyakran 1-2 munkanapon belül.`} Hívás: ${company.phone.display}.`,
    },
    {
      q: `Milyen anyagokat szállítanak ${s.name} területére?`,
      a: "Sódert (0/4–0/24 és töltősóder), homokot, kavicsot, kulékavicsot, murvát, bazaltot és földet. Minimum rendelés 1 m³, egy fuvarban legfeljebb 20 m³.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Ömlesztett anyag szállítás — ${s.name}`,
    url: `${company.site.url}/teruletek/${s.slug}/`,
    areaServed: { "@type": "Place", name: s.name },
    provider: { "@id": `${company.site.url}/#business` },
  };

  return (
    <Section
      kicker={`${zone.name} · ${zone.area}`}
      title={`Sóder szállítás ${s.name}`}
      lead={`${zone.name} — fuvar ${(zone.fuelMin / 1000).toLocaleString("hu-HU")}–${(zone.fuelMax / 1000).toLocaleString("hu-HU")} ezer Ft nettó, ${zone.leadTime}. Az anyagárak nettó árak, ÁFA nélkül; a fuvar díja külön.`}
    >
      <JsonLd data={jsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Területek", path: "/teruletek" },
          { name: s.name, path: `/teruletek/${s.slug}` },
        ])}
      />
      <JsonLd data={faqJsonLd(settlementFaq)} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <div className="rounded-md border border-line bg-paper p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">
              Amit {s.name} területére szállítunk
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {materialGroups.map((g) => (
                <li key={g.slug} className="rounded-sm border border-line bg-sand/60 px-4 py-3 text-sm">
                  <Link href={`/anyagok/${g.slug}`} className="inline-flex min-h-11 items-center font-semibold hover:text-brand-dark">
                    {g.name} →
                  </Link>
                  <span className="mt-0.5 block text-xs text-ink-soft">{g.short}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink-soft">
              Minimum rendelés 1 m³, egy fuvarban legfeljebb 20 m³. Tájékoztató
              ár — a végleges ajánlatot egyeztetés után adjuk.
            </p>
          </div>

          <div className="rounded-md border border-line bg-paper p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">
              További települések a zónában
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={`/teruletek/${o.slug}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-line bg-sand px-3 py-1.5 text-sm hover:border-brand"
                  >
                    {o.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/teruletek" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-deep underline underline-offset-2">
              Minden zóna és település →
            </Link>
          </div>

          <div className="rounded-md border border-line bg-paper p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">Hasznos útmutatók</h2>
            <ul className="mt-2 text-sm">
              <li>
                <Link href="/utmutatok/mennyi-soder-kell" className="inline-flex min-h-11 items-center font-medium hover:text-brand-dark">
                  Mennyi sóder kell? →
                </Link>
              </li>
              <li>
                <Link href="/utmutatok/milyen-soder-kell-a-terko-ala" className="inline-flex min-h-11 items-center font-medium hover:text-brand-dark">
                  Milyen sóder kell a térkő alá? →
                </Link>
              </li>
              <li>
                <Link href="/utmutatok/mennyi-ido-a-soder-szallitas" className="inline-flex min-h-11 items-center font-medium hover:text-brand-dark">
                  Mennyi idő a sóder szállítás? →
                </Link>
              </li>
              <li>
                <Link href="/utmutatok/mennyibe-kerul-a-soder" className="inline-flex min-h-11 items-center font-medium hover:text-brand-dark">
                  Mennyibe kerül a sóder? →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <aside className="min-w-0 h-fit space-y-5 lg:sticky lg:top-28">
          <div data-call-region="telepules_oldal" className="rounded-md border border-line bg-sand p-6 shadow-card">
            <p className="text-sm font-medium text-ink-soft">
              Ár {s.name} területére
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-brand-dark">
              {(zone.fuelMin / 1000).toLocaleString("hu-HU")}–
              {(zone.fuelMax / 1000).toLocaleString("hu-HU")} ezer Ft
            </p>
            <p className="text-xs text-ink-soft">fuvar, egy fuvarra, nettó</p>
            <Link
              href="/arkalkulator"
              className="mt-4 inline-flex w-full items-center justify-center rounded-sm bg-brand-dark px-5 py-3 font-semibold text-paper shadow-card transition-colors hover:bg-brand-deep"
            >
              Kalkulátor anyagra, mennyiségre
            </Link>
            <PhoneLink className="mt-2 inline-flex w-full items-center justify-center rounded-sm border border-line bg-paper px-5 py-3 font-semibold transition-colors hover:bg-sand" />
          </div>
        </aside>
      </div>
    </Section>
  );
}
