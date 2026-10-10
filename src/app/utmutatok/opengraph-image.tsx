import { guides } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Útmutatók — sóder, árak és szállítás lépésről lépésre";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    variant: "guideIndex",
    title: "Útmutatók",
    kicker: "GYAKORLATI TUDÁSTÁR",
    subtitle:
      "Sóder, cement, térkő, árak és szállítás — rövid válaszok a leggyakoribb kérdésekre.",
    guideTitles: guides.map((g) => g.title),
  });
}
