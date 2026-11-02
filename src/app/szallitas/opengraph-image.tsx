import {
  budapestDistricts,
  freightProfiles,
  MIN_ORDER_M3,
  SINGLE_TRIP_MAX_M3,
} from "@/content/site";
import { ogCard } from "@/lib/og";

// Ügyfél, 2026-11-02: nyilvánosan nem közlünk díjtáblát / díjsávot — a
// szállítási díjat az árkalkulátor számolja ki.

export const dynamic = "force-static";
export const alt = "Szállítás — ömlesztett építőanyagok házhoz szállítása Budapesten és Érden";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const erd = freightProfiles.find((p) => p.id === "erd")!;

  return ogCard({
    variant: "shipping",
    title: "Házhoz szállítás",
    zoneCards: [
      {
        label: "Budapest",
        area: `mind a ${budapestDistricts.length} kerület`,
        price: "árkalkulátorral",
        id: "mag",
      },
      {
        label: "Érd",
        area: erd.postalCodes.join(", "),
        price: "árkalkulátorral",
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
