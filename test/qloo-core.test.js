import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCreativeBrief,
  buildCreativeCoherence,
  cleanText,
  entityId,
  normalizeItems,
  validateInput
} from "../src/qloo-core.js";

test("cleanText trims, collapses whitespace, and bounds length", () => {
  assert.equal(cleanText("  Brian   Eno  "), "Brian Eno");
  assert.equal(cleanText("abcdef", 3), "abc");
});

test("normalizeItems tolerates Qloo workflow result shapes", () => {
  const payload = {
    schema_version: "1.0-preview.1",
    operation: "recommend",
    status: "ok",
    results: [
      { id: "urn:entity:artist:brian-eno", name: "Brian Eno", affinity: 0.91 },
      { entity_id: "urn:entity:brand:jil-sander", title: "Jil Sander", score: "0.82" }
    ]
  };
  const rows = normalizeItems(payload);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].id, "urn:entity:artist:brian-eno");
  assert.equal(rows[1].affinity, 0.82);
});

test("entityId supports nested entity records", () => {
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
});

test("creative brief cites evidence and leaves missing domains explicit", () => {
  const brief = buildCreativeBrief({
    objective: "Launch a product",
    seeds: [{ name: "A" }, { name: "B" }],
    groups: {
      tags: [{ name: "Minimalism" }],
      brands: [],
      films: [{ name: "Film A" }],
      artists: [],
      places: []
    }
  });
  assert.match(brief.thesis, /Minimalism/);
  assert.match(brief.moves[1].action, /Do not invent brand adjacency/);
  assert.match(brief.moves[2].action, /Leave music direction open/);
  assert.equal(brief.evidence_summary.tag_count, 1);
  assert.equal(brief.evidence_summary.film_count, 1);
  assert.equal(brief.evidence_summary.brand_count, 0);
});


test("creative coherence uses only named compare-audience evidence", () => {
  const coherence = buildCreativeCoherence({
    seeds: [
      { name: "Jil Sander" },
      { name: "Brian Eno" },
      { name: "Lost in Translation" },
      { name: "Kyoto" }
    ],
    groups: { tags: [{ name: "Minimalism" }, { name: "Ambient" }] },
    audienceComparison: {
      provenance: { endpoint: "/v2/analysis/compare" },
      results: {
        shared: ["Design culture", { name: "Editorial minimalism", affinity: 0.71 }],
        differentiators: {
          group_a: ["Functional restraint"],
          group_b: ["Cinematic nostalgia"]
        }
      }
    }
  });

  assert.equal(coherence.available, true);
  assert.deepEqual(coherence.poles.a, ["Jil Sander", "Brian Eno"]);
  assert.deepEqual(coherence.poles.b, ["Lost in Translation", "Kyoto"]);
  assert.deepEqual(coherence.shared.map(x => x.name), [
    "Design culture",
    "Editorial minimalism"
  ]);
  assert.deepEqual(coherence.differentiators.a.map(x => x.name), [
    "Functional restraint"
  ]);
  assert.deepEqual(coherence.differentiators.b.map(x => x.name), [
    "Cinematic nostalgia"
  ]);
  assert.deepEqual(coherence.supporting_codes, ["Minimalism", "Ambient"]);
});

test("creative coherence stays unavailable without official comparison evidence", () => {
  const coherence = buildCreativeCoherence({
    seeds: [
      { name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }
    ],
    groups: { tags: [{ name: "Minimalism" }] },
    audienceComparison: null
  });

  assert.equal(coherence.available, false);
  assert.match(coherence.reason, /not returned/i);
  assert.deepEqual(coherence.shared, []);
  assert.equal(coherence.differentiators.general.length, 0);
});

test("creative brief adds a Qloo-backed tension move without inventing a score", () => {
  const coherence = buildCreativeCoherence({
    seeds: [
      { name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }
    ],
    groups: { tags: [{ name: "Minimalism" }] },
    audienceComparison: {
      results: {
        shared: ["Quiet confidence"],
        differentiators: ["Analog warmth"]
      }
    }
  });
  const brief = buildCreativeBrief({
    objective: "Campaign",
    seeds: [{ name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }],
    groups: { tags: [], brands: [], films: [], artists: [], places: [] },
    coherence
  });

  assert.equal(brief.moves[0].lane, "Creative tension");
  assert.match(brief.moves[0].action, /Quiet confidence/);
  assert.match(brief.moves[0].action, /Analog warmth/);
  assert.equal(brief.evidence_summary.shared_affinity_count, 1);
  assert.equal(brief.evidence_summary.differentiator_count, 1);
  assert.doesNotMatch(brief.moves[0].action, /score|percent|%/i);
});
