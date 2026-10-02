import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { executeAgent } from "./api/forge.js";
import { validateInput } from "./src/qloo-core.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "public");
const port = Number(process.env.PORT || 8788);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(res, status, data, type = "application/json; charset=utf-8") {
  const isBinary = Buffer.isBuffer(data);
  const body = isBinary ? data : (typeof data === "string" ? data : JSON.stringify(data));
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}
async function readBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 50_000) throw new Error("Request too large");
  }
  return JSON.parse(raw || "{}");
}

async function staticFile(pathname) {
  const file = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!["index.html", "app.js", "style.css"].includes(file)) return null;
  return { file, data: await fs.readFile(path.join(publicDir, file)) };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "GET" && url.pathname === "/api/forge") {
      return send(res, 200, {
        ok: true,
        service: "TasteForge Agent",
        qloo_configured: Boolean(process.env.QLOO_API_KEY)
      });
    }
    if (req.method === "POST" && url.pathname === "/api/forge") {
      const input = validateInput(await readBody(req));
      return send(res, 200, await executeAgent(input));
    }
    if (req.method === "GET") {
      const asset = await staticFile(url.pathname);
      if (asset) {
        const ext = path.extname(asset.file);
        return send(res, 200, asset.data, mime[ext] || "application/octet-stream");
      }
    }
    return send(res, 404, { error: "Not found" });
  } catch (error) {
    const status = String(error.message).includes("QLOO_API_KEY") ? 503 : 400;
    return send(res, status, { error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`TasteForge Agent: http://127.0.0.1:${port}`);
});
