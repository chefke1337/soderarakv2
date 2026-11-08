"use client";

import { useId, useState } from "react";
import { IconCheck } from "@/lib/ui";
import {
  applyDeliveryAddress,
  BILLING_FIELD_LABELS,
  copyWouldOverwrite,
  EMPTY_BILLING,
  isBillingStarted,
  type BillingFieldKey,
  type BillingState,
  type DeliveryAddress,
} from "@/lib/billing-form";
import type { CustomerType } from "@/lib/order";

/**
 * „Számlázási adatok" — OPCIONÁLIS blokk az ajánlatkérés 5. lépésében.
 *
 * - Valódi rádiógomb-csoport (fieldset + legend); a kiválasztott kártyát
 *   pipa-ikon és „Kiválasztva" felirat is jelzi, nem csak a szín.
 * - A vevőtípushoz nem tartozó mezők NINCSENEK a DOM-ban (nem fókuszálhatók,
 *   nem validálódnak, nem kerülnek a beküldésbe).
 * - Címmásolás: egyszeri MÁSOLÁS (nem összekapcsolás); kitöltött mezőket csak
 *   megerősítés után ír felül; nevet és adószámot soha nem érint.
 * - A kapcsolattartó nevét csak üres számlázási név esetén, gombnyomásra veszi át.
 */
export default function BillingFields({
  value,
  onChange,
  errors,
  showErrors,
  touched,
  onTouch,
  ids,
  contactName,
  delivery,
  deliveryLabel,
}: {
  value: BillingState;
  onChange: (next: BillingState) => void;
  errors: Partial<Record<BillingFieldKey, string>>;
  /** Beküldési kísérlet után minden hiba látszik; előtte csak az elhagyott mezőké. */
  showErrors: boolean;
  touched: Partial<Record<BillingFieldKey, boolean>>;
  onTouch: (field: BillingFieldKey) => void;
  ids: Record<BillingFieldKey, string> & { group: string };
  contactName: string;
  delivery: DeliveryAddress | null;
  deliveryLabel: string;
}) {
  const uid = useId();
  const [extraOpen, setExtraOpen] = useState(false);
  const [confirmCopy, setConfirmCopy] = useState(false);
  const [status, setStatus] = useState("");

  const type = value.customerType;
  const started = isBillingStarted(value);
  const set = (patch: Partial<BillingState>) => onChange({ ...value, ...patch });
  const visibleError = (k: BillingFieldKey) => ((showErrors || touched[k]) && started ? errors[k] : undefined);
  const missing = (Object.keys(errors) as BillingFieldKey[]).filter((k) => errors[k]);
  const showExtra = extraOpen || value.additionalAddress.trim() !== "";
  const nameKey = type === "business" ? "businessName" : "privateName";
  const nameValue = type === "business" ? value.businessName : value.privateName;

  function chooseType(t: CustomerType) {
    setStatus("");
    set({ customerType: t });
  }

  function doCopy() {
    if (!delivery) return;
    onChange(applyDeliveryAddress(value, delivery));
    setConfirmCopy(false);
    setStatus(
      "A szállítási címet átmásoltuk. A mezők ezután külön szerkeszthetők — a szállítási cím későbbi módosítása nem írja át őket.",
    );
  }

  function requestCopy() {
    if (!delivery) return;
    if (copyWouldOverwrite(value, delivery)) {
      setConfirmCopy(true);
      setStatus("");
    } else {
      doCopy();
    }
  }

  function clearAll() {
    onChange({ ...EMPTY_BILLING });
    setExtraOpen(false);
    setConfirmCopy(false);
    setStatus("A számlázási adatokat töröltük. A blokk kitöltése nem kötelező.");
  }

  const options: { t: CustomerType; title: string; desc: string }[] = [
    { t: "private", title: "Magánszemély", desc: "Számla a saját nevére és címére" },
    { t: "business", title: "Cég / egyéni vállalkozó", desc: "Számla cégnévre, adószámmal" },
  ];

  return (
    <section aria-labelledby={`${uid}-cim`} className="billing-card mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id={`${uid}-cim`} className="font-display text-heading-sm font-bold">
          Számlázási adatok
        </h3>
        <span className="billing-optional">Nem kötelező</span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-on-dark-muted">
        Ha már rendelkezésre állnak, itt megadhatja a későbbi számlázáshoz szükséges adatokat.
        Az ajánlatkéréshez nem szükségesek, és megadásuk nem indít számlázást.
      </p>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">Vevő típusa</legend>
        <div id={ids.group} className="mt-2 grid gap-2.5 sm:grid-cols-2">
          {options.map((o) => {
            const active = type === o.t;
            return (
              <label key={o.t} className="billing-choice" data-active={active}>
                <input
                  type="radio"
                  name={`${uid}-vevotipus`}
                  value={o.t}
                  checked={active}
                  onChange={() => chooseType(o.t)}
                  className="billing-radio"
                />
                <span className="billing-choice-mark" aria-hidden="true">
                  {active && <IconCheck size={14} />}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{o.title}</span>
                  <span className="block text-xs leading-snug text-on-dark-muted">{o.desc}</span>
                  {active && (
                    <span aria-hidden="true" className="billing-choice-state">
                      Kiválasztva
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {type && (
        <div className="billing-fields mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <BField
              id={ids.name}
              label={type === "business" ? "Cégnév / számlázási név" : "Számlázási név"}
              value={nameValue}
              onChange={(v) => set({ [nameKey]: v } as Partial<BillingState>)}
              onBlur={() => onTouch("name")}
              error={visibleError("name")}
              autoComplete={type === "business" ? "billing organization" : "billing name"}
              hint={
                type === "business"
                  ? "A cég vagy az egyéni vállalkozó hivatalos számlázási neve — cégforma nem kötelező."
                  : "A számlán szereplő név. Lehet eltérő a kapcsolattartó nevétől."
              }
              maxLength={160}
            />
            {type === "private" && value.privateName.trim() === "" && contactName.trim().length >= 2 && (
              <button
                type="button"
                className="billing-link mt-1.5"
                onClick={() => set({ privateName: contactName.trim() })}
              >
                A kapcsolattartó nevének átvétele ({contactName.trim()})
              </button>
            )}
          </div>

          {type === "business" && (
            <BField
              id={ids.taxNumber}
              label="Adószám"
              value={value.taxNumber}
              onChange={(v) => set({ taxNumber: v })}
              onBlur={() => onTouch("taxNumber")}
              error={visibleError("taxNumber")}
              autoComplete="off"
              inputMode="numeric"
              placeholder="12345678-1-12"
              hint="Belföldi adószám, 11 számjegy. Csak a formátumát ellenőrizzük — ez nem igazolja az adószám érvényességét."
              maxLength={20}
              numeric
            />
          )}

          <BField
            id={ids.country}
            label="Ország"
            value={value.country}
            onChange={(v) => set({ country: v })}
            onBlur={() => onTouch("country")}
            error={visibleError("country")}
            autoComplete="billing country-name"
            maxLength={60}
          />

          <div className="sm:col-span-2">
            <div className="billing-copy">
              {delivery ? (
                <>
                  <button type="button" className="billing-link" onClick={requestCopy}>
                    A számlázási cím megegyezik a szállítási címmel — átmásolom
                  </button>
                  <p className="mt-0.5 text-xs text-on-dark-muted">
                    Egyszeri másolás innen: <span className="num">{deliveryLabel}</span> —{" "}
                    {type === "business" ? "a cégnév és az adószám nem változik." : "a számlázási név nem változik."}
                  </p>
                </>
              ) : null}
              {confirmCopy && (
                <div role="alert" className="billing-confirm mt-2">
                  <p className="text-sm">
                    A számlázási cím mezői már ki vannak töltve. Felülírjuk őket a szállítási címmel?
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="btn btn-cream min-h-11" onClick={doCopy}>
                      Felülírás
                    </button>
                    <button type="button" className="btn btn-outline-cream min-h-11" onClick={() => setConfirmCopy(false)}>
                      Mégse
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
            <BField
              id={ids.postalCode}
              label="Irányítószám"
              value={value.postalCode}
              onChange={(v) => set({ postalCode: v })}
              onBlur={() => onTouch("postalCode")}
              error={visibleError("postalCode")}
              autoComplete="billing postal-code"
              inputMode="numeric"
              maxLength={10}
              numeric
            />
            <BField
              id={ids.city}
              label="Település"
              value={value.city}
              onChange={(v) => set({ city: v })}
              onBlur={() => onTouch("city")}
              error={visibleError("city")}
              autoComplete="billing address-level2"
              maxLength={80}
            />
          </div>

          <div className="sm:col-span-2">
            <BField
              id={ids.streetAddress}
              label="Közterület és házszám"
              value={value.streetAddress}
              onChange={(v) => set({ streetAddress: v })}
              onBlur={() => onTouch("streetAddress")}
              error={visibleError("streetAddress")}
              autoComplete="billing address-line1"
              placeholder="pl. Fő utca 12."
              maxLength={160}
            />
          </div>

          <div className="sm:col-span-2">
            {showExtra ? (
              <BField
                id={ids.additionalAddress}
                label={type === "business" ? "További címadatok (nem kötelező)" : "Épület, lépcsőház, emelet, ajtó (nem kötelező)"}
                value={value.additionalAddress}
                onChange={(v) => set({ additionalAddress: v })}
                onBlur={() => onTouch("additionalAddress")}
                error={visibleError("additionalAddress")}
                autoComplete="billing address-line2"
                maxLength={120}
              />
            ) : (
              <button
                type="button"
                className="billing-link"
                onClick={() => {
                  setExtraOpen(true);
                  requestAnimationFrame(() => document.getElementById(ids.additionalAddress)?.focus());
                }}
              >
                + {type === "business" ? "További címadatok megadása" : "Épület, lépcsőház, emelet, ajtó megadása"}
              </button>
            )}
          </div>
        </div>
      )}

      {started && showErrors && missing.length > 0 && type && (
        <div role="alert" className="billing-summary mt-4">
          <p className="text-sm font-semibold">
            A számlázási adatok hiányosak:{" "}
            {missing.map((k) => BILLING_FIELD_LABELS[k](type)).join(", ")}.
          </p>
          <p className="mt-1 text-sm">
            Egészítse ki őket, vagy ha most nem szeretne számlázási adatot megadni, törölje a blokkot —
            az ajánlatkérés nélküle is elküldhető.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {(started || type) && (
          <button type="button" className="billing-link" onClick={clearAll}>
            Számlázási adatok törlése
          </button>
        )}
        <p aria-live="polite" className="text-xs text-on-dark-muted empty:hidden">
          {status}
        </p>
      </div>
    </section>
  );
}

function BField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  inputMode,
  placeholder,
  hint,
  maxLength,
  numeric = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  autoComplete: string;
  inputMode?: "text" | "numeric";
  placeholder?: string;
  hint?: string;
  maxLength: number;
  numeric?: boolean;
}) {
  const describedBy = [error ? `${id}-hiba` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ");
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={maxLength}
        spellCheck={false}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        className={`billing-input${numeric ? " num" : ""}`}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-on-dark-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-hiba`} role="alert" className="billing-error mt-1 text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
