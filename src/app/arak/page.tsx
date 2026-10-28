import type { Metadata } from "next";
import Link from "next/link";
import {
  company,
  DISCLOSURE_FREIGHT,
  DISCLOSURE_GROSS,
  DISCLOSURE_PRICE,
  FREIGHT_VAT_RATE,
  materialGroups,
  MIN_ORDER_M3,
  PERMIT_NOTICE,
  SINGLE_TRIP_MAX_M3,
} from "@/content/site";
import { IconArrowRight, PhoneLink } from "@/lib/ui";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";
import MaterialLedger, { GrossPriceBanner, LedgerHeader } from "@/components/MaterialLedger";
import PostalTariffTable from "@/components/PostalTariffTable";

export const metadata: Metadata = pageMeta({
  title: "Árak — sóder, homok, kavics, murva, andezit, föld (bruttó Ft/m³)",
  description:
    "Teljes árlista bruttó Ft/m³-ben, az ÁFÁ-t tartalmazva: sóder 0–4-től 0–24-ig, töltősóder, bányahomok, mosott kavics, kulé, murva, nógrádkövesdi andezit, töltő- és termőföld. Fuvardíjak irányítószám szerint, nettó.",
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
        ...(item.washed
          ? {
              additionalProperty: {
                "@type": "PropertyValue",
                name: "Minőségjelölés",
                value: item.washed.label,
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
      title="Bruttó anyagárak és irányítószámos fuvardíjak"
      lead={`Az anyagárak bruttó árak, az ÁFÁ-t tartalmazzák. A fuvar díja ettől külön, nettó értékben számolódik, az irányítószám és a mennyiség szerint. Minimum rendelés ${MIN_ORDER_M3} m³; egy fuvarban legfeljebb ${SINGLE_TRIP_MAX_M3} m³.`}
    >
      <JsonLd data={offerCatalog} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Árak", path: "/arak" },
        ])}
      />

      <GrossPriceBanner className="mb-6" />
      <LedgerHeader />
      <MaterialLedger openAll headingLevel={2} />

      {/* ── Fuvardíjak: irányítószámos, kereshető lista ── */}
      <h2 id="fuvardijak" className="mt-16 font-display text-heading-md font-bold">
        Fuvardíjak irányítószám szerint
      </h2>
      <p className="mt-2 max-w-[66ch] text-ink-soft">
        A fuvar díját a szállítási cím <strong className="font-semibold">irányítószáma</strong>{" "}
        és a szállított mennyiség határozza meg — a kerület kiválasztása önmagában nem
        elég. Az alábbi összegek nettó fuvardíjak egy fuvarra; rájuk{" "}
        {Math.round(FREIGHT_VAT_RATE * 100)}% ÁFA jön. A teljes bruttó összeget az{" "}
        <Link href="/arkalkulator" className="link">
          árkalkulátor
        </Link>{" "}
        számolja ki.
      </p>
      <div className="mt-6">
        <PostalTariffTable />
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
