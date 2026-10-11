import type { Metadata } from "next";
import Link from "next/link";
import { company, settlements, zones } from "@/content/site";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import Section from "@/components/Section";
import ZonaTerkepLazy from "@/components/ZonaTerkepLazy";

export const metadata: Metadata = pageMeta({
  title: "Területek — hol szállítunk sódert és ömlesztett anyagot",
  description: `Szolgáltatási terület: ${settlements.map((s) => s.name).join(", ")}.`,
  path: "/teruletek",
});

export default function TeruletekPage() {
  return (
    <Section
      kicker="Szolgáltatási terület"
      title="Zónák és települések"
      lead="Csak ezeken a településeken szállítunk — ha nincs a listán, kérdezzen rá telefonon. A zóna határozza meg a fuvar árát."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Területek", path: "/teruletek" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Kiszállítási területek",
          url: `${company.site.url}/teruletek/`,
          itemListElement: settlements.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.name,
            url: `${company.site.url}/teruletek/${s.slug}/`,
          })),
        }}
      />
      <div className="space-y-10">
        {zones.map((z) => {
          const list = settlements.filter((s) => s.zone === z.id);
          return (
            <div key={z.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl font-bold">{z.name}</h2>
                <p className="text-sm font-semibold text-brand-dark">
                  Fuvar: {(z.fuelMin / 1000).toLocaleString("hu-HU")}–
                  {(z.fuelMax / 1000).toLocaleString("hu-HU")} ezer Ft · {z.leadTime}
                </p>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{z.area}</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/teruletek/${s.slug}`}
                      className="block rounded-md border border-line bg-paper p-4 shadow-card transition-shadow hover:shadow-pop"
                    >
                      <span className="font-semibold">{s.name}</span>
                      <span className="mt-1 block text-xs text-ink-soft">
                        {z.name} · sóder, homok, kavics, murva, föld szállítás
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-10 rounded-md border border-brand/30 bg-brand-soft p-4 text-sm">
        A fuvarárak tájékoztató jellegűek, nettó értékek egy fuvarra. A végleges
        ajánlatot egyeztetés után adjuk.
      </p>

      <div className="rounded-md border border-line bg-paper p-4 shadow-card sm:p-6">
        <h2 className="font-display text-xl font-bold">Zónák a térképen</h2>
        <p className="mb-4 mt-1 text-sm text-ink-soft">
          Kattintson a zónákra a fuvarárért. A határok tájékoztató jellegűek.
        </p>
        <ZonaTerkepLazy />
      </div>
    </Section>
  );
}
