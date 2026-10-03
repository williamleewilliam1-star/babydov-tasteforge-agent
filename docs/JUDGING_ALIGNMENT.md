# Qloo Agentic Hackathon — judging alignment

TasteForge maps directly to the four equally weighted Qloo judging criteria.

## Technological Implementation

Qloo is the source of cultural evidence, not an ornamental API call.

The agent uses the official `@qloo/qloo-harness` workflow boundary and pins the event contract/version. It resolves user seeds, requires at least two real matches, extracts shared tags, then queries adjacent brands, movies, artists and places. A failed/empty Qloo workflow remains failed/empty instead of being replaced by a generic model guess.

Evidence:
- `docs/QLOO_WORKFLOW_CONTRACT.md`
- `src/qloo-agent.js`
- `scripts/verify-qloo-runtime.mjs`
- `test/`
## Design

The product separates three layers visually and structurally:
1. user objective + cultural seeds;
2. Qloo evidence and operation trace;
3. campaign synthesis derived from that evidence.

The user can see status, warnings, correlation/provenance information and unresolved domains rather than receiving a single opaque answer.

The credential-pending UI is already captured in `docs/tasteforge-ui-ready.png`. A live result-state artifact is intentionally deferred until a real event credential is available.
## Potential Impact

Target user: creators, photographers, small brands and creative teams who can describe a desired cultural territory but do not have a research department or proprietary consumer graph.

The concrete problem is not copywriting. It is reducing unsupported cultural guesses when choosing references across film, music, fashion, travel and brand adjacency.

TasteForge keeps a human in control of the final creative decision while making the evidence-gathering step faster and inspectable.
## Quality of the Idea

A generic LLM can generate a plausible moodboard from the same seed names, but it cannot provide Qloo taste-graph evidence for why cross-domain references belong together.

TasteForge is intentionally designed so that removing Qloo removes the product's main value: the agent will refuse to synthesize from fewer than two resolved seeds and will leave missing domains unresolved.

That makes cultural intelligence the differentiator rather than a decorative enrichment call.

## Submission-critical proof still pending

The public repository, license, tests, official workflow contract and demo media are ready. The two remaining dynamic proofs are:
- a redacted real Qloo live-run artifact produced with the event API key;
- an externally hosted functional demo that judges can use end-to-end.
