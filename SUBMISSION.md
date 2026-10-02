# TasteForge Agent — submission dossier

## Problem

Generic LLMs can write plausible creative briefs, but plausibility is not cultural evidence.
A creator or brand still has to guess whether a proposed film, artist, brand, or place actually belongs near the audience taste they are targeting.

TasteForge turns that problem into an evidence-bearing agent workflow.

## What Qloo changes

The product is intentionally not useful in the same way without Qloo:

1. Human provides 2–4 cultural seeds.
2. Qloo `/search` resolves those names to canonical entity IDs.
3. Qloo `/v2/insights` uses the resolved IDs as interest signals.
4. The agent queries five supported domains: destination, brand, movie, artist, place.
5. The creative brief is synthesized only from returned evidence.
6. Every tool step remains visible in the audit trace.
7. Missing or failed domains stay unresolved instead of being invented.

## Demo flow

Suggested live example:

- Objective: quiet-luxury campaign for a cinematic mobile LUT collection.
- Seeds: Jil Sander, Brian Eno, Lost in Translation, Kyoto.
- Market: Tokyo + global creative audience.
- Output: cross-domain taste map + campaign moves + exact Qloo trace.

## Technical design

```text
browser
  |
POST /api/forge
  |
validateInput
  |
Qloo /search x 2–4
  |
canonical entity IDs
  |
Qloo /v2/insights
  |-- destination
  |-- brand
  |-- movie
  |-- artist
  '-- place
  |
evidence-only synthesis
  |
brief + raw normalized evidence + trace
```

Hackathon keys default to `https://hackathon.api.qloo.com` and are sent only as `X-Api-Key`.

## Judging fit

### Technological Implementation
- Real Qloo Search + Insights endpoints.
- Multiple Qloo domains, not a single lookup.
- Graceful per-domain failure handling.
- Full tool trace.
- Unit + mocked end-to-end integration tests.

### Design
- One coherent input-to-brief experience.
- Evidence and synthesis are visually separated.
- Missing data is visible rather than hidden.

### Potential Impact
- Small creative teams spend less time guessing reference fit.
- The same architecture can support campaign planning, creative research, partnerships, and cultural localization.

### Quality of the Idea
- The output is not “recommend me something.”
- Qloo acts as the grounding layer for a creative director agent whose decisions remain inspectable.

## Current status

- Public GitHub repository: ready.
- MIT license: ready.
- Local application: working.
- Tests: 7/7 passing.
- Qloo hackathon API request: submitted.
- Qloo Devpost registration: complete.
- External live deployment: pending API key and hosting.
