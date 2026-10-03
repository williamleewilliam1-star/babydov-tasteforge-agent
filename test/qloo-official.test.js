import test from "node:test";
import assert from "node:assert/strict";
import { executeTasteForge } from "../src/qloo-official.js";

function execution(operation, result, n) {
  return {
    operation,
    transport: { kind: "direct", name: "mock-direct", remote: false },
    correlationId: `corr-${n}`,
    durationMs: n,
    result: {
      schema_version: "1.0-preview.1",
      operation,
      status: "ok",
      provenance: { source: "mock", endpoint: "/mock", documentation: "test" },
      ...result
    }
  };
}

test("official workflow path resolves seeds before grounded recommendations", async () => {
  const calls = [];
  const executor = {
    transport: { kind: "direct", name: "mock-direct" },
    async execute(operation, input) {
      calls.push({ operation, input });
      const n = calls.length;
      if (operation === "describe") {
        return execution(operation, {
          results: [{
            id: `urn:entity:test:${encodeURIComponent(input.entity)}`,
            name: input.entity,
            type: "urn:entity:test",
            affinity: 1
          }],
          result_count: 1
        }, n);
      }
      if (operation === "entity_tags") {
        return execution(operation, {
          results: [
            { id: "urn:tag:minimal", name: "Minimalism" },
            { id: "urn:tag:cinematic", name: "Cinematic" }
          ],
          result_count: 2
        }, n);
      }
      if (operation === "recommend") {
        return execution(operation, {
          interpretation: { target_type: input.target_type, signals: input.signals },
          results: [
            { id: `urn:entity:${input.target_type}:1`, name: `${input.target_type}-one`, affinity: 0.91 },
            { id: `urn:entity:${input.target_type}:2`, name: `${input.target_type}-two`, affinity: 0.82 }
          ],
          result_count: 2
        }, n);
      }
      if (operation === "compare_audiences") {
        return execution(operation, {
          interpretation: { group_a: input.group_a, group_b: input.group_b },
          results: {
            shared: ["Editorial restraint"],
            differentiators: {
              group_a: ["Functional minimalism"],
              group_b: ["Cinematic nostalgia"]
            }
          }
        }, n);
      }
      throw new Error(`unexpected operation ${operation}`);
    }
  };

  const result = await executeTasteForge({
    seeds: ["Jil Sander", "Brian Eno", "Lost in Translation", "Kyoto"],
    objective: "Build a launch campaign",
    market: "Tokyo"
  }, { executor });

  assert.deepEqual(
    calls.map(x => x.operation),
    [
      "describe", "describe", "describe", "describe",
      "entity_tags",
      "recommend", "recommend", "recommend", "recommend",
      "compare_audiences"
    ]
  );
  assert.deepEqual(
    calls.filter(x => x.operation === "recommend").map(x => x.input.target_type),
    ["brand", "movie", "artist", "place"]
  );
  assert.equal(result.trace.length, 10);
  assert.equal(result.groups.tags.length, 2);
  assert.equal(result.groups.brands.length, 2);
  assert.equal(result.seeds.length, 4);
  assert.equal(result.audience_comparison.operation, "compare_audiences");
  assert.equal(result.creative_coherence.available, true);
  assert.deepEqual(
    result.creative_coherence.shared.map(item => item.name),
    ["Editorial restraint"]
  );
  assert.deepEqual(
    result.creative_coherence.differentiators.a.map(item => item.name),
    ["Functional minimalism"]
  );
  assert.deepEqual(
    result.creative_coherence.differentiators.b.map(item => item.name),
    ["Cinematic nostalgia"]
  );
  assert.equal(result.brief.moves[0].lane, "Creative tension");
  assert.match(result.brief.moves[0].action, /Editorial restraint/);
  assert.equal(result.limitations.length, 4);
  assert.match(result.brief.thesis, /Minimalism/);
});
