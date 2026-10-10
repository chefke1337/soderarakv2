import { findGuide, guides } from "@/content/site";
import { ogCard } from "@/lib/og";

export const dynamic = "force-static";

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = findGuide(slug);

  return ogCard({
    variant: "guide",
    title: guide?.title ?? "Útmutatók",
    kicker: guide ? "Útmutató" : "Sóderárak",
    subtitle: guide?.excerpt,
  });
}
