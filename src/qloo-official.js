import { createDirectQlooWorkflowExecutorFromEnvironment } from "@qloo/qloo-harness";
import {
  buildCreativeBrief,
  buildCreativeCoherence,
  normalizeItems
} from "./qloo-core.js";

export const QLOO_INTEGRATION = Object.freeze({
  surface: "@qloo/qloo-harness",
  harness_version: "0.1.26",
  workflow_contract_version: "1.0.0",
  result_schema_version: "1.0-preview.1",
  fallback: "none"
});

export function createOfficialExecutor(env = process.env) {
  return createDirectQlooWorkflowExecutorFromEnvironment({ env });
}

function authError() {
  const error = new Error(
    "Qloo credential is not configured. Set QLOO_API_KEY or run qloo setup --qloo."
  );
  error.code = "QLOO_AUTH";
  error.layer = "qloo";
  error.retryable = false;
  error.recovery = "Set QLOO_API_KEY or run qloo setup --qloo with the event-issued credential.";
  return error;
}

function successTrace(execution, extra = {}) {
  const result = execution?.result || {};
  return {
    operation: execution.operation,
    status: result.status || "unknown",
    target_type: extra.target_type || null,
    result_count: Number.isFinite(Number(result.result_count))
      ? Number(result.result_count)
      : Array.isArray(result.results) ? result.results.length : null,
    correlation_id: execution.correlationId,
    duration_ms: execution.durationMs,
    transport: execution.transport,
    provenance: result.provenance || null,
    interpretation: result.interpretation || null,
    warnings: result.warnings || []
  };
}
function errorTrace(operation, error, extra = {}) {
  return {
    operation,
    status: "error",
    target_type: extra.target_type || null,
    code: error?.code || "UNKNOWN",
    layer: error?.layer || "unknown",
    retryable: Boolean(error?.retryable),
    recovery: error?.recovery || null,
    error: error instanceof Error ? error.message : String(error)
  };
}

async function run(executor, operation, input, trace, extra = {}) {
  try {
    const execution = await executor.execute(operation, input);
    trace.push(successTrace(execution, extra));
    return execution.result;
  } catch (error) {
    trace.push(errorTrace(operation, error, extra));
    throw error;
  }
}

function resolvedFromDescribe(result, sourceSeed) {
  if (result?.status !== "ok") return null;
  const item = normalizeItems(result, 1)[0];
  if (!item?.id && !item?.name) return null;
  return { ...item, source_seed: sourceSeed };
}

async function resolveSeeds(input, executor, trace) {
  const resolved = [];
  for (const seed of input.seeds) {
    try {
      const result = await run(executor, "describe", { entity: seed }, trace);
      const entity = resolvedFromDescribe(result, seed);
      if (entity) resolved.push(entity);
    } catch {
      // The trace contains the exact failure; unresolved seeds are not synthesized.
    }
  }
  if (resolved.length < 2) {
    const error = new Error("Qloo could not resolve at least two seeds unambiguously.");
    error.code = "QLOO_INPUT_RESOLUTION";
    error.layer = "tool_input";
    error.retryable = false;
    error.recovery = "Use more specific public cultural references and retry.";
    throw error;
  }
  return resolved;
}
export async function executeAgent(input, options = {}) {
  const executor = options.executor || createOfficialExecutor(options.env || process.env);
  if (!executor) throw authError();

  const trace = [];
  const resolvedSeeds = await resolveSeeds(input, executor, trace);
  const signals = resolvedSeeds.map(item => item.id || item.name);

  const groups = {
    tags: [],
    brands: [],
    films: [],
    artists: [],
    places: []
  };

  try {
    const tagResult = await run(
      executor,
      "entity_tags",
      { entities: signals, limit: 8 },
      trace
    );
    if (tagResult?.status === "ok") groups.tags = normalizeItems(tagResult, 8);
  } catch {
    // Tags enrich the brief but are not required to keep evidence from other domains.
  }

  const targets = [
    ["brands", "brand"],
    ["films", "movie"],
    ["artists", "artist"],
    ["places", "place"]
  ];

  for (const [group, targetType] of targets) {
    try {
      const result = await run(
        executor,
        "recommend",
        {
          target_type: targetType,
          signals,
          explain: true,
          limit: 6
        },
        trace,
        { target_type: targetType }
      );
      if (result?.status === "ok") groups[group] = normalizeItems(result, 6);
    } catch {
      groups[group] = [];
    }
  }
  let audienceComparison = null;
  if (resolvedSeeds.length === 4) {
    try {
      const result = await run(
        executor,
        "compare_audiences",
        {
          group_a: signals.slice(0, 2),
          group_b: signals.slice(2, 4),
          target_type: "brand",
          limit: 6
        },
        trace,
        { target_type: "brand" }
      );
      if (result?.status === "ok") {
        audienceComparison = {
          operation: "compare_audiences",
          interpretation: result.interpretation || null,
          results: result.results || null,
          provenance: result.provenance || null
        };
      }
    } catch {
      audienceComparison = null;
    }
  }

  const creativeCoherence = buildCreativeCoherence({
    seeds: resolvedSeeds,
    audienceComparison,
    groups
  });
  const brief = buildCreativeBrief({
    objective: input.objective,
    seeds: resolvedSeeds,
    groups,
    coherence: creativeCoherence
  });

  return {
    product: "TasteForge Agent",
    powered_by: "@qloo/qloo-harness",
    integration: QLOO_INTEGRATION,
    generated_at: new Date().toISOString(),
    market: input.market || null,
    seeds: resolvedSeeds,
    groups,
    audience_comparison: audienceComparison,
    creative_coherence: creativeCoherence,
    brief,
    trace,
    limitations: [
      "Qloo results describe aggregate cultural affinities, not individual behavior.",
      "TasteForge does not infer sensitive traits or future actions.",
      "A seed is used only after the official describe workflow resolves it successfully.",
      "Creative direction is TasteForge interpretation layered on Qloo evidence, not a Qloo causal claim."
    ]
  };
}

export const executeTasteForge = executeAgent;
