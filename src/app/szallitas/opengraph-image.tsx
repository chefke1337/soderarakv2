import {
  budapestDistricts,
  freightProfiles,
  MIN_ORDER_M3,
  SINGLE_TRIP_MAX_M3,
} from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Szállítás — nettó fuvardíjak irányítószám szerint, saját flotta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ezer = (n: number) => (n / 1000).toLocaleString("hu-HU");

export default function OgImage() {
  const bp = freightProfiles.filter((p) => p.municipalityId === "budapest");
  const erd = freightProfiles.find((p) => p.id === "erd")!;
  const bpFees = bp.flatMap((p) => p.bands.map((b) => b.netFee));
  const erdFees = erd.bands.map((b) => b.netFee);

  return ogCard({
    variant: "shipping",
    title: "Fuvardíj irányítószám szerint",
    zoneCards: [
      {
        label: "Budapest",
        area: `mind a ${budapestDistricts.length} kerület`,
        price: `${ezer(Math.min(...bpFees))}–${ezer(Math.max(...bpFees))} ezer Ft`,
        id: "mag",
      },
      {
        label: "Érd",
        area: erd.postalCodes.join(", "),
        price: `${ezer(Math.min(...erdFees))}–${ezer(Math.max(...erdFees))} ezer Ft`,
        id: "kozel",
      },
      {
        // A harmadik kártya felirata „EGYEDI EGYEZTETÉS" — ide csak olyan
        // állítás kerülhet, ami ezzel egyezik.
        label: "Egyéb cím",
        area: `Nincs feltüntetett díj · egy fuvarban ${MIN_ORDER_M3}–${SINGLE_TRIP_MAX_M3} m³`,
        price: "egyeztetés után",
        id: "tavolabbi",
      },
    ],
  });
}
