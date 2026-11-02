import { materialGroups } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Árak — bruttó Ft/m³ anyagárak, szállítási díj az árkalkulátorban";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const priced = materialGroups
    .flatMap((group) => group.items)
    .filter((item) => item.priceGross !== null);
  const lowestItem = priced.reduce((lowest, item) =>
    item.priceGross! < lowest.priceGross! ? item : lowest,
  );

  return ogCard({
    variant: "pricing",
    title: "Árak anyagonként",
    subtitle:
      "Bruttó anyagárak köbméterenként, az ÁFÁ-val · a szállítás díja külön, nettó — az árkalkulátor számolja ki.",
    priceCards: [
      {
        label: lowestItem.name,
        value: `${lowestItem.priceGross!.toLocaleString("hu-HU")} Ft/m³-től`,
        detail: "Bruttó egységár, az ÁFÁ-t tartalmazza",
        tone: "amber",
      },
      {
        label: "Szállítási díj",
        value: "Kalkulátorral",
        detail: "Címre és mennyiségre számolva, ÁFA-bontással",
        tone: "olive",
      },
      {
        label: "Árlista",
        value: `${materialGroups.length} anyagcsoport`,
        detail: "Frakciók és tájékoztató bruttó árak",
        tone: "stone",
      },
    ],
  });
}
