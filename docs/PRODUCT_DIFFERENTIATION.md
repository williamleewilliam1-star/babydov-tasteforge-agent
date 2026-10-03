# TasteForge product differentiation

Research snapshot: 2026-10-03. This is a small public-GitHub sample, not a census of all hackathon entries.

## Public patterns already visible

Several early Qloo Agentic Hackathon repositories already demonstrate strong products in:
- relocation / neighborhood matching;
- travel planning;
- local venue / café marketing;
- generic Qloo recommendation wrappers and MCP servers;
- synthetic focus groups;
- product-launch / shipping assistants.

Examples reviewed:
- teddywasserman/tastebridge — relocation taste transfer;
- danielhagever/newcomer — neighborhood fit;
- me7ko-dev/rihla — culturally constrained travel;
- FaisalMT3/hayy — local café/restaurant marketing;
- AkshayJohn03/Quorum — grounded synthetic focus groups;
- hahahahahahahahah6/qloo-taste-mcp — generic MCP recommendation surface.

## TasteForge's chosen wedge

TasteForge is not trying to win by becoming another lifestyle planner.

The product question is narrower:

> How can a creative director combine two intentionally different pairs of cultural references without flattening the tension that made the brief interesting?

Four resolved seeds become two cultural poles:
- Pole A = seeds 1–2
- Pole B = seeds 3–4

The official Qloo `compare_audiences` workflow compares those poles in one operation.
Named shared affinities can become bridges.
Named differentiators remain deliberate contrast.
If Qloo returns no named comparison evidence, TasteForge does not invent a bridge or similarity score.

## Why this is Qloo-native

A generic LLM can describe why four famous references "feel" compatible, but that explanation is model prior.

TasteForge requires:
1. Qloo resolution of every seed that influences synthesis;
2. cross-domain Qloo recommendations for brand / movie / artist / place;
3. one official Qloo audience-comparison operation for the four-seed tension map;
4. complete trace/provenance shown to the user.

This makes the cultural relationship itself inspectable.

## Guardrail

Affinity values from separate Qloo calls are not treated as a shared numerical scale.
Creative Tension Map uses named shared/differentiating evidence returned by the single comparison operation, with raw comparison/provenance retained in the API response.
