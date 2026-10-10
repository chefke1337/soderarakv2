import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Árkalkulátor — anyag, mennyiség, település";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    title: "Mennyibe kerül a sóder a kiszállítással?",
    kicker: "Árkalkulátor",
    highlight: "3 lépés: anyag + mennyiség + helyszín",
  });
}
