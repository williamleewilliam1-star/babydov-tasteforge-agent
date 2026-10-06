# TasteForge Agent — Devpost final draft

> Status: event key issued; deterministic runtime and 17/17 tests pass. Do **not** treat the submission as final until a real Qloo run has produced the redacted live artifact and the public deployment reports `qloo_configured=true`.

## Project name

TasteForge Agent

## One-line tagline

An evidence-first creative direction agent that turns cultural references into Qloo-grounded campaign strategy with a visible audit trail.

## Public links

- Demo: https://babydov-tasteforge-agent.vercel.app
- Source: https://github.com/williamleewilliam1-star/babydov-tasteforge-agent
- License: MIT

## What it does

Generic LLMs can make creative recommendations that sound plausible, but they cannot prove those recommendations belong near an audience's real cultural taste. TasteForge makes Qloo the evidence layer.

A user provides two to four cultural seeds — for example a fashion brand, artist, film and place — plus a campaign objective. TasteForge resolves the seeds through the official Qloo workflow, extracts shared cultural tags, recommends adjacent brands, films, artists and places, and turns the returned evidence into a campaign direction.
With four resolved seeds, TasteForge creates a **Creative Tension Map**. Seeds 1–2 form one cultural pole and seeds 3–4 form another. Qloo's official `compare_audiences` workflow identifies named shared affinities and differentiators. Shared affinities become bridges for the campaign; differentiators are preserved as intentional contrast instead of being averaged away.

The result includes the creative brief **and** the evidence behind it: operation status, Qloo correlation IDs, duration, warnings, provenance and the complete workflow trace. If a Qloo domain fails or a seed cannot be resolved, TasteForge leaves that evidence missing instead of silently replacing it with an LLM guess.

## Why Qloo is essential

TasteForge would not be the same product without Qloo.

The core product claim is not "AI can write a moodboard." It is "creative direction can be grounded in a real cross-domain taste graph and remain auditable."

Qloo provides:
- cultural seed resolution;
- shared cultural concepts;
- adjacent brand / movie / artist / place recommendations;
- audience comparison evidence for the Creative Tension Map.

TasteForge only synthesizes from those returned results.

## Agentic workflow

1. Human submits 2–4 cultural seeds and an objective.
2. `describe` resolves every seed.
3. At least two resolved seeds are required.
4. `entity_tags` finds cultural concepts across the resolved seed set.
5. `recommend` runs for brand, movie, artist and place.
6. For four-seed runs, `compare_audiences` compares two cultural poles.
7. TasteForge builds the Creative Tension Map from named Qloo evidence.
8. The brief is generated from those results.
9. The full Qloo operation trace stays visible.
## Technical implementation

- Node.js 22+
- Official `@qloo/qloo-harness@0.1.26`
- Qloo workflow contract `1.0.0`
- Qloo result schema `1.0-preview.1`
- No runtime transport fallback after a Qloo failure
- Vercel public deployment
- Server-side-only Qloo credential handling
- Deterministic regression suite
- Redacted live-artifact builder that allowlists evidence fields and excludes credentials by construction

## Reliability and responsible data

TasteForge treats cultural seeds as input data, not instructions. The Qloo key never reaches the browser, repository or public artifacts.

The project deliberately fails closed:
- unresolved seeds are not invented;
- failed recommendation domains stay empty;
- comparison evidence is not reconstructed from unrelated scores;
- no credential-shaped fields are allowed into the public live artifact.

## Testing

Current deterministic suite: 17/17 PASS.

The suite covers:
- exact official workflow ordering;
- official target types;
- minimum resolved-seed gate;
- missing credential behavior;
- one failed Qloo workflow without fabricated fallback;
- one-shot recovery from a transient Qloo rate limit before failing closed;
- missing-domain behavior;
- Qloo provenance and correlation IDs;
- explicit typed-seed disambiguation for the default live demo;
- Creative Tension Map evidence rules;
- credential exclusion from the live artifact.

Final submission gate:
```bash
npm run verify:qloo
npm test
npm run demo:live -- artifacts/qloo-live-demo.json
npm run deployment:record -- https://babydov-tasteforge-agent.vercel.app artifacts/deployment.json
npm run submission:strict
```
## Example judge flow

Objective:
> Create a quiet-luxury launch campaign for a cinematic mobile LUT collection.

Seeds:
- Jil Sander
- Brian Eno
- Lost in Translation
- Blade Runner

Market:
> Tokyo + global creative audience

A judge can inspect the cultural tags, cross-domain recommendations, Creative Tension Map, campaign moves and exact Qloo operation trace in one run.

## Current limitation before finalization

The public app is already deployed and reachable, and the Qloo event key was issued on 2026-10-06. Qloo execution remains intentionally disabled on the public deployment until that credential is installed server-side. The final Devpost submission must only be treated as judge-ready after:
1. the issued event key is installed as a Vercel server-side secret;
2. a real four-seed Qloo run succeeds;
3. the redacted live artifact is generated;
4. the deployment recorder verifies `qloo_configured=true`;
5. `npm run submission:strict` returns `ready=true`.

## Judging alignment

### Technological Implementation
Official Qloo harness, multiple Qloo workflows, provenance-preserving trace, deterministic submission gate, no silent fallback.

### Design
One coherent input-to-evidence-to-creative-direction experience, with the Qloo evidence visible instead of hidden behind generic model prose.

### Potential Impact
Creators and small brands often spend hours manually translating references into a coherent campaign direction. TasteForge makes the cultural reasoning inspectable and repeatable.

### Quality of the Idea
Instead of treating taste as one blended recommendation list, TasteForge uses Qloo's audience comparison to preserve both cultural bridges and deliberate tension between two creative poles.
