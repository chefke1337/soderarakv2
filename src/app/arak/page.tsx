import type { Metadata } from "next";
import Link from "next/link";
import { materialGroups, zones, company, DISCLOSURE_NET, DISCLOSURE_PRICE } from "@/content/site";
import { PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";
import MaterialLedger, { LedgerHeader } from "@/components/MaterialLedger";

export const metadata: Metadata = pageMeta({
  title: "Árak — sóder, homok, kavics, murva árlista (nettó Ft/m³)",
  description:
    "Teljes árlista: sóder 0/4–0/24, töltősóder, homok, kavics, kulékavics, murva és föld nettó árai Ft/m³-ben. Fuvarárak zónánként. Tájékoztató árak.",
  path: "/arak",
});

const offerCatalog = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  name: "Ömlesztett anyag árlista — nettó Ft/m³",
  url: `${company.site.url}/arak/`,
  itemListElement: materialGroups.flatMap((g) =>
    g.items.map((item) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Product",
        name: `${g.name} — ${item.name}${item.fraction ? ` (${item.fraction})` : ""}`,
      },
      ...(item.priceNet !== null
        ? {
            price: item.priceNet,
            priceCurrency: "HUF",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: item.priceNet,
              priceCurrency: "HUF",
              unitText: "m³",
              valueAddedTaxIncluded: false,
            },
          }
        : {}),
    })),
  ),
};

export default function ArakPage() {
  return (
    <Section
      kicker="Árlista"
      title="Árak anyagonként és zónánként"
      lead="Az anyagárak nettó árak, ÁFA nélkül, és nem tartalmazzák a fuvar díját. Minimum rendelés 4 m³; egy fuvarban akár 23 m³."
    >
      <JsonLd data={offerCatalog} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Árak", path: "/arak" },
        ])}
      />
      <LedgerHeader />
      <MaterialLedger openAll headingLevel={2} />

      <h2 className="mt-16 font-display text-heading-md font-bold">Fuvarárak zónánként</h2>
      <p className="mt-2 max-w-[60ch] text-ink-soft">
        A fuvar díja a szállítási zónától függ. A sávok tájékoztató jellegűek,
        nettó értékek egy fuvarra.
      </p>
      <div className="mt-6 overflow-x-auto" role="region" aria-label="Fuvarárak zónánként" tabIndex={0}>
        <table className="num w-full md:min-w-[560px] block md:table border-t border-ink/80 text-left">
          <thead className="sr-only md:not-sr-only md:table-header-group">
            <tr className="border-b border-line text-sm text-ink-soft">
              <th scope="col" className="py-3 pr-4 font-medium">Zóna</th>
              <th scope="col" className="py-3 pr-4 font-medium">Települések</th>
              <th scope="col" className="py-3 pr-4 font-medium">Kiszállás</th>
              <th scope="col" className="py-3 text-right font-medium">Fuvar, nettó</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {zones.map((z) => (
              <tr key={z.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line py-4 align-top md:table-row md:py-0">
                <th scope="row" className="pr-4 md:table-cell md:py-4 font-display text-heading-xs font-bold">{z.name}</th>
                <td className="order-3 w-full pr-4 text-sm leading-relaxed text-ink-soft md:order-none md:table-cell md:w-auto md:py-4">{z.area}</td>
                <td className="order-4 w-full pr-4 text-sm md:order-none md:table-cell md:w-auto md:py-4"><span className="text-ink-soft md:hidden">Kiszállás: </span>{z.leadTime}</td>
                <td className="order-2 md:order-none md:table-cell md:py-4 text-right font-display text-heading-sm font-bold whitespace-nowrap">
                  {z.fuelMin.toLocaleString("hu-HU")}–{z.fuelMax.toLocaleString("hu-HU")} Ft
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 grid gap-6 rounded-sm border border-line-strong bg-sand p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-8">
        <div>
          <p className="font-semibold">{DISCLOSURE_PRICE}</p>
          <p className="mt-1 text-sm text-ink-soft">{DISCLOSURE_NET}</p>
        </div>
        {/* data-call-region: árlista záró CTA-sora (metrics-plan §5) */}
        <div className="flex flex-col gap-3 sm:flex-row" data-call-region="arak_cta">
          <Link
            href="/arkalkulator"
            className="inline-flex min-h-12 items-center justify-center rounded-sm bg-brand-dark px-5 font-semibold text-paper transition-colors hover:bg-brand-deep"
          >
            Árkalkulátor indítása
          </Link>
          <PhoneLink className="num inline-flex min-h-12 items-center justify-center rounded-sm border border-ink/70 px-5 font-semibold transition-colors hover:bg-ink hover:text-paper" />
        </div>
      </div>
    </Section>
  );
}
