// Probe: minimál statikus szerver az out/ méréshez (probe-* → gitignored).
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.argv[2] || "out";
const port = Number(process.argv[3] || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};

http
  .createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, "http://x").pathname.split("?")[0]);
      if (p.endsWith("/")) p += "index.html";
      let file = join(root, normalize(p).replace(/^([/\\])+/, ""));
      let body = await readFile(file).catch(() => null);
      if (body === null && !extname(file)) {
        file = join(root, normalize(p).replace(/^([/\\])+/, ""), "index.html");
        body = await readFile(file).catch(() => null);
      }
      if (body === null) body = await readFile(join(root, "404.html"));
      res.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  })
  .listen(port, "127.0.0.1", () => console.log(`probe server: http://127.0.0.1:${port} -> ${root}`));
