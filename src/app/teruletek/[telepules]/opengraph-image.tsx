import { areaPages, findAreaPage, freightProfiles } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";

export function generateStaticParams() {
  return areaPages.map((area) => ({ telepules: area.slug }));
}

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Kiszállítási terület kártya — Sóderárak";


export default async function OgImage({
  params,
}: {
  params: Promise<{ telepules: string }>;
}) {
  const { telepules } = await params;
  const area = findAreaPage(telepules);

  if (!area) {
    return ogCard({
      title: "Kiszállítási területek",
      kicker: "Terület",
      variant: "settlement",
      zoneId: "mag",
      zoneName: "Budapest és Érd",
      metricLabel: "SZÁLLÍTÁSI DÍJ",
      highlight: "árkalkulátorral",
    });
  }

  if (area.freight.kind !== "profile") {
    return ogCard({
      variant: "settlement",
      zoneId: "tavolabbi",
      zoneName: "Egyedi egyeztetés",
      title: area.name,
      kicker: "Terület — egyedi egyeztetés",
      subtitle:
        "Ehhez a címhez egyedi szállítási egyeztetés szükséges — a fuvar díját telefonon adjuk meg.",
      metricLabel: "SZÁLLÍTÁSI DÍJ",
      highlight: "egyeztetés után",
      leadTime: "egyeztetett időpontban",
    });
  }

  const f = area.freight;
  const profiles = freightProfiles.filter(
    (p) =>
      p.municipalityId === f.municipalityId &&
      (f.districtId === undefined || p.districtId === f.districtId),
  );

  return ogCard({
    variant: "settlement",
    zoneId: "mag",
    zoneName: profiles[0]?.label ?? area.name,
    title: area.name,
    kicker: `Terület — ${area.shortName}`,
    subtitle:
      "Sóder és ömlesztett építőanyag szállítás. Az anyagár bruttó; a szállítási díjat az árkalkulátor számolja ki.",
    metricLabel: "SZÁLLÍTÁSI DÍJ",
      highlight: "árkalkulátorral",
    leadTime:
      area.freight.districtId === 22 ? "gyakran aznap" : "egyeztetett időpontban",
  });
}
