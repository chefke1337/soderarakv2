import type { Metadata } from "next";
import { company } from "@/content/site";
import { pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Impresszum",
    description: `A ${company.site.domain} üzemeltetője: ${company.name}.`,
    path: "/impresszum",
  }),
  robots: { index: false },
};

export default function ImpresszumPage() {
  return (
    <Section
      kicker="Jogi"
      title="Impresszum"
      lead={`A ${company.site.domain} weboldal üzemeltetője.`}
    >
      <dl className="max-w-xl space-y-4 text-sm">
        {[
          ["Üzemeltető", company.name],
          ["Üzletág", company.businessUnit],
          ["Telephely", company.address.full],
          ["Telefon", company.phone.display],
          ["E-mail", company.email],
          ["Ügyfélfogadás", `${company.hours.days}, ${company.hours.time}`],
          ["Weboldal", company.site.domain],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-6 border-b border-line pb-3">
            <dt className="text-ink-soft">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 max-w-xl text-xs text-ink-soft">
        Az árak tájékoztató jellegűek, nettó árak (ÁFA nélkül); a fuvar díja
        külön. A végleges ajánlatot egyeztetés után adjuk.
      </p>
    </Section>
  );
}
