import { company } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "404 — az oldal nem található | Sóderárak";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    variant: "notFound",
    title: "Ez az oldal nem található",
    subtitle:
      "Lehet, hogy áthelyeztük. Hívjon bátran, vagy indítsa el a kalkulátort — az anyag, mennyiség és helyszín alapján számolunk.",
    contactPhone: company.phone.display,
    highlight: "Vagy számoljon az árkalkulátorral",
    hours: company.hours.short,
  });
}
