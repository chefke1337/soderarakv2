import type { MetadataRoute } from "next";
import { company } from "@/content/site";
import { withBasePath } from "@/lib/basepath";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${company.site.name} — ${company.name}`,
    short_name: company.site.name,
    description:
      "Sóder, homok, kavics, murva, andezit és föld szállítás Budapestre és Érdre. Bruttó anyagárak Ft/m³-ben, a fuvar irányítószám szerint; Budafok környékén gyakran aznap.",
    start_url: withBasePath("/"),
    display: "standalone",
    background_color: "#f2eee4",
    theme_color: "#1a1614",
    icons: [
      { src: withBasePath("/icon.svg"), sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: withBasePath("/icons/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
