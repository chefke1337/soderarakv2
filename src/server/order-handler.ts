/**
 * SÓDERÁRAK V3 — RENDELÉSI IGÉNY BACKEND (keretfüggetlen handler).
 *
 * Ez a modul NEM kerül a böngésző-bundle-be: egyetlen kliens komponens sem
 * importálja. Egy futtatókörnyezet-független függvényt ad, amit bármilyen
 * adapter (Cloudflare Worker, Netlify/Vercel function, Express) meghívhat —
 * lásd `server/worker.ts`.
 *
 * BIZTONSÁGI ELVEK:
 *  - Titok (SMTP-jelszó, API-key) KIZÁRÓLAG szerveroldali környezeti
 *    változóból érkezik, és soha nem kerül a válaszba vagy a logba.
 *  - Szerveroldali validáció: a kliens validációja csak kényelmi funkció.
 *  - Az ÖSSZEG mindig a központi katalógusból számolódik újra; a kliens
 *    által küldött összeg csak eltérés-jelzésre szolgál.
 *  - Rate limit + idempotencia (dupla beküldés) kötelező.
 *  - Fejléc-injekció ellen minden szabad szöveges mező szűrve.
 *  - Hibaüzenet soha nem szivárogtat belső részletet.
 *  - Személyes adat nem kerül URL-be és nem kerül logba.
 */

import {
  clientTotalMismatch,
  recomputeOrderQuote,
  sanitizeBlock,
  sanitizeLine,
  validateOrderRequest,
  type OrderRequest,
} from "../lib/order.ts";
import { quoteSummaryLines, type Quote } from "../lib/quote.ts";
import { findMaterial, PRICING_VERSION } from "../content/catalog.ts";
import {
  CASTLE_QUESTION,
  PERMIT_NOTICE,
  romanDistrict,
  UNSUPPORTED_NOTICE,
} from "../content/freight.ts";
import { ORDER_INTENT_NOTICE } from "../content/site.ts";

/* ───────────────────────────── Szerződések ───────────────────────────── */

export type EmailMessage = {
  to: string;
  /** Az ügyfél e-mail-címe válaszcímként (NEM feladóként). */
  replyTo?: string;
  subject: string;
  text: string;
};

export type EmailSender = (message: EmailMessage) => Promise<void>;

export type RateLimitDecision = { allowed: boolean; retryAfterSeconds: number };

export type RateLimiter = (key: string) => Promise<RateLimitDecision>;

export type IdempotencyStore = {
  /** true, ha ezt a kulcsot már feldolgoztuk. */
  has(key: string): Promise<boolean>;
  remember(key: string): Promise<void>;
};

export type OrderHandlerDeps = {
  sendEmail: EmailSender;
  rateLimit: RateLimiter;
  idempotency: IdempotencyStore;
  /** Címzett — alapértelmezés: info@soderarak.hu. */
  recipient?: string;
  /** Mock mód: nem megy ki valódi e-mail. A válasz EZT jelzi. */
  mock?: boolean;
  /** Teszthez injektálható. */
  now?: () => number;
};

export type HandlerRequest = {
  method: string;
  /** Kisbetűs kulcsokkal. */
  headers: Record<string, string | undefined>;
  /** A nyers törzs szövegként (már méretkorlátozva olvasva). */
  bodyText: string;
  /** Kliens IP a rate limithez — nem kerül a levélbe. */
  clientIp: string;
};

export type HandlerResponse = {
  status: number;
  body: {
    ok: boolean;
    /** Felhasználónak megjelenítendő üzenet (magyar). */
    message: string;
    /** Mezőhibák: mezőnév → hibaszöveg. */
    errors?: Record<string, string>;
    /** true: a feldolgozás mock módban történt, valódi e-mail NEM ment ki. */
    mock?: boolean;
    /** true: ezt a beküldést már megkaptuk (dupla beküldés). */
    duplicate?: boolean;
    /** A szerver által hitelesen újraszámolt teljes bruttó összeg. */
    serverTotalGross?: number | null;
    /** true: a kliensen mutatott összeg eltért a hitelestől. */
    totalMismatch?: boolean;
    retryAfterSeconds?: number;
  };
};

export const MAX_BODY_BYTES = 16 * 1024;
export const DEFAULT_RECIPIENT = "info@soderarak.hu";

/* ───────────────────────── Alap implementációk ───────────────────────── */

/**
 * Memóriabeli rate limit — egyetlen példányhoz (helyi fejlesztés, egy-régiós
 * worker). Több példány esetén osztott tárat (KV/Redis) kell injektálni.
 */
export function createMemoryRateLimiter({
  windowMs = 10 * 60 * 1000,
  max = 5,
  now = () => Date.now(),
}: { windowMs?: number; max?: number; now?: () => number } = {}): RateLimiter {
  const hits = new Map<string, number[]>();
  return async (key: string) => {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
    if (recent.length >= max) {
      const oldest = recent[0]!;
      hits.set(key, recent);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (t - oldest)) / 1000)),
      };
    }
    recent.push(t);
    hits.set(key, recent);
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

export function createMemoryIdempotencyStore({
  ttlMs = 24 * 60 * 60 * 1000,
  now = () => Date.now(),
}: { ttlMs?: number; now?: () => number } = {}): IdempotencyStore {
  const seen = new Map<string, number>();
  const sweep = (t: number) => {
    for (const [k, ts] of seen) if (t - ts > ttlMs) seen.delete(k);
  };
  return {
    async has(key) {
      const t = now();
      sweep(t);
      return seen.has(key);
    },
    async remember(key) {
      seen.set(key, now());
    },
  };
}

/** Mock küldő: csak jelzi, hogy mi MENT VOLNA ki. Valódi e-mailt nem küld. */
export function createMockSender(sink?: (m: EmailMessage) => void): EmailSender {
  return async (message) => {
    sink?.(message);
  };
}

/* ─────────────────────────── Levélszöveg ─────────────────────────── */

const ft = (n: number) => `${n.toLocaleString("hu-HU")} Ft`;

export function renderOrderEmail(
  value: OrderRequest,
  quote: Quote,
  opts: { mismatch: boolean; mock: boolean },
): EmailMessage {
  const item = findMaterial(value.materialSlug);
  const materialName = item
    ? `${item.groupName} — ${item.name}${item.fraction ? ` (${item.fraction})` : ""}`
    : value.materialSlug;

  const place =
    value.municipalityId === "budapest"
      ? `Budapest ${romanDistrict(value.districtId ?? 0)} kerület`
      : "Érd";

  const lines: string[] = [];
  lines.push("RENDELÉSI IGÉNY — soderarak.hu árkalkulátor");
  if (opts.mock) {
    lines.push("");
    lines.push("*** MOCK MÓD — ez a levél NEM ment ki valódi címzettnek. ***");
  }
  lines.push("");
  lines.push(ORDER_INTENT_NOTICE);
  lines.push("");
  lines.push("── Megrendelő ──");
  lines.push(`Név: ${sanitizeLine(value.name, 120)}`);
  lines.push(`E-mail: ${sanitizeLine(value.email, 254)}`);
  lines.push(`Telefon: ${sanitizeLine(value.phone, 40)}`);
  lines.push("");
  lines.push("── Anyag és mennyiség ──");
  lines.push(`Anyag és termékváltozat: ${sanitizeLine(materialName, 160)}`);
  if (item?.washed) lines.push(`Minőségjelölés: ${sanitizeLine(item.washed.label, 80)}`);
  if (item?.unclassified) lines.push("Minőségjelölés: osztályozatlan termék");
  lines.push(`Mennyiség: ${value.m3} m³`);
  lines.push("");
  lines.push("── Szállítási cím ──");
  lines.push(`Település: ${value.municipalityId === "budapest" ? "Budapest" : "Érd"}`);
  lines.push(
    `Kerület: ${value.municipalityId === "budapest" ? romanDistrict(value.districtId ?? 0) : "—"}`,
  );
  lines.push(`Irányítószám: ${value.postalCode}`);
  lines.push(`Szállítási cím: ${sanitizeLine(value.address, 240)}`);
  lines.push(`Fuvarzóna (profil): ${sanitizeLine(place, 80)}`);
  lines.push(
    `Kívánt időpont: ${value.preferredDate ? sanitizeLine(value.preferredDate, 40) : "nem adott meg"}`,
  );
  lines.push("");
  lines.push("── Behajtási engedély / Vár ──");
  if (value.municipalityId === "budapest" && value.districtId === 1) {
    const answerLabel =
      value.castleAnswer === "igen"
        ? "Igen"
        : value.castleAnswer === "nem"
          ? "Nem"
          : value.castleAnswer === "nem-tudom"
            ? "Nem tudom"
            : "nem válaszolt";
    lines.push(`${CASTLE_QUESTION} → ${answerLabel}`);
    if (quote.needsPermitClearance) {
      lines.push(
        "FIGYELEM: a Vár területe miatt külön engedély és előzetes egyeztetés szükséges.",
      );
      lines.push("Az engedély díja még nem ismert — a végösszeg nem garantált.");
    }
  } else {
    lines.push(PERMIT_NOTICE);
  }
  lines.push("");
  lines.push("── Árösszesítő (szerveroldalon újraszámolva) ──");
  for (const row of quoteSummaryLines(quote, ft)) lines.push(row);
  if (quote.freightResult.kind === "unsupported-postal") lines.push(UNSUPPORTED_NOTICE);
  if (quote.freightResult.kind === "mismatch") {
    lines.push(
      `FIGYELEM: az irányítószám (${quote.freightResult.postalCode}) nem egyezik a választott területtel (${sanitizeLine(quote.freightResult.selectedLabel, 80)}).`,
    );
  }
  if (quote.freightResult.kind === "quote-required") {
    lines.push(
      `FIGYELEM: ehhez a mennyiséghez (${value.m3} m³) nincs tarifa — a profil legnagyobb árazott mennyisége ${quote.freightResult.profileMaxM3} m³. Egyedi egyeztetés szükséges.`,
    );
  }
  if (opts.mismatch) {
    lines.push("");
    lines.push(
      `FIGYELEM: a kliensen megjelenített összeg (${value.clientTotalGross === null || value.clientTotalGross === undefined ? "—" : ft(value.clientTotalGross)}) eltér a szerveroldali összegtől. A hiteles érték a fenti.`,
    );
  }
  lines.push("");
  lines.push("── Megjegyzés ──");
  lines.push(value.note ? sanitizeBlock(value.note, 2000) : "—");
  lines.push("");
  lines.push(`Árazási verzió: ${sanitizeLine(value.pricingVersion || PRICING_VERSION, 40)}`);
  lines.push(`Beküldés azonosító: ${sanitizeLine(value.idempotencyKey, 80)}`);

  const subject = sanitizeLine(
    `${opts.mock ? "[MOCK] " : ""}Rendelési igény: ${materialName} ${value.m3} m³ — ${value.postalCode}`,
    180,
  );

  return {
    to: DEFAULT_RECIPIENT,
    replyTo: sanitizeLine(value.email, 254),
    subject,
    text: lines.join("\n"),
  };
}

/* ──────────────────────────── A handler ──────────────────────────── */

export async function handleOrderRequest(
  req: HandlerRequest,
  deps: OrderHandlerDeps,
): Promise<HandlerResponse> {
  if (req.method.toUpperCase() !== "POST") {
    return { status: 405, body: { ok: false, message: "Nem támogatott kérés." } };
  }

  const contentType = (req.headers["content-type"] ?? "").toLowerCase();
  if (!contentType.includes("application/json")) {
    return { status: 415, body: { ok: false, message: "Nem támogatott adatformátum." } };
  }

  // Méretkorlát: nagy törzs sem parse-olódik.
  if (req.bodyText.length > MAX_BODY_BYTES) {
    return { status: 413, body: { ok: false, message: "A beküldött adat túl nagy." } };
  }

  const limit = await deps.rateLimit(req.clientIp || "unknown");
  if (!limit.allowed) {
    return {
      status: 429,
      body: {
        ok: false,
        message:
          "Túl sok beküldés érkezett rövid időn belül. Kérjük, próbálja újra később, vagy hívjon minket telefonon.",
        retryAfterSeconds: limit.retryAfterSeconds,
      },
    };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(req.bodyText);
  } catch {
    return { status: 400, body: { ok: false, message: "Érvénytelen adat." } };
  }

  const validated = validateOrderRequest(raw);
  if (!validated.ok) {
    return {
      status: 422,
      body: {
        ok: false,
        message: "Kérjük, ellenőrizze a megjelölt mezőket.",
        errors: validated.errors,
      },
    };
  }
  const value = validated.value;

  // Dupla beküldés: ugyanazt a kulcsot nem küldjük ki másodszor.
  if (await deps.idempotency.has(value.idempotencyKey)) {
    return {
      status: 200,
      body: {
        ok: true,
        duplicate: true,
        mock: deps.mock ?? false,
        message:
          "Ezt a rendelési igényt már megkaptuk. Hamarosan jelentkezünk a visszaigazolással.",
      },
    };
  }

  const quote = recomputeOrderQuote(value);
  const mismatch = clientTotalMismatch(value, quote);

  const message = renderOrderEmail(value, quote, {
    mismatch,
    mock: deps.mock ?? false,
  });
  if (deps.recipient) message.to = deps.recipient;

  try {
    await deps.sendEmail(message);
  } catch {
    // Belső hibarészlet (szolgáltatói válasz, kulcs) SOHA nem kerül a válaszba.
    return {
      status: 502,
      body: {
        ok: false,
        message:
          "A beküldés most nem sikerült. Kérjük, próbálja újra néhány perc múlva, vagy hívjon minket telefonon.",
      },
    };
  }

  await deps.idempotency.remember(value.idempotencyKey);

  return {
    status: 200,
    body: {
      ok: true,
      mock: deps.mock ?? false,
      message: deps.mock
        ? "Mock mód: a rendelési igény feldolgozva, de valódi e-mail NEM ment ki."
        : "Megkaptuk a rendelési igényt. A részletek egyeztetése és visszaigazolásunk után válik véglegessé.",
      serverTotalGross: quote.totalGross,
      totalMismatch: mismatch,
    },
  };
}
