import type { Metadata } from "next";
import { company, DISCLOSURE_NET, DISCLOSURE_PRICE, materialGroups } from "@/content/site";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";
import MaterialLedger, { LedgerHeader } from "@/components/MaterialLedger";

export const metadata: Metadata = pageMeta({
  title: "Anyagok — sóder, homok, kavics, murva, bazalt, föld",
  description:
    "Ömlesztett építőanyagaink: sóder frakciók (0/4–0/24), natúr homok, kerti és kulékavics, murva, bazalt és termőföld. Tájékoztató nettó árak Ft/m³.",
  path: "/anyagok",
});

export default function AnyagokPage() {
  return (
    <Section
      kicker="Anyagaink"
      title="Ömlesztett anyagok frakciónként"
      lead="Csak ezeket az anyagokat szállítjuk. Minden ár nettó, ÁFA nélkül; a fuvar díja külön. Amelyik anyag ára nincs feltüntetve, arról egyeztetés után adunk ajánlatot."
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
      <LedgerHeader />
      <MaterialLedger headingLevel={2} />
      <p className="mt-4 text-sm text-ink-soft">{DISCLOSURE_NET} {DISCLOSURE_PRICE}</p>
    </Section>
  );
}
