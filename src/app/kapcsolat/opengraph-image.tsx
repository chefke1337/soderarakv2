import { company, RENDELES_LEPESEK } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Kapcsolat — hívás és ajánlatkérés a Sóderáraknál";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    variant: "contact",
    title: "Hívjon, vagy kérjen ajánlatot",
    subtitle: "Adja meg az anyagot, a mennyiséget és a helyszínt — egyeztetünk.",
    contactPhone: company.phone.display,
    hours: `${company.hours.days} · ${company.hours.time}`,
    serviceSteps: RENDELES_LEPESEK.slice(0, 3).map((step, index) => ({
      number: `0${index + 1}`,
      title: step.title,
      detail: ["Anyag · mennyiség · helyszín", "Fuvarár és időpont", "Megbeszélt időpontban"][index],
    })),
  });
}
