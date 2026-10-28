import { freightProfiles, materialGroups } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Árak — bruttó Ft/m³ anyagárak, nettó fuvardíjak irányítószám szerint";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const priced = materialGroups
    .flatMap((group) => group.items)
    .filter((item) => item.priceGross !== null);
  const lowestItem = priced.reduce((lowest, item) =>
    item.priceGross! < lowest.priceGross! ? item : lowest,
  );
  const freightMinNet = Math.min(
    ...freightProfiles.flatMap((p) => p.bands.map((b) => b.netFee)),
  );

  return ogCard({
    variant: "pricing",
    title: "Árak anyagonként",
    subtitle:
      "Bruttó anyagárak köbméterenként, az ÁFÁ-val · a fuvar díja külön, nettó, irányítószám szerint.",
    priceCards: [
      {
        label: lowestItem.name,
        value: `${lowestItem.priceGross!.toLocaleString("hu-HU")} Ft/m³-től`,
        detail: "Bruttó egységár, az ÁFÁ-t tartalmazza",
        tone: "amber",
      },
      {
        label: "Fuvar nettó",
        value: `${freightMinNet.toLocaleString("hu-HU")} Ft-tól`,
        detail: "Egy fuvarra · irányítószám és mennyiség szerint",
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
