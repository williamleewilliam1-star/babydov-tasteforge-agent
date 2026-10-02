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

export function buildCreativeBrief({ objective, seeds, groups }) {
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

  return {
    title: "TasteForge cultural direction",
    objective: cleanText(objective, 500),
    seed_statement: seeds.map(seed => seed.name).join(" × "),
    thesis: thesisParts.join(" "),
    moves: [
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
      place_count: (groups.places || []).length
    }
  };
}

export function validateInput(body) {
  const rawSeeds = Array.isArray(body?.seeds) ? body.seeds : [];
  const seeds = rawSeeds.map(value => cleanText(value, 120)).filter(Boolean).slice(0, 4);
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
