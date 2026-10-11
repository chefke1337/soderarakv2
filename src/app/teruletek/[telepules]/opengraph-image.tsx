import { findSettlement, findZone, settlements } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";

export function generateStaticParams() {
  return settlements.map((settlement) => ({ telepules: settlement.slug }));
}

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ telepules: string }>;
}) {
  const { telepules } = await params;
  const settlement = findSettlement(telepules);

  if (!settlement) {
    const fallbackZone = findZone("mag");
    return ogCard({
      title: "Kiszállítási területek",
      kicker: "Terület",
      variant: "settlement",
      zoneId: "mag",
      zoneName: fallbackZone.name,
      highlight: `${fallbackZone.fuelMin / 1000}–${fallbackZone.fuelMax / 1000} ezer Ft`,
    });
  }

  const zone = findZone(settlement.zone);
  return ogCard({
    variant: "settlement",
    zoneId: settlement.zone,
    zoneName: zone.name,
    title: settlement.name,
    kicker: `Terület — ${zone.name}`,
    subtitle: "Sóder és ömlesztett építőanyag szállítás Budafokról.",
    highlight: `${zone.fuelMin / 1000}–${zone.fuelMax / 1000} ezer Ft nettó`,
    leadTime: zone.leadTime,
  });
}
