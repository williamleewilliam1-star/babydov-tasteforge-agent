import { validateInput } from "../src/qloo-core.js";
import {
  createOfficialExecutor,
  executeAgent,
  executeTasteForge
} from "../src/qloo-official.js";

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(payload));
}

function qlooConfigured() {
  return Boolean(String(process.env.QLOO_API_KEY || "").trim());
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return json(res, 200, {
      ok: true,
      service: "TasteForge Agent",
      integration: "@qloo/qloo-harness",
      harness_version: "0.1.26",
      qloo_configured: qlooConfigured(),
      qloo_base_url: process.env.QLOO_BASE_URL || null,
      version: "0.2.0"
    });
  }

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }
  try {
    const input = validateInput(req.body || {});
    const executor = createOfficialExecutor();
    const result = await executeAgent(input, { executor });
    return json(res, 200, result);
  } catch (error) {
    const code = error?.code || null;
    const message = error instanceof Error ? error.message : "Unexpected error";

    let status = 400;
    if (code === "QLOO_AUTH" || /credential|api key|unauth/i.test(message)) {
      status = 503;
    } else if (/rate.?limit/i.test(message)) {
      status = 429;
    } else if (/timeout|connect|dns|tls/i.test(message)) {
      status = 502;
    }

    return json(res, status, {
      error: message,
      code,
      recovery: error?.recovery || null
    });
  }
}

export { executeAgent, executeTasteForge };
