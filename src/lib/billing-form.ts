/**
 * Számlázási adatok — űrlapállapot és beküldési adat (kliens).
 *
 * - Az állapot CSAK a komponens memóriájában él (nincs localStorage /
 *   sessionStorage): űrlaphiba esetén megmarad, oldalelhagyáskor eltűnik.
 * - A beküldésbe csak a kiválasztott vevőtípushoz tartozó mezők kerülnek;
 *   magánszemélynél adószám SOHA (akkor sem, ha korábban cégként kitöltötték).
 * - Ha a blokkban a vevőtípuson és az alapértelmezett országon kívül semmi
 *   nincs kitöltve, a blokk „nincs megadva" → nem kerül a beküldésbe.
 * - A validáció UGYANAZT a sémát futtatja, mint a szerver (src/lib/order.ts).
 */
import {
  billingSchema,
  DEFAULT_BILLING_COUNTRY,
  type BillingInput,
  type CustomerType,
} from "./order.ts";

export type BillingState = {
  customerType: CustomerType | "";
  /** Magánszemély számlázási neve (külön tárolva a cégnévtől, hogy vevőtípus-váltáskor ne keveredjen). */
  privateName: string;
  businessName: string;
  taxNumber: string;
  country: string;
  postalCode: string;
  city: string;
  streetAddress: string;
  additionalAddress: string;
};

export const EMPTY_BILLING: BillingState = {
  customerType: "",
  privateName: "",
  businessName: "",
  taxNumber: "",
  country: DEFAULT_BILLING_COUNTRY,
  postalCode: "",
  city: "",
  streetAddress: "",
  additionalAddress: "",
};

/** Mező-kulcs → a szerver/séma hibakulcsa. */
export const BILLING_ERROR_KEYS = {
  name: "billing.name",
  taxNumber: "billing.taxNumber",
  country: "billing.address.country",
  postalCode: "billing.address.postalCode",
  city: "billing.address.city",
  streetAddress: "billing.address.streetAddress",
  additionalAddress: "billing.address.additionalAddress",
} as const;
export type BillingFieldKey = keyof typeof BILLING_ERROR_KEYS;

/** A hiánylistában használt, emberi mezőnevek (sorrend = űrlapsorrend). */
export const BILLING_FIELD_LABELS: Record<BillingFieldKey, (t: CustomerType) => string> = {
  name: (t) => (t === "business" ? "cégnév / számlázási név" : "számlázási név"),
  taxNumber: () => "adószám",
  country: () => "ország",
  postalCode: () => "irányítószám",
  city: () => "település",
  streetAddress: () => "közterület és házszám",
  additionalAddress: () => "további címadat",
};

const nameOf = (s: BillingState) => (s.customerType === "business" ? s.businessName : s.privateName);

/** Kitöltött-e a blokk bármely RELEVÁNS mezője (a típusválasztás és az alapértelmezett ország nem számít). */
export function isBillingStarted(s: BillingState): boolean {
  if (!s.customerType) return false;
  const country = s.country.trim();
  return [
    nameOf(s),
    s.customerType === "business" ? s.taxNumber : "",
    country && country !== DEFAULT_BILLING_COUNTRY ? country : "",
    s.postalCode,
    s.city,
    s.streetAddress,
    s.additionalAddress,
  ].some((v) => v.trim() !== "");
}

/** Beküldendő adat: null, ha a blokk nincs megadva. Csak a releváns mezők. */
export function billingPayload(s: BillingState): BillingInput | null {
  if (!isBillingStarted(s) || !s.customerType) return null;
  return {
    customerType: s.customerType,
    name: nameOf(s).trim(),
    ...(s.customerType === "business" ? { taxNumber: s.taxNumber.trim() } : {}),
    address: {
      country: s.country.trim(),
      postalCode: s.postalCode.trim(),
      city: s.city.trim(),
      streetAddress: s.streetAddress.trim(),
      additionalAddress: s.additionalAddress.trim(),
    },
  };
}

/** Mezőhibák a közös sémából (üres objektum = rendben vagy nincs megadva). */
export function billingErrors(s: BillingState): Partial<Record<BillingFieldKey, string>> {
  const payload = billingPayload(s);
  if (!payload) return {};
  const parsed = billingSchema.safeParse(payload);
  if (parsed.success) return {};
  const out: Partial<Record<BillingFieldKey, string>> = {};
  for (const issue of parsed.error.issues) {
    const key = ["billing", ...issue.path].join(".");
    const field = (Object.keys(BILLING_ERROR_KEYS) as BillingFieldKey[]).find(
      (k) => BILLING_ERROR_KEYS[k] === key,
    );
    if (field && !out[field]) out[field] = issue.message;
  }
  return out;
}

/** A szállítási címből átmásolható mezők (csak cím — név és adószám nem). */
export type DeliveryAddress = { postalCode: string; city: string; streetAddress: string };

/** Van-e olyan kitöltött számlázási címmező, amelyet a másolás felülírna? */
export function copyWouldOverwrite(s: BillingState, d: DeliveryAddress): boolean {
  const pairs: [string, string][] = [
    [s.postalCode, d.postalCode],
    [s.city, d.city],
    [s.streetAddress, d.streetAddress],
  ];
  return (
    pairs.some(([cur, next]) => cur.trim() !== "" && cur.trim() !== next.trim()) ||
    (s.country.trim() !== "" && s.country.trim() !== DEFAULT_BILLING_COUNTRY)
  );
}

export function applyDeliveryAddress(s: BillingState, d: DeliveryAddress): BillingState {
  return {
    ...s,
    country: DEFAULT_BILLING_COUNTRY,
    postalCode: d.postalCode,
    city: d.city,
    streetAddress: d.streetAddress,
  };
}
