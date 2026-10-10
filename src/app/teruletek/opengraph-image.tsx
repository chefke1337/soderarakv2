import { settlements } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Kiszállítási területek — Budapest XXII. és a környező települések";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    variant: "areaIndex",
    title: "Hol szállítunk?",
    subtitle: "Budafokról a környező kerületekbe és a környező településekre.",
    count: settlements.length,
    kicker: "Szállítási területek",
  });
}
