import test from "node:test";
import assert from "node:assert/strict";
import { executeAgent } from "../api/forge.js";

const SUPPORTED = [
  "urn:entity:destination",
  "urn:entity:brand",
  "urn:entity:movie",
  "urn:entity:artist",
  "urn:entity:place"
];

function okJson(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

function installMock({ failType = null } = {}) {
  const calls = [];
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.QLOO_API_KEY;
  const previousBase = process.env.QLOO_BASE_URL;

  process.env.QLOO_API_KEY = "test-hackathon-key";
  delete process.env.QLOO_BASE_URL;

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    calls.push({ url, init });

    assert.equal(url.host, "hackathon.api.qloo.com");
    assert.equal(init.headers["x-api-key"], "test-hackathon-key");
    if (url.pathname === "/search") {
      const query = url.searchParams.get("query");
      assert.ok(query);
      return okJson({
        results: [{
          entity_id: "urn:entity:seed:" + encodeURIComponent(query),
          name: query,
          affinity: 1
        }]
      });
    }

    if (url.pathname === "/v2/insights") {
      const type = url.searchParams.get("filter.type");
      assert.ok(SUPPORTED.includes(type));
      const signals = url.searchParams.get("signal.interests.entities");
      assert.ok(signals?.includes("urn:entity:seed:"));
      if (type === failType) {
        return new Response(JSON.stringify({ error: { message: "not available" } }), {
          status: 403,
          headers: { "content-type": "application/json" }
        });
      }
      return okJson({
        results: [{
          entity_id: type + ":fixture",
          name: type.split(":").at(-1) + " fixture",
          affinity: 0.88
        }]
      });
    }

    throw new Error("Unexpected Qloo path: " + url.pathname);
  };

  return {
    calls,
    restore() {
      globalThis.fetch = previousFetch;
      if (previousKey === undefined) delete process.env.QLOO_API_KEY;
      else process.env.QLOO_API_KEY = previousKey;
      if (previousBase === undefined) delete process.env.QLOO_BASE_URL;
      else process.env.QLOO_BASE_URL = previousBase;
    }
  };
}
test("executeAgent uses hackathon Qloo routes and supported domains", async () => {
  const mock = installMock();
  try {
    const result = await executeAgent({
      seeds: ["Jil Sander", "Brian Eno"],
      objective: "Build a campaign",
      market: "Tokyo"
    });

    assert.equal(result.seeds.length, 2);
    assert.equal(mock.calls.filter(x => x.url.pathname === "/search").length, 2);
    assert.equal(mock.calls.filter(x => x.url.pathname === "/v2/insights").length, 5);

    const filterTypes = mock.calls
      .filter(x => x.url.pathname === "/v2/insights")
      .map(x => x.url.searchParams.get("filter.type"));
    assert.deepEqual(filterTypes, SUPPORTED);

    assert.equal(result.groups.destinations.length, 1);
    assert.equal(result.groups.brands.length, 1);
    assert.equal(result.groups.films.length, 1);
    assert.equal(result.groups.artists.length, 1);
    assert.equal(result.groups.places.length, 1);
    assert.equal(result.trace.filter(x => x.status === "ok").length, 7);
  } finally {
    mock.restore();
  }
});

test("one unsupported insight domain does not destroy the whole run", async () => {
  const mock = installMock({ failType: "urn:entity:destination" });
  try {
    const result = await executeAgent({
      seeds: ["Jil Sander", "Brian Eno"],
      objective: "Build a campaign",
      market: "Global"
    });

    assert.deepEqual(result.groups.destinations, []);
    assert.equal(result.groups.brands.length, 1);
    const failed = result.trace.find(
      x => x.step === "cross_domain_insight" && x.group === "destinations"
    );
    assert.equal(failed?.status, "error");
    assert.match(failed?.error || "", /HTTP 403/);
  } finally {
    mock.restore();
  }
});
