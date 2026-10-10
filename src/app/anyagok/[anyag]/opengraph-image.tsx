import { findMaterialGroup, materialGroups } from "@/content/site";
import { ogCard } from "@/lib/og";
import { formatFt } from "@/lib/ui";

export const dynamic = "force-static";

export function generateStaticParams() {
  return materialGroups.map((group) => ({ anyag: group.slug }));
}

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Anyag árlista kártya — Sóderárak";

export default async function OgImage({
  params,
}: {
  params: Promise<{ anyag: string }>;
}) {
  const { anyag } = await params;
  const group = findMaterialGroup(anyag);

  // Ismeretlen slug: semleges kártya, nem dob hibát (build-time fut).
  if (!group) {
    return ogCard({
      title: "Ömlesztett építőanyagok",
      kicker: "Anyag",
      variant: "material",
      tone: "soder",
    });
  }

  const priced = group.items.filter((i) => i.priceNet !== null);
  const min = priced.length ? Math.min(...priced.map((i) => i.priceNet as number)) : null;

  return ogCard({
    variant: "material",
    tone: group.tone,
    title: group.name,
    kicker: group.short,
    subtitle: group.description,
    count: group.items.length,
    metricLabel: min !== null ? "NETTÓ ÁR / M³-TŐL" : "ANYAGÁR",
    metricValue: min !== null ? formatFt(min) : "Ajánlatkérés",
  });
}
