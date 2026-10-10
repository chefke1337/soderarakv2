import { materialGroups } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Anyagaink — sóder, homok, kavics, murva, bazalt, föld";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    variant: "materialIndex",
    title: "Anyagok frakciónként",
    subtitle: "Sóder, homok, kavics, murva, bazalt és föld Budafokról.",
    count: materialGroups.length,
    materials: materialGroups.map(({ name, tone }) => ({ name, tone })),
    highlight: "Nettó árak · fuvar külön",
  });
}
