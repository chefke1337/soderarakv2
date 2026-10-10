import { company } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";
export const alt = `${company.site.name} — ömlesztett építőanyag szállítás Budafokról`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return ogCard({
    title: "Sóder, homok, kavics, murva, bazalt, föld szállítása",
    kicker: "Budapest XXII. + XI. kerület és környéke",
    highlight: "Budafok környékén gyakran aznap",
  });
}
