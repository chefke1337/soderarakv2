import type { Metadata } from "next";
import Link from "next/link";
import { company, guides } from "@/content/site";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

export const metadata: Metadata = pageMeta({
  title: "Útmutatók — sóder, árak és szállítás lépésről lépésre",
  description:
    "Gyakorlati útmutatók: sóder–cement arány, milyen sóder kell a betonhoz és térkő alá, mennyibe kerül a sóder anyaggal és fuvarral, kalkulátorhasználat és kiszállási idők.",
  path: "/utmutatok",
});

export default function UtmutatokPage() {
  return (
    <Section
      kicker="Tudástár"
      title="Útmutatók anyagválasztáshoz és szállításhoz"
      lead="Rövid, gyakorlati válaszok a leggyakoribb kérdésekre — mennyi sódert kell és milyent, mi való a betonhoz, a térkő alá vagy kocsibeállóhoz, és mennyibe kerül az anyag a fuvarral."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Útmutatók", path: "/utmutatok" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Útmutatók — építőanyag-kisokos",
          url: `${company.site.url}/utmutatok/`,
          itemListElement: guides.map((g, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: g.title,
            url: `${company.site.url}/utmutatok/${g.slug}/`,
          })),
        }}
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((g, index) => (
          <li key={g.slug}>
            <Link
              href={`/utmutatok/${g.slug}`}
              className="group flex h-full flex-col rounded-md border border-line bg-paper p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-pop"
            >
              <span
                aria-hidden="true"
                className="font-display text-sm font-bold tabular-nums text-brand-dark"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-2 font-display text-lg font-bold leading-snug text-balance group-hover:text-brand-dark">
                {g.title}
              </span>
              <span className="mt-2 text-sm leading-relaxed text-ink-soft">
                {g.excerpt}
              </span>
              <span className="mt-auto pt-4 text-sm font-semibold text-brand-deep underline-offset-2 group-hover:underline">
                Elolvasom <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 rounded-md border border-brand/30 bg-brand-soft p-4 text-sm">
        Nem találja a választ? Indítsa el az{" "}
        <Link
          href="/arkalkulator"
          className="font-semibold text-brand-deep underline underline-offset-2"
        >
          árkalkulátort
        </Link>{" "}
        vagy hívjon minket — segítünk kiválasztani a megfelelő anyagot.
      </p>
    </Section>
  );
}
