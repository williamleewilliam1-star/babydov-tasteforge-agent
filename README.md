# TasteForge Agent

TasteForge is an evidence-first cultural intelligence agent for creative direction, built on the official Qloo Agentic Hackathon workflow contract.

Give it 2–4 cultural seeds (artists, brands, films, places) and a campaign objective. TasteForge asks Qloo to resolve and describe those seeds, extract shared cultural tags, and recommend adjacent brands, films, artists, and places. The creative brief is synthesized only from returned Qloo evidence.

## Why Qloo matters

A generic LLM can produce a plausible moodboard. TasteForge deliberately does something different:

- Qloo resolves the cultural references.
- Qloo supplies cross-domain taste evidence.
- TasteForge exposes operation status, correlation IDs, timing, warnings, and provenance.
- A failed domain stays empty instead of being replaced with an invented recommendation.

## Official Qloo workflow

Runtime dependency: `@qloo/qloo-harness@0.1.26`.

Pinned workflow contract:

- contract: `1.0.0`
- result schema: `1.0-preview.1`
- fallback: none

Pipeline:

1. `describe` each seed through the official Qloo executor.
2. Require at least two successfully resolved seeds.
3. `entity_tags` over the seed set for cultural concepts.
4. `recommend(target_type=brand)`.
5. `recommend(target_type=movie)`.
6. `recommend(target_type=artist)`.
7. `recommend(target_type=place)`.
8. Build the brief only from those workflow results.
9. Return normalized evidence plus the complete workflow trace.

See `docs/QLOO_WORKFLOW_CONTRACT.md`.

## Local run

Requires Node.js 20+.

```bash
cp .env.example .env
# add QLOO_API_KEY to .env
set -a; source .env; set +a
npm install
npm test
npm run dev
```

Open http://127.0.0.1:8788

## Environment

```bash
QLOO_API_KEY=...
QLOO_BASE_URL=https://hackathon.api.qloo.com
QLOO_TRUSTED_BASE_URL=https://hackathon.api.qloo.com
```

The key stays server-side. There is no runtime transport fallback.

## API

`POST /api/forge`

```json
{
  "objective": "Create a quiet-luxury launch campaign for a cinematic LUT collection",
  "market": "Tokyo + global creative audience",
  "seeds": ["Jil Sander", "Brian Eno", "Lost in Translation", "Kyoto"]
}
```

The response contains:

- Qloo-resolved seed evidence
- cultural tags
- brand / film / artist / place recommendations
- evidence-first creative brief
- official workflow metadata and provenance
- complete tool trace

## Tests

The deterministic test suite does not require an API key. It injects a fake implementation of the official Qloo executor and verifies:

- exact workflow ordering
- official target types
- no silent fallback
- provenance/correlation IDs in the trace
- one failed domain does not fabricate evidence
- ambiguous/unresolved seeds block synthesis
- creative brief missing-data behavior

Live Qloo tests are added only after the hackathon key is available and must never print the key.

## Hackathon

Qloo Agentic Hackathon · Sep 30–Oct 30, 2026.

API-key request: submitted and confirmed. The key is expected by email and is not committed to the repository.

## License

MIT
