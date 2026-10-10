import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Adatvédelmi tájékoztató — Sóderárak";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    title: "Adatvédelmi tájékoztató",
    kicker: "Jogi információ",
  });
}
