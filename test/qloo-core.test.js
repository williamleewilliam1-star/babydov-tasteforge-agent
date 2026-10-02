import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCreativeBrief,
  cleanText,
  entityId,
  normalizeItems,
  validateInput
} from "../src/qloo-core.js";

test("cleanText trims, collapses whitespace, and bounds length", () => {
  assert.equal(cleanText("  Brian   Eno  "), "Brian Eno");
  assert.equal(cleanText("abcdef", 3), "abc");
});

test("normalizeItems tolerates multiple Qloo-like response shapes", () => {
  const payload = {
    results: [
      { entity_id: "urn:entity:artist:brian-eno", name: "Brian Eno", affinity: 0.91 },
      { id: "urn:entity:brand:jil-sander", title: "Jil Sander", score: "0.82" }
    ]
  };
  const rows = normalizeItems(payload);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].id, "urn:entity:artist:brian-eno");
  assert.equal(rows[1].affinity, 0.82);
});test("entityId supports nested entity records", () => {
  assert.equal(
    entityId({ entity: { id: "urn:entity:movie:test" } }),
    "urn:entity:movie:test"
  );
});

test("validateInput requires two seeds and caps at four", () => {
  assert.throws(() => validateInput({ seeds: ["only one"] }), /at least 2/i);
  const input = validateInput({
    seeds: ["A", "B", "C", "D", "E"],
    objective: "Launch campaign"
  });
  assert.deepEqual(input.seeds, ["A", "B", "C", "D"]);
  assert.equal(input.objective, "Launch campaign");
});test("creative brief cites evidence instead of inventing missing domains", () => {
  const brief = buildCreativeBrief({
    objective: "Launch a product",
    seeds: [{ name: "A" }, { name: "B" }],
    groups: {
      destinations: [{ name: "Kyoto" }],
      brands: [],
      films: [{ name: "Film A" }],
      artists: [],
      places: []
    }
  });
  assert.match(brief.thesis, /Kyoto/);
  assert.match(brief.moves[1].action, /Do not invent brand adjacency/);
  assert.match(brief.moves[2].action, /Leave music direction open/);
  assert.equal(brief.evidence_summary.film_count, 1);
  assert.equal(brief.evidence_summary.brand_count, 0);
});