import { budapestDistricts, serviceAreas } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Kiszállítási területek — Budapest minden kerülete és Érd";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    variant: "areaIndex",
    title: "Hol szállítunk?",
    subtitle: `Budapest mind a ${budapestDistricts.length} kerületébe és Érdre — a fuvardíj alapja az irányítószám.`,
    count: serviceAreas.length,
    kicker: "Szállítási területek",
  });
}
