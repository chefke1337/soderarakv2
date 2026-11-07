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
  title: "Árkalkulátor — bruttó anyagár és szállítási díj egy helyen",
  description: `Lépésről lépésre: anyag, mennyiség (1–${SINGLE_TRIP_MAX_M3} m³), szállítási cím. Az összesítő külön mutatja a bruttó anyagárat, a nettó fuvardíjat, a fuvar ${Math.round(FREIGHT_VAT_RATE * 100)}%-os ÁFÁ-ját és a teljes bruttó tájékoztató összeget. Rendelési igény beküldése e-mailben.`,
  path: "/arkalkulator",
});

export default function ArkalkulatorPage() {
  return (
    <Section
      kicker="Árkalkulátor"
      title="Mennyibe kerül kiszállítva?"
      lead="Lépésről lépésre: anyag, mennyiség, szállítási cím. Az anyagár bruttó (ÁFÁ-val), a szállítási díj nettó — az összesítő mindkettőt külön mutatja, és a teljes bruttó tájékoztató összeget is. A végleges ajánlatot egyeztetés után adjuk."
      align="center"
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Főoldal", path: "/" },
          { name: "Árkalkulátor", path: "/arkalkulator" },
        ])}
      />
      <ArkalkulatorForm />
      <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-ink-soft">
        {DISCLOSURE_GROSS} {DISCLOSURE_FREIGHT} {DISCLOSURE_PRICE}
      </p>
    </Section>
  );
}
