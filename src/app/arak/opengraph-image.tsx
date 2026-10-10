import { materialGroups, zones } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Árak — nettó Ft/m³ árak anyagonként";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const pricedItems = materialGroups.flatMap((group) => group.items)
    .filter((item) => item.priceNet !== null);
  const lowestItem = pricedItems.reduce((lowest, item) =>
    item.priceNet! < lowest.priceNet! ? item : lowest,
  );
  const lowestPrice = lowestItem.priceNet!;
  return ogCard({
    variant: "pricing",
    title: "Árak anyagonként",
    subtitle: "Nettó anyagárak köbméterenként · a fuvar díja külön, zónánként.",
    priceCards: [
      { label: lowestItem.name, value: `${lowestPrice.toLocaleString("hu-HU")} Ft/m³-től`, detail: "A listázott anyagok legalacsonyabb egységára", tone: "amber" },
      { label: zones[0].name, value: `${(zones[0].fuelMin / 1000).toLocaleString("hu-HU")}–${(zones[0].fuelMax / 1000).toLocaleString("hu-HU")} ezer Ft`, detail: "Tájékoztató fuvarár · egy fuvarra", tone: "olive" },
      { label: "Árlista", value: `${materialGroups.length} anyagcsoport`, detail: "Frakciók és tájékoztató nettó árak", tone: "stone" },
    ],
  });
}
