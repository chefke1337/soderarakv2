import { budapestDistricts, company } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Rólunk – Minőség minden szemcsében | Sóderárak";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    variant: "company",
    title: "Minőség minden szemcsében",
    subtitle:
      "Rostált sóderfrakcióink, kavicsaink és homokunk vizes osztályozási eljáráson mennek keresztül — egyenletes szemcseméret, megbízható minőség.",
    companyFacts: [
      { value: "Mosott", label: "sóderfrakciók és kavics" },
      { value: "Saját", label: "flotta Budafokról" },
      { value: `${budapestDistricts.length} + Érd`, label: "kiszolgált kerület" },
      { value: company.hours.short, label: "ügyfélfogadás" },
    ],
  });
}
