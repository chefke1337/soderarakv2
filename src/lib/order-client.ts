/**
 * SÓDERÁRAK V3 — RENDELÉSI IGÉNY: kliensoldali beküldés.
 *
 * - A végpont a `NEXT_PUBLIC_ORDER_API_URL` környezeti változóból jön.
 *   A statikus export (GitHub Pages) nem tud szerveroldali route-ot
 *   kiszolgálni, ezért a backend KÜLÖN fut (lásd `server/README.md`).
 * - Ha a végpont nincs beállítva, a kliens NEM szimulál sikeres küldést:
 *   konfigurációs hibát jelez, és telefonos alternatívát kínál.
 * - Timeout + egyetlen idempotencia-kulcs: a dupla beküldést a szerver
 *   is kiszűri, a UI pedig nem engedi a párhuzamos küldést.
 * - Személyes adat NEM kerül URL-be (minden a POST törzsében megy).
 */

import type { OrderRequestInput } from "./order";

export const ORDER_ENDPOINT = (process.env.NEXT_PUBLIC_ORDER_API_URL ?? "").trim();

/** Lokális mock backend fut-e a végponton (a szerver jelzi a válaszban). */
export const ORDER_ENDPOINT_CONFIGURED = ORDER_ENDPOINT.length > 0;

export const SUBMIT_TIMEOUT_MS = 12_000;

export type SubmitOutcome =
  | {
      status: "sent";
      message: string;
      mock: boolean;
      duplicate: boolean;
      serverTotalGross?: number | null;
      totalMismatch?: boolean;
    }
  | { status: "invalid"; message: string; errors: Record<string, string> }
  | { status: "rate-limited"; message: string; retryAfterSeconds?: number }
  | { status: "timeout"; message: string }
  | { status: "server-error"; message: string }
  | { status: "not-configured"; message: string };

const PHONE_FALLBACK =
  "Kérjük, próbálja újra néhány perc múlva, vagy hívjon minket telefonon.";

export function newIdempotencyKey(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return `soder-${crypto.randomUUID()}`;
    }
  } catch {
    // régi motor: visszaesünk az időbélyeg + véletlen kombinációra
  }
  return `soder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function submitOrderRequest(
  payload: OrderRequestInput,
  signal?: AbortSignal,
): Promise<SubmitOutcome> {
  if (!ORDER_ENDPOINT_CONFIGURED) {
    return {
      status: "not-configured",
      message:
        "A beküldési végpont ebben a környezetben nincs beállítva, ezért a rendelési igény NEM került elküldésre. Kérjük, hívjon minket telefonon.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  signal?.addEventListener("abort", onOuterAbort);

  try {
    const res = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      // Hitelesítő adatot nem küldünk harmadik felhez.
      credentials: "omit",
      mode: "cors",
    });

    let body: {
      ok?: boolean;
      message?: string;
      errors?: Record<string, string>;
      mock?: boolean;
      duplicate?: boolean;
      serverTotalGross?: number | null;
      totalMismatch?: boolean;
      retryAfterSeconds?: number;
    } = {};
    try {
      body = await res.json();
    } catch {
      body = {};
    }

    if (res.status === 422) {
      return {
        status: "invalid",
        message: body.message ?? "Kérjük, ellenőrizze a megjelölt mezőket.",
        errors: body.errors ?? {},
      };
    }
    if (res.status === 429) {
      return {
        status: "rate-limited",
        message:
          body.message ??
          "Túl sok beküldés érkezett rövid időn belül. Kérjük, próbálja újra később.",
        retryAfterSeconds: body.retryAfterSeconds,
      };
    }
    if (!res.ok || body.ok !== true) {
      return {
        status: "server-error",
        message: body.message ?? `A beküldés nem sikerült. ${PHONE_FALLBACK}`,
      };
    }

    return {
      status: "sent",
      message: body.message ?? "Megkaptuk a rendelési igényt.",
      mock: body.mock === true,
      duplicate: body.duplicate === true,
      serverTotalGross: body.serverTotalGross,
      totalMismatch: body.totalMismatch,
    };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    if (aborted) {
      return {
        status: "timeout",
        message: `A beküldés túl sokáig tartott, ezért megszakítottuk. Nem tudjuk, hogy megérkezett-e. ${PHONE_FALLBACK}`,
      };
    }
    return {
      status: "server-error",
      message: `A beküldés most nem sikerült (hálózati hiba). ${PHONE_FALLBACK}`,
    };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onOuterAbort);
  }
}
