import type { Metadata } from "next";
import { company } from "@/content/site";
import { pageMeta } from "@/lib/meta";
import Section from "@/components/Section";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Impresszum",
    description: `Impresszum: a ${company.site.domain} üzemeltetője ${company.name} — székhely, adószám, egyéni vállalkozói nyilvántartási szám és elérhetőség.`,
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
          ["Vállalkozó neve", company.name],
          ["Székhely", company.address.full],
          ["Adószám", company.legal.taxNumber],
          ["Egyéni vállalkozói nyilvántartási szám", company.legal.evRegistrationNumber],
          ["Telefon", company.phone.display],
          ["Telefonos elérhetőség", company.hours.short],
          ["E-mail", company.email],
          ["Weboldal", `${company.site.name} — ${company.site.domain}`],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-6 border-b border-line pb-3">
            <dt className="text-ink-soft">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 max-w-xl text-xs text-ink-soft">
        Az anyagárak tájékoztató jellegűek, bruttó árak (az ÁFÁ-t tartalmazzák); a fuvar díja
        külön. A végleges ajánlatot egyeztetés után adjuk.
      </p>
    </Section>
  );
}
