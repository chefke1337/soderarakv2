import type { Metadata } from "next";
import { absoluteUrl, company } from "@/content/site";

function canonicalPath(path: string): string {
  const normalized = `/${path.replace(/^\/+|\/+$/g, "")}`;
  return normalized === "/" ? "/" : `${normalized}/`;
}

/** Szóhatáron vág, ha a metaszöveg hosszabb a keresők által mutatottnál. */
function clamp(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "");
}

/** Egységes oldal-meta: canonical, OG, twitter — minden oldal ezt használja. */
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const canonical = canonicalPath(path);
  const canonicalUrl = absoluteUrl(canonical);
  const imagePath = `${canonical === "/" ? "" : canonical.slice(0, -1)}/opengraph-image.png`;

  const clampedTitle = clamp(title, 57);
  const clampedDescription = clamp(description, 165);
  // Az OG-title a (már clamp-elt) title-ből épül, hogy mindig tükrözze — az Export QA ezt követeli.
  const ogTitle = `${clampedTitle} | ${company.site.name}`;

  return {
    title: clampedTitle,
    description: clampedDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: ogTitle,
      description: clampedDescription,
      url: canonicalUrl,
      siteName: company.site.name,
      locale: "hu_HU",
      type: "website",
      images: [{
        url: absoluteUrl(imagePath),
        width: 1200,
        height: 630,
        alt: `${title} — ${company.site.name}`,
        type: "image/png",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: clampedDescription,
      images: [{
        url: absoluteUrl(imagePath),
        width: 1200,
        height: 630,
        alt: `${title} — ${company.site.name}`,
      }],
    },
  };
}

/** Breadcrumb JSON-LD gyártó. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(canonicalPath(item.path)),
    })),
  };
}

/** FAQPage JSON-LD gyártó. */
export function faqJsonLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** JSON-LD script tag helper. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
