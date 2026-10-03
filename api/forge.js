import { createDirectQlooWorkflowExecutorFromEnvironment } from "@qloo/qloo-harness";
import {
  buildCreativeBrief,
  normalizeItems,
  validateInput
} from "../src/qloo-core.js";

const HACKATHON_BASE = "https://hackathon.api.qloo.com";
const HARNESS_VERSION = "0.1.26";
const WORKFLOW_CONTRACT_VERSION = "1.0.0";
const RESULT_SCHEMA_VERSION = "1.0-preview.1";

const RECOMMENDATIONS = {
  brands: "brand",
  films: "movie",
  artists: "artist",
  places: "place"
};

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(payload));
}

function createOfficialExecutor(env = process.env) {
  const resolvedEnv = {
    ...env,
    QLOO_BASE_URL: env.QLOO_BASE_URL || HACKATHON_BASE,
    QLOO_TRUSTED_BASE_URL: env.QLOO_TRUSTED_BASE_URL || HACKATHON_BASE
  };
  return createDirectQlooWorkflowExecutorFromEnvironment({ env: resolvedEnv });
}

function qlooAuthError() {
  const error = new Error("Qloo credential is not configured on this deployment.");
  error.code = "QLOO_AUTH";
  error.layer = "qloo";
  error.retryable = false;
  error.recovery = "Set QLOO_API_KEY or run qloo setup --qloo, then retry the same operation.";
  return error;
}

function traceRow(execution, meta = {}) {
  const result = execution?.result || {};
  return {
    step: "qloo_workflow",
    operation: execution?.operation || meta.operation || null,
    group: meta.group || null,
    seed: meta.seed || null,
    target_type: meta.target_type || null,
    status: result.status || "unknown",
    result_count:
      Number.isFinite(Number(result.result_count))
        ? Number(result.result_count)
        : normalizeItems(result, 100).length,
    correlation_id: execution?.correlationId || null,
    duration_ms: execution?.durationMs ?? null,
    warnings: Array.isArray(result.warnings) ? result.warnings : [],
    provenance: result.provenance || null
  };
}

function failureRow(operation, error, meta = {}) {
  return {
    step: "qloo_workflow",
    operation,
    group: meta.group || null,
    seed: meta.seed || null,
    target_type: meta.target_type || null,
    status: "error",
    error: error?.message || String(error),
    code: error?.code || null,
    layer: error?.layer || null,
    retryable: Boolean(error?.retryable),
    recovery: error?.recovery || null
  };
}

async function runWorkflow(executor, operation, input, trace, meta = {}) {
  try {
    const execution = await executor.execute(operation, input);
    trace.push(traceRow(execution, { operation, ...meta }));
    return execution;
  } catch (error) {
    trace.push(failureRow(operation, error, meta));
    return null;
  }
}

export async function executeAgent(input, options = {}) {
  const executor = options.executor || createOfficialExecutor(options.env || process.env);
  if (!executor) throw qlooAuthError();

  const trace = [];
  const resolved = [];

  for (const seed of input.seeds) {
    const execution = await runWorkflow(
      executor,
      "describe",
      { entity: seed },
      trace,
      { seed }
    );
    if (!execution || execution.result?.status !== "ok") continue;

    const described = normalizeItems(execution.result, 1)[0];
    resolved.push({
      ...(described || { id: "", name: seed, type: null, affinity: null, image: null }),
      source_seed: seed
    });
  }

  if (resolved.length < 2) {
    throw new Error(
      "Qloo could not resolve at least two seeds through the official describe workflow."
    );
  }

  const groups = {
    tags: [],
    brands: [],
    films: [],
    artists: [],
    places: []
  };

  const tagExecution = await runWorkflow(
    executor,
    "entity_tags",
    { entities: input.seeds, limit: 8 },
    trace,
    { group: "tags" }
  );
  if (tagExecution?.result?.status === "ok") {
    groups.tags = normalizeItems(tagExecution.result, 8);
  }

  for (const [group, targetType] of Object.entries(RECOMMENDATIONS)) {
    const execution = await runWorkflow(
      executor,
      "recommend",
      {
        target_type: targetType,
        signals: input.seeds,
        explain: true,
        limit: 6
      },
      trace,
      { group, target_type: targetType }
    );
    if (execution?.result?.status === "ok") {
      groups[group] = normalizeItems(execution.result, 6);
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
    integration: {
      surface: "@qloo/qloo-harness",
      harness_version: HARNESS_VERSION,
      workflow_contract_version: WORKFLOW_CONTRACT_VERSION,
      result_schema_version: RESULT_SCHEMA_VERSION,
      transport: executor.transport || null,
      resolution: executor.resolution || null,
      fallback: "none"
    },
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
      qloo_surface: "@qloo/qloo-harness",
      workflow_contract_version: WORKFLOW_CONTRACT_VERSION,
      version: "0.2.0"
    });
  }
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const input = validateInput(req.body || {});
    return json(res, 200, await executeAgent(input));
  } catch (error) {
    const message = error?.message || "Unexpected error";
    const status = error?.code === "QLOO_AUTH" || message.includes("not configured") ? 503 : 400;
    return json(res, status, {
      error: message,
      code: error?.code || null,
      layer: error?.layer || null,
      retryable: Boolean(error?.retryable),
      recovery: error?.recovery || null
    });
  }
}
