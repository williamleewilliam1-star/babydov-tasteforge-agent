import test from "node:test";
import assert from "node:assert/strict";
import { buildSubmissionArtifact } from "../src/live-demo-artifact.js";

test("live demo artifact allowlists evidence and drops credential-shaped fields", () => {
  const artifact = buildSubmissionArtifact(
    {
      objective: "Campaign",
      market: "Tokyo",
      seeds: ["A", "B"],
      api_key: "input-secret"
    },
    {
      generated_at: "2026-10-03T00:00:00Z",
      credential: "result-secret",
      integration: {
        surface: "@qloo/qloo-harness",
        harness_version: "0.1.26",
        workflow_contract_version: "1.0.0",
        result_schema_version: "1.0-preview.1",
        fallback: "none",
        api_key: "integration-secret"
      },
      seeds: [{ id: "a", name: "A", source_seed: "A", credential: "seed-secret" }],
      groups: {
        tags: [{ id: "t", name: "Tag", api_key: "tag-secret" }],
        brands: [], films: [], artists: [], places: []
      },
      brief: { title: "Brief", thesis: "Evidence only" },
      trace: [{
        step: "qloo_workflow",
        operation: "describe",
        status: "ok",
        correlation_id: "corr-1",
        retry_count: 1,
        provenance: { endpoint: "https://hackathon.api.qloo.com" },
        credential: "trace-secret",
        api_key: "trace-api-secret"
      }]
    }
  );

  const raw = JSON.stringify(artifact);
  for (const marker of [
    "input-secret", "result-secret", "integration-secret",
    "seed-secret", "tag-secret", "trace-secret", "trace-api-secret"
  ]) {
    assert.equal(raw.includes(marker), false);
  }
  assert.equal(artifact.integration.harness_version, "0.1.26");
  assert.equal(artifact.trace[0].correlation_id, "corr-1");
  assert.equal(artifact.trace[0].retry_count, 1);
  assert.equal(artifact.evidence.groups.tags[0].name, "Tag");
});
