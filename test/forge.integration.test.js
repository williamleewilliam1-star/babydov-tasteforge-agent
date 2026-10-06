import test from "node:test";
import assert from "node:assert/strict";
import { executeAgent } from "../api/forge.js";

function execution(operation, input, index) {
  const result = {
    schema_version: "1.0-preview.1",
    operation,
    status: "ok",
    summary: `${operation} fixture`,
    warnings: [],
    provenance: {
      contract_version: "1.0.0",
      endpoint: "https://hackathon.api.qloo.com",
      strategy: "test-fixture"
    }
  };

  if (operation === "describe") {
    result.results = [{
      id: `urn:entity:fixture:${encodeURIComponent(input.entity)}`,
      name: input.entity,
      type: "urn:entity:fixture",
      affinity: 1
    }];
  } else if (operation === "entity_tags") {
    result.results = [{
      id: "urn:tag:minimalism",
      name: "Minimalism",
      type: "urn:tag",
      affinity: 0.91
    }];
  } else if (operation === "recommend") {
    result.results = [{
      id: `urn:entity:${input.target_type}:fixture`,
      name: `${input.target_type} fixture`,
      type: `urn:entity:${input.target_type}`,
      affinity: 0.88
    }];
  }

  return {
    operation,
    transport: { kind: "direct", name: "fixture", remote: false },
    correlationId: `corr-${index}`,
    durationMs: 5 + index,
    result
  };
}

function fakeExecutor({ failTarget = null } = {}) {
  const calls = [];
  return {
    calls,
    transport: { kind: "direct", name: "fixture", remote: false },
    resolution: {
      name: "native",
      tag_strategy: "qloo",
      uses_model: false,
      fallback: "none"
    },
    async execute(operation, input) {
      calls.push({ operation, input });
      if (operation === "recommend" && input.target_type === failTarget) {
        const error = new Error("fixture upstream failure");
        error.code = "QLOO_UPSTREAM";
        error.layer = "qloo";
        error.retryable = true;
        error.recovery = "retry later";
        throw error;
      }
      return execution(operation, input, calls.length);
    }
  };
}

test("TasteForge uses only official Qloo workflows", async () => {
  const executor = fakeExecutor();
  const result = await executeAgent({
    seeds: ["Jil Sander", "Brian Eno"],
    objective: "Build a campaign",
    market: "Tokyo"
  }, { executor });

  assert.deepEqual(
    executor.calls.map(call => call.operation),
    ["describe", "describe", "entity_tags", "recommend", "recommend", "recommend", "recommend"]
  );

  const recommendCalls = executor.calls.filter(call => call.operation === "recommend");
  assert.deepEqual(
    recommendCalls.map(call => call.input.target_type),
    ["brand", "movie", "artist", "place"]
  );
  assert.ok(recommendCalls.every(call => call.input.explain === true));
  assert.ok(recommendCalls.every(call => call.input.signals.length === 2));

  assert.equal(result.integration.surface, "@qloo/qloo-harness");
  assert.equal(result.integration.workflow_contract_version, "1.0.0");
  assert.equal(result.integration.result_schema_version, "1.0-preview.1");
  assert.equal(result.integration.fallback, "none");

  assert.equal(result.seeds.length, 2);
  assert.equal(result.groups.tags[0].name, "Minimalism");
  assert.equal(result.groups.brands[0].name, "brand fixture");
  assert.equal(result.groups.films[0].name, "movie fixture");
  assert.equal(result.groups.artists[0].name, "artist fixture");
  assert.equal(result.groups.places[0].name, "place fixture");

  assert.equal(result.trace.length, 7);
  assert.ok(result.trace.every(row => row.correlation_id));
  assert.ok(result.trace.every(row => row.provenance));
});

test("typed seed inputs disambiguate official describe workflows", async () => {
  const executor = fakeExecutor();
  await executeAgent({
    seeds: [
      { name: "Jil Sander", type: "brand" },
      { name: "Brian Eno", type: "artist" }
    ],
    objective: "Build a campaign",
    market: "Tokyo"
  }, { executor });

  const describeCalls = executor.calls.filter(call => call.operation === "describe");
  assert.deepEqual(describeCalls.map(call => call.input), [
    { entity: "Jil Sander", type: "brand" },
    { entity: "Brian Eno", type: "artist" }
  ]);
});

test("transient Qloo rate limit is retried once", async () => {
  const executor = fakeExecutor();
  const original = executor.execute.bind(executor);
  let attempts = 0;
  let injected = false;

  executor.execute = async (operation, input) => {
    attempts += 1;
    if (!injected && operation === "describe" && input.entity === "Jil Sander") {
      injected = true;
      const error = new Error("fixture rate limit");
      error.code = "QLOO_RATE_LIMIT";
      error.layer = "qloo";
      error.retryable = true;
      error.recovery = "wait and retry";
      throw error;
    }
    return original(operation, input);
  };

  const result = await executeAgent({
    seeds: [
      { name: "Jil Sander", type: "brand" },
      { name: "Brian Eno", type: "artist" }
    ],
    objective: "Build a campaign",
    market: "Tokyo"
  }, { executor });

  assert.equal(result.seeds.length, 2);
  assert.equal(result.trace[0].retry_count, 1);
  assert.equal(attempts, 8);
});

test("one failed official workflow does not fabricate that domain", async () => {
  const executor = fakeExecutor({ failTarget: "brand" });
  const result = await executeAgent({
    seeds: ["Jil Sander", "Brian Eno"],
    objective: "Build a campaign",
    market: "Global"
  }, { executor });

  assert.deepEqual(result.groups.brands, []);
  assert.equal(result.groups.films.length, 1);
  assert.equal(result.groups.artists.length, 1);
  assert.equal(result.groups.places.length, 1);

  const failed = result.trace.find(
    row => row.operation === "recommend" && row.target_type === "brand"
  );
  assert.equal(failed?.status, "error");
  assert.equal(failed?.code, "QLOO_UPSTREAM");
  assert.equal(failed?.layer, "qloo");
  assert.equal(failed?.retryable, true);
  assert.equal(failed?.recovery, "retry later");
});

test("fewer than two resolved describe workflows blocks synthesis", async () => {
  let described = 0;
  const executor = fakeExecutor();
  const original = executor.execute.bind(executor);
  executor.execute = async (operation, input) => {
    if (operation === "describe") {
      described += 1;
      if (described === 2) {
        return {
          operation,
          transport: executor.transport,
          correlationId: "corr-needs-input",
          durationMs: 3,
          result: {
            schema_version: "1.0-preview.1",
            operation,
            status: "needs_input",
            warnings: ["ambiguous seed"],
            provenance: { contract_version: "1.0.0" }
          }
        };
      }
    }
    return original(operation, input);
  };

  await assert.rejects(
    executeAgent({
      seeds: ["Clear Seed", "Ambiguous Seed"],
      objective: "Build a campaign",
      market: "Global"
    }, { executor }),
    /could not resolve at least two seeds/i
  );
});

test("missing Qloo credential surfaces the official auth contract", async () => {
  await assert.rejects(
    executeAgent({
      seeds: ["Jil Sander", "Brian Eno"],
      objective: "Build a campaign",
      market: "Global"
    }, { env: {} }),
    error => {
      assert.equal(error.code, "QLOO_AUTH");
      assert.equal(error.layer, "qloo");
      assert.equal(error.retryable, false);
      assert.match(error.recovery, /QLOO_API_KEY|qloo setup --qloo/);
      return true;
    }
  );
});
