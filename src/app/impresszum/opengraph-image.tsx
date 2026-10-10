import { company } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = `Impresszum — ${company.site.domain}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    title: "Impresszum",
    kicker: "Üzemeltető",
    highlight: company.name,
  });
}
