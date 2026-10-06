function cloneList(items, take) {
  return (Array.isArray(items) ? items : []).slice(0, take).map(item => ({
    id: item?.id || "",
    name: item?.name || "",
    type: item?.type || null,
    affinity: item?.affinity ?? null,
    source_seed: item?.source_seed || undefined
  }));
}

function cleanTrace(rows) {
  return (Array.isArray(rows) ? rows : []).map(row => ({
    step: row?.step || null,
    operation: row?.operation || null,
    group: row?.group || null,
    seed: row?.seed || null,
    target_type: row?.target_type || null,
    status: row?.status || null,
    result_count: row?.result_count ?? null,
    correlation_id: row?.correlation_id || null,
    duration_ms: row?.duration_ms ?? null,
    warnings: Array.isArray(row?.warnings) ? row.warnings.map(String) : [],
    provenance: row?.provenance || null,
    code: row?.code || null,
    layer: row?.layer || null,
    retryable: Boolean(row?.retryable)
  }));
}
export function buildSubmissionArtifact(input, result) {
  return {
    schema: "tasteforge.live_demo.v1",
    generated_at: result?.generated_at || new Date().toISOString(),
    input: {
      objective: input?.objective || "",
      market: input?.market || "",
      seeds: Array.isArray(input?.seeds)
        ? input.seeds.map(seed => typeof seed === "object" ? String(seed?.name || "") : String(seed)).slice(0, 4)
        : []
    },
    integration: {
      surface: result?.integration?.surface || null,
      harness_version: result?.integration?.harness_version || null,
      workflow_contract_version: result?.integration?.workflow_contract_version || null,
      result_schema_version: result?.integration?.result_schema_version || null,
      transport: result?.integration?.transport || null,
      resolution: result?.integration?.resolution || null,
      fallback: result?.integration?.fallback || null
    },
    evidence: {
      seeds: cloneList(result?.seeds, 4),
      groups: {
        tags: cloneList(result?.groups?.tags, 8),
        brands: cloneList(result?.groups?.brands, 6),
        films: cloneList(result?.groups?.films, 6),
        artists: cloneList(result?.groups?.artists, 6),
        places: cloneList(result?.groups?.places, 6)
      }
    },
    brief: result?.brief || null,
    trace: cleanTrace(result?.trace)
  };
}
