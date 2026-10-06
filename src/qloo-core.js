export function cleanText(value, max = 200) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

export function extractArray(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ["results", "data", "entities", "items", "tags"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  for (const key of ["results", "data"]) {
    const nested = payload?.[key];
    if (!nested || typeof nested !== "object") continue;
    for (const inner of ["results", "entities", "items", "tags"]) {
      if (Array.isArray(nested?.[inner])) return nested[inner];
    }
  }
  return [];
}

export function entityId(item) {
  return cleanText(
    item?.entity_id ?? item?.entityId ?? item?.urn ?? item?.id ?? item?.entity?.id,
    500
  );
}

export function entityName(item) {
  return cleanText(
    item?.name ?? item?.title ?? item?.label ?? item?.entity?.name ?? item?.tag,
    240
  ) || "Untitled";
}

export function normalizeItem(item) {
  const affinityRaw =
    item?.affinity ?? item?.score ?? item?.weight ?? item?.metrics?.affinity ?? null;
  const affinity = Number.isFinite(Number(affinityRaw)) ? Number(affinityRaw) : null;
  return {
    id: entityId(item),
    name: entityName(item),
    type: cleanText(item?.type ?? item?.subtype ?? item?.entity?.type, 160) || null,
    affinity,
    image: cleanText(
      item?.image ?? item?.image_url ?? item?.properties?.image?.url,
      1000
    ) || null
  };
}

export function normalizeItems(payload, take = 6) {
  return extractArray(payload)
    .map(normalizeItem)
    .filter(item => item.id || item.name)
    .slice(0, take);
}

function firstNames(groups, key, take = 3) {
  return (groups[key] || []).slice(0, take).map(item => item.name);
}

function comparisonAtom(value) {
  if (typeof value === "string") return { name: cleanText(value, 240) };
  if (!value || typeof value !== "object") return null;
  const normalized = normalizeItem(value);
  if (normalized.name !== "Untitled" || normalized.id) return normalized;
  return null;
}

function comparisonList(value, take = 8) {
  if (!Array.isArray(value)) return [];
  return value.map(comparisonAtom).filter(Boolean).slice(0, take);
}

function firstComparisonList(source, keys) {
  if (!source || typeof source !== "object") return [];
  for (const key of keys) {
    const rows = comparisonList(source[key]);
    if (rows.length) return rows;
  }
  return [];
}

export function buildCreativeCoherence({ seeds, audienceComparison, groups }) {
  const poles = {
    a: (seeds || []).slice(0, 2).map(seed => seed.name),
    b: (seeds || []).slice(2, 4).map(seed => seed.name)
  };
  if ((seeds || []).length !== 4) {
    return {
      mode: "single-pole",
      available: false,
      reason: "Creative Tension Map requires exactly four resolved seeds.",
      poles,
      shared: [],
      differentiators: { a: [], b: [], general: [] },
      supporting_codes: firstNames(groups || {}, "tags", 6)
    };
  }

  const raw = audienceComparison?.results;
  if (!audienceComparison || !raw || typeof raw !== "object") {
    return {
      mode: "dual-pole",
      available: false,
      reason: "Qloo audience comparison evidence was not returned.",
      poles,
      shared: [],
      differentiators: { a: [], b: [], general: [] },
      supporting_codes: firstNames(groups || {}, "tags", 6)
    };
  }

  const shared = firstComparisonList(raw, ["shared", "common", "overlap", "similarities"]);
  const diffSource = raw.differentiators ?? raw.differences ?? raw.distinctive ?? null;
  let diffA = [];
  let diffB = [];
  let diffGeneral = [];

  if (Array.isArray(diffSource)) {
    diffGeneral = comparisonList(diffSource);
  } else if (diffSource && typeof diffSource === "object") {
    diffA = firstComparisonList(diffSource, ["group_a", "a", "left", "first"]);
    diffB = firstComparisonList(diffSource, ["group_b", "b", "right", "second"]);
    diffGeneral = firstComparisonList(diffSource, ["general", "items", "results"]);
  }

  return {
    mode: "dual-pole",
    available: true,
    reason: null,
    poles,
    shared,
    differentiators: { a: diffA, b: diffB, general: diffGeneral },
    supporting_codes: firstNames(groups || {}, "tags", 6),
    provenance: audienceComparison.provenance || null,
    interpretation: audienceComparison.interpretation || null
  };
}

export function buildCreativeBrief({ objective, seeds, groups, coherence = null }) {
  const tags = firstNames(groups, "tags", 4);
  const brands = firstNames(groups, "brands", 3);
  const films = firstNames(groups, "films", 3);
  const artists = firstNames(groups, "artists", 3);
  const places = firstNames(groups, "places", 3);

  const thesisParts = [
    tags.length ? `Cultural codes: ${tags.join(", ")}.` : "",
    brands.length ? `Brand adjacency: ${brands.join(", ")}.` : "",
    films.length ? `Cinematic language: ${films.join(", ")}.` : ""
  ].filter(Boolean);

  const sharedNames = (coherence?.shared || []).map(item => item.name).filter(Boolean);
  const diffNames = [
    ...(coherence?.differentiators?.a || []),
    ...(coherence?.differentiators?.b || []),
    ...(coherence?.differentiators?.general || [])
  ].map(item => item.name).filter(Boolean);
  const coherenceMove = coherence?.available
    ? {
        lane: "Creative tension",
        action: sharedNames.length
          ? `Use ${sharedNames.slice(0, 3).join(", ")} as the bridge between the two cultural poles${diffNames.length ? `; preserve contrast around ${diffNames.slice(0, 3).join(", ")}` : ""}.`
          : diffNames.length
            ? `Treat the two seed pairs as an intentional contrast; Qloo differentiates them around ${diffNames.slice(0, 3).join(", ")}.`
            : "Qloo returned an audience comparison, but TasteForge does not invent a bridge when the comparison has no named shared or differentiating affinities."
      }
    : null;

  return {
    title: "TasteForge cultural direction",
    objective: cleanText(objective, 500),
    seed_statement: seeds.map(seed => seed.name).join(" × "),
    thesis: thesisParts.join(" "),
    moves: [
      ...(coherenceMove ? [coherenceMove] : []),
      {
        lane: "Visual world",
        action: films.length
          ? `Use the visual grammar suggested by ${films.slice(0, 2).join(" + ")} as references, not copies.`
          : "Hold visual direction until Qloo returns film evidence."
      },
      {
        lane: "Styling & brand fit",
        action: brands.length
          ? `Bias styling and partnerships toward the taste neighborhood around ${brands.join(", ")}.`
          : "Do not invent brand adjacency without Qloo evidence."
      },
      {
        lane: "Sound",
        action: artists.length
          ? `Build the sonic brief around the audience adjacency of ${artists.join(", ")}.`
          : "Leave music direction open until Qloo returns artist evidence."
      },
      {
        lane: "Place & activation",
        action: places.length
          ? `Use ${places.join(", ")} as place/activation references where context permits.`
          : "Avoid location claims without Qloo place evidence."
      }
    ],
    evidence_summary: {
      seed_count: seeds.length,
      tag_count: (groups.tags || []).length,
      brand_count: (groups.brands || []).length,
      film_count: (groups.films || []).length,
      artist_count: (groups.artists || []).length,
      place_count: (groups.places || []).length,
      shared_affinity_count: sharedNames.length,
      differentiator_count: diffNames.length
    }
  };
}

const QLOO_SEED_TYPES = new Set(["brand", "artist", "movie", "place"]);

function normalizeSeedInput(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const name = cleanText(value.name ?? value.entity ?? "", 120);
    const type = cleanText(value.type ?? "", 32).toLowerCase();
    if (!name) return null;
    return QLOO_SEED_TYPES.has(type) ? { name, type } : name;
  }
  const name = cleanText(value, 120);
  return name || null;
}

export function validateInput(body) {
  const rawSeeds = Array.isArray(body?.seeds) ? body.seeds : [];
  const seeds = rawSeeds.map(normalizeSeedInput).filter(Boolean).slice(0, 4);
  if (seeds.length < 2) throw new Error("Provide at least 2 cultural seeds.");
  return {
    seeds,
    objective: cleanText(
      body?.objective || "Create a culturally grounded campaign direction.",
      500
    ),
    market: cleanText(body?.market || "", 120)
  };
}
