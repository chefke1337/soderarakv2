import type { Metadata } from "next";
import {
  company,
  DISCLOSURE_FREIGHT,
  DISCLOSURE_PRICE,
  materialGroups,
} from "@/content/site";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";
import MaterialLedger, { GrossPriceBanner, LedgerHeader, WashedQualityNote } from "@/components/MaterialLedger";

export const metadata: Metadata = pageMeta({
  title: "Anyagok — sóder, homok, kavics, murva, andezit, föld",
  description:
    "Ömlesztett építőanyagaink: jó minőségű, mosott sóderfrakciók (0–4-től 0–24-ig) és nem mosott töltősóder, bányahomok, jó minőségű, mosott kavics és egyszer mosott kulé, murva, nógrádkövesdi andezit, töltő- és termőföld. Bruttó árak Ft/m³.",
  path: "/anyagok",
});

export default function AnyagokPage() {
  return (
    <Section
      kicker="Anyagaink"
      title="Ömlesztett anyagok frakciónként"
      lead="Csak ezeket az anyagokat szállítjuk. Az árak bruttó árak, az ÁFÁ-t tartalmazzák; a fuvar díja külön, nettó értékben számolódik. Amelyik anyag ára nincs feltüntetve, arról egyeztetés után adunk ajánlatot."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Anyagok", path: "/anyagok" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "OfferCatalog",
          name: "Ömlesztett építőanyagok",
          url: `${company.site.url}/anyagok/`,
          itemListElement: materialGroups.map((g) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Product",
              name: g.name,
              description: g.short,
              url: `${company.site.url}/anyagok/${g.slug}/`,
            },
          })),
        }}
      />
      <GrossPriceBanner className="mb-4" />
      <WashedQualityNote className="mb-6" />
      <LedgerHeader />
      <MaterialLedger headingLevel={2} />
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        {DISCLOSURE_FREIGHT} {DISCLOSURE_PRICE}
      </p>
    </Section>
  );
}
