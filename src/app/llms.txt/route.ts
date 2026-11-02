/**
 * llms.txt — a KÖZPONTI adatforrásból generálva.
 *
 * A V2-ben ez kézzel írt statikus fájl volt (`public/llms.txt`), ami a
 * harmadik, egymástól eltérő árlista lett. V3-ban build-time generálódik a
 * `src/content/catalog.ts` + `src/content/freight.ts` adataiból, így nem
 * tud elcsúszni a felülettől.
 */

import {
  budapestDistricts,
  company,
  DISCLOSURE_GROSS,
  DISCLOSURE_PRICE,
  FREIGHT_PUBLIC_NOTICE,
  FREIGHT_VAT_RATE,
  guides,
  itemWash,
  materialGroups,
  MIN_ORDER_M3,
  MULTI_TRIP_NOTICE,
  PERMIT_NOTICE,
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
        const marks = [i.qualifier, itemWash(i)?.label, i.unclassified ? "osztályozatlan" : null]
          .filter(Boolean)
          .join(", ");
        return `${i.name}${marks ? ` [${marks}]` : ""} ${price}`;
      })
      .join("; ");
    L.push(`- ${g.name}${g.washSummary ? ` (${g.washSummary.replace(/\.$/, "")})` : g.washed ? ` (${g.washed.label})` : ""}: ${items}`);
  }
  L.push("");
  L.push(
    "- Mosottság: a rostált sóderfrakciók (0–4…0–24) és az osztályozott kavicsok jó minőségű, mosott anyagok. A töltősóder NEM mosott. A kulé egyszeri mosáson átesett, de nem olyan tiszta, mint az osztályozott kavicsok (méret szerint osztályozatlan, kb. 32–125 mm).",
  );
  L.push("");

  L.push("## Szállítási díj");
  L.push("");
  L.push(`- ${FREIGHT_PUBLIC_NOTICE}`);
  L.push("- A szállítási díjat az árkalkulátor a szállítási cím és a mennyiség alapján számolja ki, és külön mutatja a nettó díjat, az ÁFÁ-t és a teljes bruttó tájékoztató összeget.");
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
  L.push(`- ${DISTRICT_AREAS_SOURCE}`);
  for (const d of budapestDistrictAreas) {
    L.push(`- ${romanDistrict(d.id)} kerület${d.name ? ` (${d.name})` : ""}: ${d.areas.join(", ")}`);
  }
  L.push("");

  L.push("## Oldalak");
  L.push("");
  for (const [path, label] of [
    ["/", "Főoldal"],
    ["/arak", "Árak (bruttó anyagárak)"],
    ["/arkalkulator", "Árkalkulátor (anyag + mennyiség + szállítási cím)"],
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
