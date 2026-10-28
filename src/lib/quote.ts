/**
 * SÓDERÁRAK V3 — ÁRSZÁMÍTÁS (tiszta függvények, kliens és szerver közös forrása).
 *
 * KÉT KÜLÖNBÖZŐ ÁRTERMÉSZET:
 *  - Anyagár: BRUTTÓ Ft/m³ (ÁFÁ-val). Erre SOHA nem kerül még egyszer ÁFA.
 *  - Fuvardíj: NETTÓ Ft egy fuvarra. Ehhez jön a fuvar ÁFA
 *    (`FREIGHT_VAT_RATE`, központi konfiguráció).
 *
 * A teljes tájékoztató összeg = anyag bruttó részösszeg + fuvar BRUTTÓ díj.
 * Nettó fuvarösszeg SOHA nem adható közvetlenül a bruttó anyagárhoz
 * végleges fizetendő összegként.
 */

import { type MaterialItem } from "../content/catalog.ts";
import {
  FREIGHT_VAT_RATE,
  resolveFreight,
  type CastleAnswer,
  type FreightQuery,
  type FreightResult,
  needsCastleClearance,
} from "../content/freight.ts";

export type MaterialLine = {
  /** Bruttó egységár Ft/m³ (ÁFÁ-val), null = egyeztetés után. */
  unitGross: number | null;
  m3: number;
  /** Bruttó részösszeg Ft, null = egyeztetés után. */
  subtotalGross: number | null;
};

export type FreightLine = {
  /** Nettó fuvardíj Ft. */
  net: number;
  /** Fuvar ÁFA Ft. */
  vat: number;
  /** Bruttó fuvardíj Ft. */
  gross: number;
  /** Alkalmazott ÁFA-kulcs (pl. 0.27). */
  vatRate: number;
  bandLabel: string;
  profileLabel: string;
};

export type Quote = {
  material: MaterialLine;
  /** null, ha a fuvardíj még nem meghatározható (egyedi egyeztetés). */
  freight: FreightLine | null;
  /**
   * Teljes bruttó tájékoztató összeg (anyag bruttó + fuvar bruttó).
   * null, ha bármelyik összetevő ismeretlen, vagy ha ismeretlen
   * engedélydíj miatt nem adható garantált végösszeg.
   */
  totalGross: number | null;
  /** A fuvar feloldásának nyers eredménye (hibaüzenethez, UI-állapothoz). */
  freightResult: FreightResult;
  /** true: a Vár területe miatt külön engedély-egyeztetés kell. */
  needsPermitClearance: boolean;
  /** Miért nincs teljes végösszeg. */
  totalBlockedReason: null | "material-quote" | "freight-quote" | "permit-unknown" | "incomplete";
};

/** Bankári kerekítés nélkül, forintra kerekítve (0,5 Ft felfelé). */
function roundFt(n: number): number {
  return Math.round(n);
}

export function freightVat(net: number, vatRate = FREIGHT_VAT_RATE): number {
  return roundFt(net * vatRate);
}

export function freightGross(net: number, vatRate = FREIGHT_VAT_RATE): number {
  return net + freightVat(net, vatRate);
}

export type QuoteInput = {
  item: Pick<MaterialItem, "priceGross"> | null | undefined;
  m3: number;
  freight: FreightQuery;
  castleAnswer?: CastleAnswer;
};

export function computeQuote(input: QuoteInput): Quote {
  const { item, m3, freight } = input;
  const unitGross = item?.priceGross ?? null;
  const material: MaterialLine = {
    unitGross,
    m3,
    // Bruttó egységár × mennyiség — ÁFA NEM adódik hozzá újra.
    subtotalGross: unitGross === null ? null : roundFt(unitGross * m3),
  };

  const freightResult = resolveFreight(freight);

  const needsPermitClearance = needsCastleClearance(
    freight.districtId ?? null,
    input.castleAnswer ?? "",
  );

  let line: FreightLine | null = null;
  if (freightResult.kind === "ok") {
    const net = freightResult.netFee;
    line = {
      net,
      vat: freightVat(net),
      gross: freightGross(net),
      vatRate: FREIGHT_VAT_RATE,
      bandLabel: freightResult.bandLabel,
      profileLabel: freightResult.profile.label,
    };
  }

  let totalBlockedReason: Quote["totalBlockedReason"] = null;
  if (material.subtotalGross === null) totalBlockedReason = "material-quote";
  else if (freightResult.kind === "incomplete") totalBlockedReason = "incomplete";
  else if (!line) totalBlockedReason = "freight-quote";
  else if (needsPermitClearance) totalBlockedReason = "permit-unknown";

  return {
    material,
    freight: line,
    totalGross:
      totalBlockedReason === null && line && material.subtotalGross !== null
        ? material.subtotalGross + line.gross
        : null,
    freightResult,
    needsPermitClearance,
    totalBlockedReason,
  };
}

/** Egysoros, emberi összefoglaló az árösszesítőhöz / e-mailhez. */
export function quoteSummaryLines(q: Quote, fmt: (n: number) => string): string[] {
  const rows: string[] = [];
  rows.push(
    q.material.unitGross === null
      ? "Anyag bruttó egységár: egyeztetés után"
      : `Anyag bruttó egységár: ${fmt(q.material.unitGross)}/m³`,
  );
  rows.push(`Mennyiség: ${q.material.m3} m³`);
  rows.push(
    q.material.subtotalGross === null
      ? "Anyag bruttó részösszeg: egyeztetés után"
      : `Anyag bruttó részösszeg: ${fmt(q.material.subtotalGross)}`,
  );
  if (q.freight) {
    rows.push(`Fuvar nettó díj (${q.freight.bandLabel}): ${fmt(q.freight.net)}`);
    rows.push(`Fuvar ÁFA (${Math.round(q.freight.vatRate * 100)}%): ${fmt(q.freight.vat)}`);
    rows.push(`Fuvar bruttó díj: ${fmt(q.freight.gross)}`);
  } else {
    rows.push("Fuvar díja: egyedi egyeztetés szükséges");
  }
  if (q.needsPermitClearance) {
    rows.push(
      "Behajtási engedély (Vár területe): külön egyeztetés, az engedély díja még nem ismert.",
    );
  }
  rows.push(
    q.totalGross === null
      ? "Teljes bruttó összeg: egyeztetés után (a fenti ismert tételek tájékoztató jellegűek)"
      : `Teljes bruttó tájékoztató összeg: ${fmt(q.totalGross)}`,
  );
  return rows;
}
