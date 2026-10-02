import {
  buildCreativeBrief,
  normalizeItems,
  validateInput
} from "../src/qloo-core.js";

const DEFAULT_BASE = "https://api.qloo.com";
const DOMAIN_FILTERS = {
  tags: "urn:tag",
  brands: "urn:entity:brand",
  films: "urn:entity:movie",
  artists: "urn:entity:artist",
  places: "urn:entity:place"
};

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(payload));
}

function apiConfig() {
  const key = String(process.env.QLOO_API_KEY || "").trim();
  if (!key) throw new Error("QLOO_API_KEY is not configured.");
  return {
    key,
    base: String(process.env.QLOO_BASE_URL || DEFAULT_BASE).replace(/\/$/, "")
  };
}
async function qlooGet(config, path, params) {
  const url = new URL(config.base + path);
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== "" && value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  const response = await fetch(url, {
    headers: {
      "x-api-key": config.key,
      "accept": "application/json",
      "user-agent": "BABYDOV-TasteForge/0.1"
    },
    signal: AbortSignal.timeout(12000)
  });
  const raw = await response.text();
  let data = {};
  try { data = JSON.parse(raw); } catch { data = { raw: raw.slice(0, 500) }; }
  if (!response.ok) {
    const err = new Error(`Qloo ${path} failed with HTTP ${response.status}`);
    err.status = response.status;
    err.detail = data;
    throw err;
  }
  return data;
}

async function resolveSeed(config, seed) {
  const payload = await qlooGet(config, "/search", { query: seed, limit: 5 });
  const candidates = normalizeItems(payload, 5);
  return candidates[0] || null;
}
async function getDomain(config, filterType, entityIds) {
  return qlooGet(config, "/v2/insights", {
    "filter.type": filterType,
    "signal.interests.entities": entityIds.join(","),
    take: 6
  });
}

async function executeAgent(input) {
  const config = apiConfig();
  const trace = [];
  const resolved = [];

  for (const seed of input.seeds) {
    try {
      const entity = await resolveSeed(config, seed);
      if (!entity?.id) {
        trace.push({ step: "resolve_seed", seed, status: "no_match" });
        continue;
      }
      resolved.push({ ...entity, source_seed: seed });
      trace.push({
        step: "resolve_seed",
        seed,
        status: "ok",
        entity_id: entity.id,
        entity_name: entity.name
      });
    } catch (error) {
      trace.push({ step: "resolve_seed", seed, status: "error", error: error.message });
    }
  }

  if (resolved.length < 2) {
    throw new Error("Qloo could not resolve at least two seeds. Try more specific cultural references.");
  }
  const ids = [...new Set(resolved.map(x => x.id))];
  const groups = {};

  for (const [group, filterType] of Object.entries(DOMAIN_FILTERS)) {
    try {
      const payload = await getDomain(config, filterType, ids);
      groups[group] = normalizeItems(payload, 6);
      trace.push({
        step: "cross_domain_insight",
        group,
        filter_type: filterType,
        status: "ok",
        result_count: groups[group].length
      });
    } catch (error) {
      groups[group] = [];
      trace.push({
        step: "cross_domain_insight",
        group,
        filter_type: filterType,
        status: "error",
        error: error.message
      });
    }
  }

  const brief = buildCreativeBrief({
    objective: input.objective,
    seeds: resolved,
    groups
  });

  return {
    product: "TasteForge Agent",
    powered_by: "Qloo Taste AI",
    generated_at: new Date().toISOString(),
    market: input.market || null,
    seeds: resolved,
    groups,
    brief,
    trace
  };
}
export default async function handler(req, res) {
  if (req.method === "GET") {
    return json(res, 200, {
      ok: true,
      service: "TasteForge Agent",
      qloo_configured: Boolean(process.env.QLOO_API_KEY),
      version: "0.1.0"
    });
  }
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const input = validateInput(req.body || {});
    const result = await executeAgent(input);
    return json(res, 200, result);
  } catch (error) {
    const status = String(error.message).includes("QLOO_API_KEY") ? 503 : 400;
    return json(res, status, {
      error: error.message,
      detail: error.detail || null
    });
  }
}

export { executeAgent };
