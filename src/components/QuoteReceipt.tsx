"use client";

import {
  DISCLOSURE_GROSS,
  DISCLOSURE_PRICE,
  MULTI_TRIP_NOTICE,
  UNSUPPORTED_NOTICE,
  type MaterialItem,
} from "@/content/site";
import { formatFt, IconAlert } from "@/lib/ui";
import type { Quote } from "@/lib/quote";

/**
 * Árösszesítő — a V3 „szelvény".
 *
 * Mindig KÜLÖN sorban jelenik meg:
 *  anyag bruttó egységár · mennyiség · anyag bruttó részösszeg ·
 *  fuvar nettó · fuvar ÁFA · fuvar bruttó · teljes bruttó.
 *
 * A bruttó anyagárra nem kerül még egyszer ÁFA; a nettó fuvarösszeg nem
 * adódik közvetlenül a bruttó anyagárhoz végösszegként.
 */
export default function QuoteReceipt({
  item,
  quote,
  overLimit,
}: {
  item: MaterialItem | undefined;
  quote: Quote;
  /** true: a felhasználó 10 m³ felett kér ajánlatot. */
  overLimit: boolean;
}) {
  const { material, freight, freightResult } = quote;

  return (
    <div className="receipt overflow-hidden rounded-[var(--radius-lg)] bg-surface shadow-pop">
      <div aria-hidden="true" className="flex h-1.5">
        <span className="flex-1 bg-mat-homok" />
        <span className="flex-1 bg-mat-soder" />
        <span className="flex-1 bg-accent" />
        <span className="flex-1 bg-mat-fold" />
      </div>

      <div className="px-5 pt-5 pb-6 md:px-7 md:pt-6">
        <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border-strong pb-3">
          <h2 id="osszesito-cim" className="font-display text-heading-sm font-bold">
            Árösszesítő
          </h2>
          <span className="text-xs font-semibold tracking-wide text-text-muted uppercase">
            Tájékoztató
          </span>
        </div>

        {/* ── Anyag: BRUTTÓ ── */}
        <section aria-labelledby="osszesito-anyag" className="mt-4">
          <h3
            id="osszesito-anyag"
            className="text-[0.6875rem] font-bold tracking-[0.14em] text-text-muted uppercase"
          >
            Anyag — bruttó
          </h3>
          <dl className="num mt-2 space-y-2 text-[0.9375rem]">
            <Row
              label={item ? `${item.name} bruttó egységár` : "Bruttó egységár"}
              value={material.unitGross === null ? null : `${formatFt(material.unitGross)}/m³`}
            />
            <Row label="Mennyiség" value={`${material.m3} m³`} />
            <Row
              label="Anyag bruttó részösszeg"
              value={material.subtotalGross === null ? null : formatFt(material.subtotalGross)}
              emphasis
            />
          </dl>
        </section>

        {/* ── Fuvar: NETTÓ + ÁFA + BRUTTÓ ── */}
        <section aria-labelledby="osszesito-fuvar" className="mt-5">
          <h3
            id="osszesito-fuvar"
            className="text-[0.6875rem] font-bold tracking-[0.14em] text-text-muted uppercase"
          >
            Fuvar — nettó + ÁFA
          </h3>
          {freight ? (
            <dl className="num mt-2 space-y-2 text-[0.9375rem]">
              <Row
                label={`Fuvar nettó díj (${freight.bandLabel})`}
                value={formatFt(freight.net)}
              />
              <Row
                label={`Fuvar ÁFA (${Math.round(freight.vatRate * 100)}%)`}
                value={formatFt(freight.vat)}
              />
              <Row label="Fuvar bruttó díj" value={formatFt(freight.gross)} emphasis />
            </dl>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              {freightResult.kind === "incomplete"
                ? freightResult.missing === "postalCode"
                  ? "Adja meg az irányítószámot a fuvardíj kiszámításához."
                  : freightResult.missing === "district"
                    ? "Válassza ki a kerületet, majd adja meg az irányítószámot."
                    : "Válassza ki a települést."
                : "A fuvar díja ehhez a címhez vagy mennyiséghez egyedi egyeztetést igényel."}
            </p>
          )}
        </section>

        {/* ── Teljes bruttó ── */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="mt-5 border-t-2 border-text pt-4"
        >
          <p className="text-sm font-semibold">Teljes bruttó tájékoztató összeg</p>
          {quote.totalGross !== null ? (
            <p
              key={quote.totalGross}
              className="num swap-in mt-1 font-display text-[1.75rem] leading-tight font-bold tracking-tight whitespace-nowrap text-accent-deep min-[400px]:text-[2.125rem] md:text-[2.375rem]"
            >
              {formatFt(quote.totalGross)}
            </p>
          ) : (
            <p className="mt-1 text-[0.9375rem] leading-relaxed font-medium text-text-muted">
              {blockedLabel(quote.totalBlockedReason)}
            </p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            Anyag bruttó részösszeg + fuvar bruttó díj. A bruttó anyagárra nem
            kerül még egyszer ÁFA.
          </p>
        </div>

        {/* ── Állapotjelzések ── */}
        <div className="mt-4 space-y-2.5">
          {overLimit && <Notice tone="info">{MULTI_TRIP_NOTICE}</Notice>}

          {freightResult.kind === "unsupported-postal" && (
            <Notice tone="warn">
              {UNSUPPORTED_NOTICE} A {freightResult.postalCode} irányítószámhoz nincs
              feltüntetett fuvardíjunk.
            </Notice>
          )}

          {freightResult.kind === "mismatch" && (
            <Notice tone="warn">
              A {freightResult.postalCode} irányítószám nem a kiválasztott területhez
              ({freightResult.selectedLabel}) tartozik
              {freightResult.actual ? ` — ez a kód a(z) ${freightResult.actual.label} díjprofilhoz tartozik` : ""}.
              Kérjük, javítsa a kerületet vagy az irányítószámot. Automatikusan nem
              választunk másik díjat.
            </Notice>
          )}

          {freightResult.kind === "invalid-postal" && (
            <Notice tone="warn">Az irányítószám négy számjegy (például 1221).</Notice>
          )}

          {freightResult.kind === "quote-required" && (
            <Notice tone="warn">
              {freightResult.reason === "above-single-trip"
                ? MULTI_TRIP_NOTICE
                : `Ehhez a kerülethez ${freightResult.profileMaxM3} m³ felett nincs feltüntetett fuvardíj — egyedi egyeztetés szükséges. Kitalált árat nem mutatunk.`}
            </Notice>
          )}

          {quote.needsPermitClearance && (
            <Notice tone="warn">
              <strong className="font-semibold">Vár területe:</strong> külön behajtási
              engedély és előzetes egyeztetés szükséges. Az engedély díja még nem
              ismert, ezért garantált végösszeget nem tudunk mutatni — a fenti ismert
              tételek tájékoztató jellegűek.
            </Notice>
          )}
        </div>

        <p className="mt-4 rounded-sm bg-surface-muted px-3 py-2.5 text-xs leading-relaxed font-medium text-text">
          {DISCLOSURE_GROSS} {DISCLOSURE_PRICE}
        </p>
      </div>
    </div>
  );
}

function blockedLabel(reason: Quote["totalBlockedReason"]): string {
  switch (reason) {
    case "material-quote":
      return "Az anyag árát egyeztetés után adjuk, ezért teljes összeget most nem mutatunk.";
    case "freight-quote":
      return "A fuvar díja egyedi egyeztetést igényel, ezért teljes összeget most nem mutatunk.";
    case "permit-unknown":
      return "Az engedély díja még nem ismert, ezért garantált végösszeget nem mutatunk.";
    case "incomplete":
    default:
      return "Adja meg az irányítószámot a teljes összeghez.";
  }
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string | null;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${emphasis ? "border-t border-border/70 pt-2" : ""}`}
    >
      <dt className={emphasis ? "font-medium text-text" : "text-text-muted"}>{label}</dt>
      <dd
        className={`text-right whitespace-nowrap ${emphasis ? "font-display text-[1.0625rem] font-bold" : "font-semibold"}`}
      >
        {value ?? <span className="font-sans text-sm font-medium text-text-muted">egyeztetés után</span>}
      </dd>
    </div>
  );
}

function Notice({ tone, children }: { tone: "info" | "warn"; children: React.ReactNode }) {
  return (
    <p
      role="status"
      className={`flex gap-2.5 rounded-sm border px-3 py-2.5 text-xs leading-relaxed ${
        tone === "warn"
          ? "border-accent/45 bg-brand-soft text-accent-deep"
          : "border-border-strong bg-surface-muted text-text"
      }`}
    >
      <IconAlert size={15} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}
