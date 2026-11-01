/**
 * llms.txt — a KÖZPONTI adatforrásból generálva.
 *
 * A V2-ben ez kézzel írt statikus fájl volt (`public/llms.txt`), ami a
 * harmadik, egymástól eltérő árlista lett. V3-ban build-time generálódik a
 * `src/content/catalog.ts` + `src/content/freight.ts` adataiból, így nem
 * tud elcsúszni a felülettől.
 */

import {
  bandLabel,
  budapestDistricts,
  company,
  DISCLOSURE_GROSS,
  DISCLOSURE_PRICE,
  FREIGHT_VAT_RATE,
  freightProfiles,
  guides,
  materialGroups,
  MIN_ORDER_M3,
  MULTI_TRIP_NOTICE,
  PERMIT_NOTICE,
  profileMaxM3,
  quoteOnlyAreas,
  romanDistrict,
  SINGLE_TRIP_MAX_M3,
  UNSUPPORTED_NOTICE,
} from "@/content/site";
import { budapestDistrictAreas, DISTRICT_AREAS_SOURCE } from "@/content/districts";

export const dynamic = "force-static";

const ft = (n: number) => `${n.toLocaleString("hu-HU")} Ft`;
const SITE = "https://soderarak.hu";

function build(): string {
  const L: string[] = [];

  L.push(`# Sóderárak — ${company.name}`);
  L.push("");
  L.push(
    `> Ömlesztett építőanyagok (sóder, homok, kavics, murva, andezit, föld) értékesítése és szállítása Budapest mind a ${budapestDistricts.length} kerületébe és Érdre. Nem webshop: rendelés telefonon, vagy rendelési igény beküldésével az árkalkulátorból.`,
  );
  L.push("");

  L.push("## Alapadatok");
  L.push("");
  L.push(`- Cég: ${company.name} — ${company.businessUnit}`);
  L.push(`- Web: ${SITE}`);
  L.push(`- Telefon: ${company.phone.display} (${company.hours.short})`);
  L.push(`- E-mail: ${company.email}`);
  L.push(`- Hulladék/konténer (külön üzletág): ${company.waste.url}`);
  L.push("");

  L.push("## Árazás természete (FONTOS)");
  L.push("");
  L.push(`- ${DISCLOSURE_GROSS}`);
  L.push("- A bruttó anyagárra NEM kerül még egyszer ÁFA.");
  L.push(
    `- A fuvardíjak NETTÓ értékek egy fuvarra; rájuk ${Math.round(FREIGHT_VAT_RATE * 100)}% ÁFA jön.`,
  );
  L.push(
    "- A teljes bruttó tájékoztató összeg = anyag bruttó részösszeg + fuvar bruttó díj.",
  );
  L.push(`- Minimum rendelés: ${MIN_ORDER_M3} m³; egy fuvarban legfeljebb ${SINGLE_TRIP_MAX_M3} m³.`);
  L.push(`- ${MULTI_TRIP_NOTICE}`);
  L.push(`- ${PERMIT_NOTICE}`);
  L.push("");

  L.push("## Anyagok és bruttó árak (Ft/m³, ÁFÁ-val, fuvar nélkül)");
  L.push("");
  for (const g of materialGroups) {
    const items = g.items
      .map((i) => {
        const price = i.priceGross === null ? "ár egyeztetés után" : ft(i.priceGross);
        const marks = [i.qualifier, i.washed?.label, i.unclassified ? "osztályozatlan" : null]
          .filter(Boolean)
          .join(", ");
        return `${i.name}${marks ? ` [${marks}]` : ""} ${price}`;
      })
      .join("; ");
    L.push(`- ${g.name}${g.washed ? ` (${g.washed.label})` : ""}: ${items}`);
  }
  L.push("");
  L.push(
    "- Minőségjelölés: minden sóder és kavics jó minőségű, mosott (a kulé is mosott, de méret szerint osztályozatlan, kb. 32–125 mm). Vizes osztályozás: sóder, kavics, homok.",
  );
  L.push("");

  L.push("## Fuvardíjak irányítószám szerint (NETTÓ Ft, egy fuvarra)");
  L.push("");
  L.push(
    "- A fuvardíj alapja mindig a szállítási cím irányítószáma. A kerület kiválasztása önmagában nem határozza meg a díjat.",
  );
  L.push("- Sávhatárok (felső határ zártan): ≤2 m³, 2–5 m³, 5–7 m³, 7–10 m³.");
  L.push("");
  for (const p of freightProfiles) {
    const bands = p.bands.map((b) => `${bandLabel(p, b)}: ${ft(b.netFee)}`).join("; ");
    const limit =
      profileMaxM3(p) < SINGLE_TRIP_MAX_M3
        ? ` — ${profileMaxM3(p)} m³ felett egyedi egyeztetés`
        : "";
    L.push(`- ${p.label} (${p.postalCodes.join(", ")}): ${bands}${limit}`);
  }
  L.push("");
  L.push(`- ${UNSUPPORTED_NOTICE}`);
  L.push(
    `- Jelenleg NINCS feltüntetett fuvardíj: ${quoteOnlyAreas.map((a) => a.name).join(", ")}.`,
  );
  L.push(
    "- A Budapest I. kerületi Vár területén külön behajtási engedély és előzetes egyeztetés szükséges; a Várhoz tartozást nem irányítószám alapján döntjük el.",
  );
  L.push("");

  L.push("## Budapest kerületei és városrészei (tájékoztató)");
  L.push("");
  L.push(`- ${DISTRICT_AREAS_SOURCE} A díjat mindig az irányítószám adja, nem a városrész.`);
  for (const d of budapestDistrictAreas) {
    L.push(`- ${romanDistrict(d.id)} kerület${d.name ? ` (${d.name})` : ""}: ${d.areas.join(", ")}`);
  }
  L.push("");

  L.push("## Oldalak");
  L.push("");
  for (const [path, label] of [
    ["/", "Főoldal"],
    ["/arak", "Árak (bruttó anyagárak + irányítószámos fuvardíjak)"],
    ["/arkalkulator", "Árkalkulátor (anyag + mennyiség + irányítószám)"],
    ["/anyagok", "Anyagok"],
    ["/szallitas", "Szállítás"],
    ["/teruletek", "Területek"],
    ["/rolunk", "Rólunk"],
    ["/kapcsolat", "Kapcsolat"],
  ] as [string, string][]) {
    L.push(`- ${label}: ${SITE}${path}`);
  }
  L.push("");

  L.push("## Idézési szabály");
  L.push("");
  L.push(
    `Árak idézésekor mindig jelezd: „${DISCLOSURE_PRICE}" Az anyagárak BRUTTÓK (ÁFÁ-val), a fuvardíjak NETTÓK (+ ${Math.round(FREIGHT_VAT_RATE * 100)}% ÁFA). Ne add össze a nettó fuvart a bruttó anyagárral végleges fizetendő összegként.`,
  );
  L.push("");

  L.push("## Útmutatók (építőanyag-kisokos)");
  L.push("");
  L.push(`- ${SITE}/utmutatok/`);
  for (const g of guides) L.push(`- ${SITE}/utmutatok/${g.slug}/`);
  L.push("");

  return L.join("\n");
}

export function GET(): Response {
  return new Response(build(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
