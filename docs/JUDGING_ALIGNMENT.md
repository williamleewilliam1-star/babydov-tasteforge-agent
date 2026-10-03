# Qloo Agentic Hackathon — judging alignment

TasteForge maps directly to the four equally weighted Qloo judging criteria.

## Technological Implementation

Qloo is the source of cultural evidence, not an ornamental API call.

The agent uses the official `@qloo/qloo-harness` workflow boundary and pins the event contract/version. It resolves user seeds, requires at least two real matches, extracts shared tags, then queries adjacent brands, movies, artists and places. Four-seed runs additionally execute the official `compare_audiences` workflow once, producing a Creative Tension Map from named shared/differentiating evidence. A failed/empty Qloo workflow remains failed/empty instead of being replaced by a generic model guess.

Evidence:
- `docs/QLOO_WORKFLOW_CONTRACT.md`
- `src/qloo-official.js`
- `src/qloo-core.js`
- `scripts/verify-qloo-runtime.mjs`
- `test/`
## Design

The product separates four layers visually and structurally:
1. user objective + cultural seeds;
2. Qloo-resolved evidence and operation trace;
3. a four-seed Creative Tension Map showing the two cultural poles plus shared affinities/differentiators from one official audience-comparison operation;
4. campaign synthesis derived from that evidence.

The user can see status, warnings, correlation/provenance information and unresolved domains rather than receiving a single opaque answer.

The credential-pending UI is already captured in `docs/tasteforge-ui-ready.png`. A live result-state artifact is intentionally deferred until a real event credential is available.
## Potential Impact

Target user: creators, photographers, small brands and creative teams who can describe a desired cultural territory but do not have a research department or proprietary consumer graph.

The concrete problem is not copywriting. It is reducing unsupported cultural guesses when choosing references across film, music, fashion, travel and brand adjacency.

TasteForge keeps a human in control of the final creative decision while making the evidence-gathering step faster and inspectable.
## Quality of the Idea

A generic LLM can generate a plausible moodboard from the same seed names, but it cannot provide Qloo taste-graph evidence for why cross-domain references belong together.

Public early hackathon projects already cover relocation, local-venue marketing, generic recommendation wrappers and synthetic focus groups. TasteForge takes a narrower creative-director problem: **how do two intentionally different pairs of cultural references coexist in one campaign without flattening the tension that made the brief interesting?** The four-seed path answers that with Qloo `compare_audiences`, not a model-invented similarity score.

TasteForge is intentionally designed so that removing Qloo removes the product's main value: the agent will refuse to synthesize from fewer than two resolved seeds, will leave missing domains unresolved, and will not invent a bridge when the comparison returns no named shared evidence.

That makes cultural intelligence the differentiator rather than a decorative enrichment call.

## Submission-critical proof still pending

The public repository, license, tests, official workflow contract and demo media are ready. The two remaining dynamic proofs are:
- a redacted real Qloo live-run artifact produced with the event API key;
- an externally hosted functional demo that judges can use end-to-end.
