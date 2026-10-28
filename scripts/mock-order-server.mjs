/**
 * Lokális MOCK backend a rendelési igényhez.
 *
 * A VALÓDI handlert futtatja (`src/server/order-handler.ts`): szerveroldali
 * validáció, hiteles árújraszámolás, rate limit, idempotencia (dupla
 * beküldés) — csak az e-mail küldése mock, tehát VALÓDI LEVÉL NEM MEGY KI.
 *
 * Indítás:  npm run mock:order        (alapértelmezés: http://127.0.0.1:8788/order)
 * A frontend a `NEXT_PUBLIC_ORDER_API_URL` változóból veszi a végpontot.
 *
 * Hibaszimuláció a teszteléshez (lekérdezési paraméterek a végponton):
 *   ?simulate=fail     → a küldő hibát dob (502-es válasz)
 *   ?simulate=timeout  → a válasz késik (a kliens timeoutja aktiválódik)
 */

import { createServer } from "node:http";
import { readFileSync, mkdirSync, appendFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

// Windows-on az abszolút útvonal csak file:// URL-ként importálható.
const {
  handleOrderRequest,
  createMemoryRateLimiter,
  createMemoryIdempotencyStore,
  MAX_BODY_BYTES,
} = await import(pathToFileURL(resolve(root, "src/server/order-handler.ts")).href);

const PORT = Number(process.env.MOCK_ORDER_PORT ?? 8788);
const HOST = process.env.MOCK_ORDER_HOST ?? "127.0.0.1";
const OUT_DIR = resolve(root, ".mock-mail");

const rateLimit = createMemoryRateLimiter({ windowMs: 10 * 60 * 1000, max: 20 });
const idempotency = createMemoryIdempotencyStore();

/** A mock „elküldött" leveleket fájlba írja, hogy ellenőrizhető legyen. */
function mockSender(simulate) {
  return async (message) => {
    if (simulate === "fail") throw new Error("mock_provider_failure");
    mkdirSync(OUT_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    appendFileSync(
      resolve(OUT_DIR, `${stamp}.txt`),
      `TO: ${message.to}\nREPLY-TO: ${message.replyTo ?? "—"}\nSUBJECT: ${message.subject}\n\n${message.text}\n`,
      "utf8",
    );
    // Konzolon csak a tárgy és a cél jelenik meg — személyes adat nem logolódik.
    console.log(`[mock-order] levél rögzítve: ${message.subject}`);
  };
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  const simulate = url.searchParams.get("simulate");
  const origin = req.headers.origin ?? "*";

  const send = (status, body, extraHeaders = {}) => {
    const json = JSON.stringify(body);
    res.writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      vary: "Origin",
      ...extraHeaders,
    });
    res.end(json);
  };

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
      vary: "Origin",
    });
    res.end();
    return;
  }

  if (url.pathname === "/health") {
    send(200, { ok: true, mock: true });
    return;
  }

  let body = "";
  let tooLarge = false;
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > MAX_BODY_BYTES * 2) {
      tooLarge = true;
      req.destroy();
    }
  });
  req.on("end", async () => {
    if (tooLarge) {
      send(413, { ok: false, message: "A beküldött adat túl nagy." });
      return;
    }
    const run = async () => {
      try {
        const result = await handleOrderRequest(
          {
            method: req.method ?? "GET",
            headers: { "content-type": req.headers["content-type"] },
            bodyText: body,
            clientIp: req.socket.remoteAddress ?? "local",
          },
          {
            sendEmail: mockSender(simulate),
            rateLimit,
            idempotency,
            mock: true,
          },
        );
        send(
          result.status,
          result.body,
          result.body.retryAfterSeconds
            ? { "retry-after": String(result.body.retryAfterSeconds) }
            : {},
        );
      } catch (err) {
        console.error("[mock-order] váratlan hiba:", err?.message ?? err);
        send(500, { ok: false, message: "Váratlan hiba a mock backendben." });
      }
    };
    if (simulate === "timeout") setTimeout(run, 20_000);
    else await run();
  });
});

server.listen(PORT, HOST, () => {
  let pkgName = "soderarak";
  try {
    pkgName = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).name ?? pkgName;
  } catch {
    /* nem kritikus */
  }
  console.log(`[mock-order] ${pkgName} MOCK rendelési backend fut.`);
  console.log(`[mock-order] Végpont: http://${HOST}:${PORT}/order`);
  console.log(`[mock-order] VALÓDI E-MAIL NEM MEGY KI. A levelek ide kerülnek: ${OUT_DIR}`);
});
