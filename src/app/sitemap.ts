import type { MetadataRoute } from "next";
import { company, materialGroups, settlements, guides, updated } from "@/content/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = company.site.url;

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/anyagok/`, lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/arak/`, lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/arkalkulator/`, lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/szallitas/`, lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/teruletek/`, lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/utmutatok/`, lastModified: updated, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/rolunk/`, lastModified: updated, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/kapcsolat/`, lastModified: updated, changeFrequency: "yearly", priority: 0.6 },
  ];

  const materialPages: MetadataRoute.Sitemap = materialGroups.map((g) => ({
    url: `${base}/anyagok/${g.slug}/`,
    lastModified: updated,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const settlementPages: MetadataRoute.Sitemap = settlements.map((s) => ({
    url: `${base}/teruletek/${s.slug}/`,
    lastModified: updated,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const guidePages: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${base}/utmutatok/${g.slug}/`,
    lastModified: updated,
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  return [...staticPages, ...materialPages, ...settlementPages, ...guidePages];
}
