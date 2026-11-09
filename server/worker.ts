/**
 * SÓDERÁRAK V3 — rendelési igény backend adapter (Cloudflare Worker).
 *
 * A GitHub Pages statikus hosting, ezért a beküldést KÜLÖN backend fogadja.
 * Ez az adapter csak a HTTP-határt kezeli; az üzleti logika a
 * `src/server/order-handler.ts`-ben van (keretfüggetlen, tesztelt).
 *
 * Titkok KIZÁRÓLAG Worker secretként (`wrangler secret put`) érkeznek:
 * sem SMTP-jelszó, sem API-key nem kerül a frontendbe vagy a repóba.
 *
 * Telepítés és a valódi aktiváláshoz szükséges adatok: `server/README.md`.
 */

import {
  createMemoryIdempotencyStore,
  createMemoryRateLimiter,
  createMockSender,
  handleOrderRequest,
  MAX_BODY_BYTES,
  type EmailMessage,
  type EmailSender,
  type IdempotencyStore,
} from "../src/server/order-handler.ts";

export type Env = {
  /** Címzett — alapértelmezés: megrendeles@soderarak.hu. */
  ORDER_RECIPIENT?: string;
  /** Engedélyezett origin(ek), vesszővel. Üres = minden elutasítva. */
  ALLOWED_ORIGINS?: string;
  /** "1" → mock mód: valódi e-mail NEM megy ki. */
  ORDER_MOCK?: string;
  /** HTTP e-mail API kulcs (secret). Ha nincs, a Worker mock módra esik vissza. */
  EMAIL_API_KEY?: string;
  /** HTTP e-mail API végpont (pl. transzakciós e-mail szolgáltató). */
  EMAIL_API_URL?: string;
  /** Hitelesített feladó (a szolgáltatónál igazolt domain). */
  EMAIL_FROM?: string;
  /** Opcionális KV namespace az idempotenciához (több példány esetén kell). */
  ORDER_KV?: KVNamespace;
};

/** Minimalista KV-típus, hogy a Worker-típusok nélkül is fordítható legyen. */
type KVNamespace = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

/**
 * HTTP e-mail API küldő. Szándékosan általános: a legtöbb transzakciós
 * szolgáltató (pl. Resend, Postmark, Mailgun) fogad ilyen alakú JSON-t —
 * a pontos mezőneveket a bevezetéskor a választott szolgáltatóhoz kell
 * illeszteni. Új, fizetős szolgáltató bevezetése JÓVÁHAGYÁST igényel.
 */
function createHttpEmailSender(env: Env): EmailSender {
  return async (message: EmailMessage) => {
    const res = await fetch(env.EMAIL_API_URL!, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.EMAIL_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [message.to],
        reply_to: message.replyTo,
        subject: message.subject,
        text: message.text,
      }),
    });
    if (!res.ok) {
      // A szolgáltatói választörzs NEM kerül tovább (titkot tartalmazhat).
      throw new Error(`email_provider_status_${res.status}`);
    }
  };
}

function createKvIdempotencyStore(kv: KVNamespace): IdempotencyStore {
  const TTL_SECONDS = 24 * 60 * 60;
  return {
    async has(key) {
      return (await kv.get(`idem:${key}`)) !== null;
    },
    async remember(key) {
      await kv.put(`idem:${key}`, "1", { expirationTtl: TTL_SECONDS });
    },
  };
}

const rateLimit = createMemoryRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });
const memoryIdempotency = createMemoryIdempotencyStore();

function corsHeaders(env: Env, origin: string | null): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("origin");
    const cors = corsHeaders(env, origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: Object.keys(cors).length ? 204 : 403, headers: cors });
    }
    if (origin && !Object.keys(cors).length) {
      return new Response(JSON.stringify({ ok: false, message: "Nem engedélyezett forrás." }), {
        status: 403,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    // Méretkorlát a parse ELŐTT.
    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ ok: false, message: "A beküldött adat túl nagy." }), {
        status: 413,
        headers: { "content-type": "application/json; charset=utf-8", ...cors },
      });
    }

    const bodyText = request.method === "POST" ? await request.text() : "";

    const liveEmail = Boolean(env.EMAIL_API_KEY && env.EMAIL_API_URL && env.EMAIL_FROM);
    const mock = env.ORDER_MOCK === "1" || !liveEmail;

    const result = await handleOrderRequest(
      {
        method: request.method,
        headers: {
          "content-type": request.headers.get("content-type") ?? undefined,
        },
        bodyText,
        clientIp:
          request.headers.get("cf-connecting-ip") ??
          request.headers.get("x-forwarded-for") ??
          "unknown",
      },
      {
        sendEmail: mock ? createMockSender() : createHttpEmailSender(env),
        rateLimit,
        idempotency: env.ORDER_KV ? createKvIdempotencyStore(env.ORDER_KV) : memoryIdempotency,
        recipient: env.ORDER_RECIPIENT,
        mock,
      },
    );

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        ...cors,
        ...(result.body.retryAfterSeconds
          ? { "retry-after": String(result.body.retryAfterSeconds) }
          : {}),
      },
    });
  },
};
