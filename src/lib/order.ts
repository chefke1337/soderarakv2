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
