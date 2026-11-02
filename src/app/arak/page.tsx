import type { Metadata } from "next";
import Link from "next/link";
import {
  company,
  DISCLOSURE_FREIGHT,
  DISCLOSURE_GROSS,
  DISCLOSURE_PRICE,
  FREIGHT_PUBLIC_NOTICE,
  FREIGHT_VAT_RATE,
  itemWash,
  materialGroups,
  MIN_ORDER_M3,
  PERMIT_NOTICE,
  SINGLE_TRIP_MAX_M3,
} from "@/content/site";
import { IconArrowRight, IconCalculator, PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";
import MaterialLedger, { GrossPriceBanner, LedgerHeader, WashedQualityNote } from "@/components/MaterialLedger";

export const metadata: Metadata = pageMeta({
  title: "Árak — sóder, homok, kavics, murva, andezit, föld (bruttó Ft/m³)",
  description:
    "Teljes árlista bruttó Ft/m³-ben, az ÁFÁ-t tartalmazva: sóder 0–4-től 0–24-ig, töltősóder, bányahomok, mosott kavics, kulé, murva, nógrádkövesdi andezit, töltő- és termőföld. A szállítási díjat az árkalkulátor számolja ki.",
  path: "/arak",
});

/**
 * Strukturált termékadat: BRUTTÓ árak. A `valueAddedTaxIncluded: true`
 * jelzés a tényleges árjelleget írja le — a V2 nettó jelölése megszűnt.
 */
const offerCatalog = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  name: "Ömlesztett anyag árlista — bruttó Ft/m³",
  url: `${company.site.url}/arak/`,
  itemListElement: materialGroups.flatMap((g) =>
    g.items.map((item) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Product",
        name: `${g.name} — ${item.name}${item.fraction ? ` (${item.fraction})` : ""}`,
        ...(itemWash(item)
          ? {
              additionalProperty: {
                "@type": "PropertyValue",
                name: "Mosottság",
                value: itemWash(item)!.label,
              },
            }
          : {}),
      },
      ...(item.priceGross !== null
        ? {
            price: item.priceGross,
            priceCurrency: "HUF",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: item.priceGross,
              priceCurrency: "HUF",
              unitText: "m³",
              valueAddedTaxIncluded: true,
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
      title="Bruttó anyagárak köbméterenként"
      lead={`Az anyagárak bruttó árak, az ÁFÁ-t tartalmazzák. A szállítás díja ettől külön, nettó értékben számolódik. Minimum rendelés ${MIN_ORDER_M3} m³; egy fuvarban legfeljebb ${SINGLE_TRIP_MAX_M3} m³.`}
    >
      <JsonLd data={offerCatalog} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Árak", path: "/arak" },
        ])}
      />

      <GrossPriceBanner className="mb-4" />
      <WashedQualityNote className="mb-6" />
      <LedgerHeader />
      <MaterialLedger headingLevel={2} />

      {/* ── Szállítási díj: nyilvános díjtábla helyett (ügyfél, 2026-11-02) ── */}
      <div
        id="fuvardijak"
        className="mt-12 scroll-mt-28 rounded-[var(--radius-md)] border border-border-strong bg-surface p-5 md:p-6"
      >
        <h2 className="font-display text-heading-md font-bold">Szállítási díj</h2>
        <p className="mt-2 max-w-[62ch] text-[0.9375rem] leading-relaxed">
          {FREIGHT_PUBLIC_NOTICE} A szállítási díj nettó; rá{" "}
          {Math.round(FREIGHT_VAT_RATE * 100)}% ÁFA jön — a kalkulátor összesítője ezt külön
          mutatja, a teljes bruttó tájékoztató összeggel együtt.
        </p>
        <Link href="/arkalkulator" className="btn btn-outline mt-4">
          <IconCalculator size={17} />
          Szállítási díj kiszámítása
        </Link>
      </div>

      {/* ── Záró sáv ── */}
      <div className="mt-12 grid gap-6 rounded-sm border border-line-strong bg-sand p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-8">
        <div className="min-w-0">
          <p className="font-semibold">{DISCLOSURE_PRICE}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {DISCLOSURE_GROSS} {DISCLOSURE_FREIGHT}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{PERMIT_NOTICE}</p>
        </div>
        {/* data-call-region: árlista záró CTA-sora (metrics-plan §5) */}
        <div className="flex flex-col gap-3 sm:flex-row" data-call-region="arak_cta">
          <Link href="/arkalkulator" className="btn btn-primary">
            Árkalkulátor indítása
            <IconArrowRight size={17} className="btn-icon btn-icon-move" />
          </Link>
          <PhoneLink className="num btn btn-outline" />
        </div>
      </div>
    </Section>
  );
}
