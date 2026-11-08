/**
 * SÓDERÁRAK V3 — RENDELÉSI IGÉNY: megosztott séma és validáció.
 *
 * Ez a modul kliens- és szerveroldalon is fut. A séma a HATÁR: a szerver
 * ugyanezt futtatja le, és az összeget MINDIG újraszámolja a központi
 * katalógusból — a kliens által küldött összeget soha nem fogadja el
 * hitelesnek (csak eltérés-jelzésre használja).
 */

import { z } from "zod";
import { findMaterial, PRICING_VERSION } from "../content/catalog.ts";
import {
  SINGLE_TRIP_MAX_M3,
  MIN_ORDER_M3,
  normalizePostalCode,
} from "../content/freight.ts";
import { computeQuote, type Quote } from "./quote.ts";

/** Egyszerű, de valódi e-mail-forma: helyi rész @ domain . TLD */
const EMAIL_RE =
  /^[^\s@,;:<>()[\]\\"]+@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export function isValidEmail(value: string): boolean {
  const v = value.trim();
  return v.length >= 6 && v.length <= 254 && EMAIL_RE.test(v);
}

/** Magyar telefonszám: opcionális +36/06 előtag, 7–15 számjegy. */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return (
    /^[+\d][\d\s\-().]{6,19}$/.test(value.trim()) &&
    digits.length >= 7 &&
    digits.length <= 15
  );
}

/**
 * Fejléc-injekció és vezérlőkarakter-szűrés. Soha ne kerüljön CR/LF
 * felhasználói adat e-mail-fejlécbe vagy egysoros mezőbe.
 * A karakterosztályokat kódpont szerint építjük, hogy az escape-sorozatok
 * ne sérülhessenek szövegtranszformációk során.
 */
const ALL_CONTROL = new RegExp("[\\u0000-\\u001f\\u007f\\u2028\\u2029]", "g");
/** Ugyanaz, de a sortörést (LF, U+000A) megtartja. */
const CONTROL_KEEP_LF = new RegExp(
  "[\\u0000-\\u0009\\u000b-\\u001f\\u007f\\u2028\\u2029]",
  "g",
);

export function sanitizeLine(value: string, maxLength = 200): string {
  return value
    .replace(ALL_CONTROL, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Többsoros mező: a sortörés megmarad, a vezérlőkarakterek nem. */
export function sanitizeBlock(value: string, maxLength = 2000): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_KEEP_LF, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export const castleAnswerSchema = z.enum(["", "igen", "nem", "nem-tudom"]);

/* ───────────────────── Számlázási adatok (opcionális blokk) ─────────────────────
 * 2026-11-08 — lásd docs/decisions.md („Számlázási adatok").
 * - Az egész blokk OPCIONÁLIS: ajánlatkéréshez nem kötelező (üzleti döntés,
 *   nem jogi kötelezettség — a vevőadatok a SZÁMLA kiállításához kellenek).
 * - Ha a blokk szerepel a beküldésben, akkor legyen teljes (név + cím, cégnél
 *   adószám is), különben a feldolgozó nem tud mit kezdeni vele.
 * - Magánszemélytől adóazonosító jelet NEM kérünk (NAV: nem kell a számlán).
 * - Az adószám-formátum ellenőrzése NEM bizonyítja az adószám érvényességét. */

export const CUSTOMER_TYPES = ["private", "business"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];
export const DEFAULT_BILLING_COUNTRY = "Magyarország";

/** Magyarország-e a megadott ország (kis-/nagybetű és néhány gyakori írásmód). */
export function isHungary(country: string): boolean {
  const c = country.trim().toLowerCase();
  return c === "magyarország" || c === "magyarorszag" || c === "hungary" || c === "hu";
}

/** Belföldi adószám alakja: 8 számjegyű törzsszám – 1 jegyű áfakód (1–5) – 2 jegyű területi kód. */
const HU_TAX_RE = /^(\d{8})-?([1-5])-?(\d{2})$/;

/** Csak FORMAI ellenőrzés: nem igazolja, hogy az adószám létezik vagy érvényes. */
export function isHuTaxNumberShape(value: string): boolean {
  return HU_TAX_RE.test(value.replace(/\s+/g, ""));
}

/** „12345678123" / „12345678 1 23" → „12345678-1-23" (más alakot változatlanul hagy). */
export function normalizeHuTaxNumber(value: string): string {
  const m = value.replace(/\s+/g, "").match(HU_TAX_RE);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : value.trim();
}

const compact = (v: string) => v.replace(/\s+/g, "");

/** Külföldi adóazonosító: csak hossz és karakterkészlet (nincs országonkénti szabály). */
const FOREIGN_TAX_RE = /^[A-Za-z0-9][A-Za-z0-9.\-/]{2,19}$/;

export const billingAddressSchema = z.object({
  country: z.string().trim().min(2, "Kérjük, adja meg az országot.").max(60),
  postalCode: z.string().trim().min(3, "Kérjük, adja meg az irányítószámot.").max(10),
  city: z.string().trim().min(2, "Kérjük, adja meg a települést.").max(80),
  streetAddress: z
    .string()
    .trim()
    .min(3, "Kérjük, adja meg a közterületet és a házszámot.")
    .max(160),
  additionalAddress: z.string().trim().max(120).optional().default(""),
});

export const billingSchema = z
  .object({
    customerType: z.enum(CUSTOMER_TYPES, { message: "Kérjük, válassza ki a vevő típusát." }),
    name: z.string().trim().min(2, "Kérjük, adja meg a számlázási nevet.").max(160),
    taxNumber: z.string().trim().max(20).optional().default(""),
    address: billingAddressSchema,
  })
  .superRefine((b, ctx) => {
    const hu = isHungary(b.address.country);
    if (hu && !/^\d{4}$/.test(b.address.postalCode)) {
      ctx.addIssue({
        code: "custom",
        path: ["address", "postalCode"],
        message: "A magyar irányítószám négy számjegy.",
      });
    }
    if (b.customerType === "business") {
      if (!b.taxNumber) {
        ctx.addIssue({ code: "custom", path: ["taxNumber"], message: "Kérjük, adja meg az adószámot." });
      } else if (hu ? !isHuTaxNumberShape(b.taxNumber) : !FOREIGN_TAX_RE.test(compact(b.taxNumber))) {
        ctx.addIssue({
          code: "custom",
          path: ["taxNumber"],
          message: hu
            ? "Az adószám formátuma: 12345678-1-12 (11 számjegy)."
            : "Kérjük, ellenőrizze az adóazonosítót.",
        });
      }
    }
  })
  .transform((b) => ({
    ...b,
    // Magánszemélynél adószám SOHA nem kerül tovább (akkor sem, ha a kliens küldené).
    taxNumber:
      b.customerType === "business"
        ? isHungary(b.address.country)
          ? normalizeHuTaxNumber(b.taxNumber)
          : compact(b.taxNumber)
        : "",
  }));

export type Billing = z.output<typeof billingSchema>;
export type BillingInput = z.input<typeof billingSchema>;

export const orderRequestSchema = z.object({
  /* ── Kapcsolat ── */
  name: z.string().trim().min(2, "Kérjük, adja meg a nevét.").max(120),
  email: z
    .string()
    .trim()
    .max(254)
    .refine(isValidEmail, "Kérjük, érvényes e-mail-címet adjon meg."),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine(isValidPhone, "Kérjük, érvényes telefonszámot adjon meg."),

  /* ── Anyag és mennyiség ── */
  materialSlug: z.string().trim().min(1).max(80),
  m3: z
    .number()
    .int("A mennyiséget egész köbméterben kérjük.")
    .min(MIN_ORDER_M3)
    .max(SINGLE_TRIP_MAX_M3),

  /* ── Cím ── */
  municipalityId: z.enum(["budapest", "erd"]),
  districtId: z.number().int().min(1).max(23).nullable().optional(),
  postalCode: z
    .string()
    .trim()
    .transform(normalizePostalCode)
    .refine((v) => /^\d{4}$/.test(v), "Az irányítószám négy számjegy."),
  address: z.string().trim().min(4, "Kérjük, adja meg a szállítási címet.").max(240),

  /* ── Számlázási adatok (opcionális; a szállítási címtől KÜLÖN) ── */
  billing: billingSchema.nullable().optional(),

  /* ── Egyéb ── */
  preferredDate: z.string().trim().max(40).optional().default(""),
  castleAnswer: castleAnswerSchema.optional().default(""),
  note: z.string().trim().max(2000).optional().default(""),

  /** Rejtett „csapda" mező (spam ellen): embernek üresen kell maradnia. */
  website: z.string().max(200).optional().default(""),

  /* ── Metaadat ── */
  pricingVersion: z.string().trim().max(40),
  /** A kliensen megjelenített teljes bruttó összeg — CSAK eltérés-jelzésre. */
  clientTotalGross: z.number().int().nonnegative().nullable().optional(),
  /** Dupla beküldés kiszűrése: ugyanaz a kulcs másodszor nem küld e-mailt. */
  idempotencyKey: z.string().trim().min(8).max(80),
  /** Adatkezelési tájékoztató elfogadása. */
  privacyAccepted: z.literal(true, {
    message: "Az adatkezelési tájékoztató elfogadása szükséges.",
  }),
});

export type OrderRequest = z.infer<typeof orderRequestSchema>;
export type OrderRequestInput = z.input<typeof orderRequestSchema>;

/** A Budapest → kerület kötelezőség a sémán kívüli, összefüggő szabály. */
export function validateOrderRequest(
  raw: unknown,
): { ok: true; value: OrderRequest } | { ok: false; errors: Record<string, string> } {
  const parsed = orderRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }
  const value = parsed.data;
  if (value.municipalityId === "budapest" && !value.districtId) {
    return { ok: false, errors: { districtId: "Budapest esetén a kerület megadása kötelező." } };
  }
  if (!findMaterial(value.materialSlug)) {
    return { ok: false, errors: { materialSlug: "Ismeretlen anyag." } };
  }
  return { ok: true, value };
}

/**
 * HITELES újraszámolás a központi adatforrásból. A szerver EZT használja,
 * nem a kliens által küldött összeget.
 */
export function recomputeOrderQuote(value: OrderRequest): Quote {
  const item = findMaterial(value.materialSlug) ?? null;
  return computeQuote({
    item,
    m3: value.m3,
    freight: {
      municipalityId: value.municipalityId,
      districtId: value.districtId ?? null,
      postalCode: value.postalCode,
      m3: value.m3,
    },
    castleAnswer: value.castleAnswer,
  });
}

/** Eltér-e a kliens által mutatott összeg a hitelestől? (Csak jelzés.) */
export function clientTotalMismatch(value: OrderRequest, quote: Quote): boolean {
  if (value.clientTotalGross === null || value.clientTotalGross === undefined) return false;
  return value.clientTotalGross !== quote.totalGross;
}

/** A beküldés aktuális árazási verziója. */
export const CURRENT_PRICING_VERSION = PRICING_VERSION;
