import type { Metadata } from "next";
import { DISCLOSURE_NET } from "@/content/site";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import ArkalkulatorForm from "@/components/ArkalkulatorForm";
import Section from "@/components/Section";

export const metadata: Metadata = pageMeta({
  title: "Árkalkulátor — sóder, homok, kavics, murva ár számítás fuvarral",
  description:
    "Számolja ki három lépésben: anyag, mennyiség, település. Tájékoztató nettó ár anyagra és fuvarra, majd ajánlatkérés névvel és telefonszámmal.",
  path: "/arkalkulator",
});

export default function ArkalkulatorPage() {
  return (
    <Section
      kicker="Árkalkulátor"
      title="Mennyibe kerül a sóder a kiszállítással?"
      lead="Három bemenet: anyag, mennyiség, helyszín. Az eredmény tájékoztató jellegű — a végleges ajánlatot egyeztetés után adjuk."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Árkalkulátor", path: "/arkalkulator" },
        ])}
      />
      <ArkalkulatorForm />
      <p className="mt-8 text-xs text-ink-soft">{DISCLOSURE_NET}</p>
    </Section>
  );
}
