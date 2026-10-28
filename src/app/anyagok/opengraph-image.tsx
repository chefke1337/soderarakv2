import { materialGroups } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Anyagaink — sóder, homok, kavics, murva, andezit, föld";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    variant: "materialIndex",
    title: "Anyagok frakciónként",
    subtitle: "Mosott sóder, homok, kavics, murva, nógrádkövesdi andezit és föld.",
    count: materialGroups.length,
    materials: materialGroups.map(({ name, tone }) => ({ name, tone })),
    highlight: "Bruttó árak · fuvar külön, nettó",
  });
}
