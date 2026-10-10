import { zones } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Szállítás — fuvarárak zónánként, saját flotta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    variant: "shipping",
    title: "Három zóna, egyeztetett fuvarár",
    zoneCards: zones.map((zone) => ({
      label: zone.name,
      area: zone.area,
      price: `${(zone.fuelMin / 1000).toLocaleString("hu-HU")}–${(zone.fuelMax / 1000).toLocaleString("hu-HU")} ezer Ft`,
      id: zone.id,
    })),
  });
}
