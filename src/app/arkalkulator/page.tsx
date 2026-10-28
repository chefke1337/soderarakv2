import type { Metadata } from "next";
import {
  DISCLOSURE_FREIGHT,
  DISCLOSURE_GROSS,
  DISCLOSURE_PRICE,
  FREIGHT_VAT_RATE,
  SINGLE_TRIP_MAX_M3,
} from "@/content/site";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/meta";
import ArkalkulatorForm from "@/components/ArkalkulatorForm";
import Section from "@/components/Section";

export const metadata: Metadata = pageMeta({
  title: "Árkalkulátor — bruttó anyagár és nettó fuvar irányítószám szerint",
  description: `Három lépés: anyag, mennyiség (1–${SINGLE_TRIP_MAX_M3} m³), irányítószám. Az összesítő külön mutatja a bruttó anyagárat, a nettó fuvardíjat, a fuvar ${Math.round(FREIGHT_VAT_RATE * 100)}%-os ÁFÁ-ját és a teljes bruttó tájékoztató összeget. Rendelési igény beküldése e-mailben.`,
  path: "/arkalkulator",
});

export default function ArkalkulatorPage() {
  return (
    <Section
      kicker="Árkalkulátor"
      title="Mennyibe kerül kiszállítva?"
      lead="Három bemenet: anyag, mennyiség, irányítószám. Az anyagár bruttó (ÁFÁ-val), a fuvardíj nettó — az összesítő mindkettőt külön mutatja, és a végén a teljes bruttó tájékoztató összeget is. A végleges ajánlatot egyeztetés után adjuk."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Árkalkulátor", path: "/arkalkulator" },
        ])}
      />
      <ArkalkulatorForm />
      <p className="mt-8 max-w-[76ch] text-xs leading-relaxed text-ink-soft">
        {DISCLOSURE_GROSS} {DISCLOSURE_FREIGHT} {DISCLOSURE_PRICE}
      </p>
    </Section>
  );
}
