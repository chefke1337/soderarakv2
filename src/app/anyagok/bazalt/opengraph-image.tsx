import { findMaterialGroup } from "@/content/site";
import { ogCard } from "@/lib/og";
import { formatFt, minPrice } from "@/lib/ui";

export const dynamic = "force-static";
export const alt = "Bazalt helyett andezit — Sóderárak";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Az örökölt /anyagok/bazalt útvonal saját kártyája (az új anyagra mutat). */
export default function OgImage() {
  const group = findMaterialGroup("andezit")!;
  const min = minPrice(group.items);
  return ogCard({
    variant: "material",
    tone: group.tone,
    title: "Bazalt helyett andezit",
    kicker: group.short,
    subtitle:
      "A Bazalt kategória helyére a nógrádkövesdi andezit került a kínálatunkban.",
    count: group.items.length,
    metricLabel: min !== null ? "BRUTTÓ ÁR / M³-TŐL" : "ANYAGÁR",
    metricValue: min !== null ? formatFt(min) : "Ajánlatkérés",
  });
}
