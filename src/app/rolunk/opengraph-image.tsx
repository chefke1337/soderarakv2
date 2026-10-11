import { company, materialGroups, settlements } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Bau-Kont Logisztik Kft. — Sóderárak üzletág";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    variant: "company",
    title: `${company.name} — Sóderárak üzletág`,
    subtitle: "Ömlesztett építőanyag értékesítése és szállítása Budafokról, saját flottával.",
    companyFacts: [
      { value: "Saját", label: "flotta Budafokról" },
      { value: String(settlements.length), label: "kiszolgált település" },
      { value: company.hours.short, label: "ügyfélfogadás" },
      { value: String(materialGroups.length), label: "anyagcsoport" },
    ],
  });
}
