# TasteForge Agent — submission dossier

## Problem

Generic LLMs can write plausible creative briefs, but plausibility is not cultural evidence.
A creator or brand still has to guess whether a proposed film, artist, brand, or place actually belongs near the audience taste they are targeting.

TasteForge turns that problem into an evidence-bearing Qloo agent workflow.

## Product flow

1. Human supplies 2–4 cultural seeds and a campaign objective.
2. Official Qloo `describe` resolves each seed.
3. At least two resolved seeds are required before synthesis.
4. Official Qloo `entity_tags` extracts cultural concepts shared by the seeds.
5. Official Qloo `recommend` queries adjacent brands, movies, artists, and places.
6. With exactly four resolved seeds, official `compare_audiences` compares seeds 1–2 against seeds 3–4 as two cultural poles.
7. TasteForge normalizes the returned evidence and builds a Creative Tension Map from named shared affinities and differentiators only.
8. The creative brief is synthesized only from returned Qloo results.
9. Every operation stays visible with status, correlation ID, duration, warnings, and provenance.
10. Missing/failed workflows remain missing instead of being replaced by model guesses.

## Qloo surface

Pinned runtime:

- `@qloo/qloo-harness@0.1.26`
- workflow contract `1.0.0`
- result schema `1.0-preview.1`
- endpoint `https://hackathon.api.qloo.com`
- fallback `none`

The application does not silently switch to another transport after Qloo failure.

## Demo media

Verified public result state:

![TasteForge live Qloo result](docs/tasteforge-live-result.png)

The screenshot was captured from the production deployment after a real typed four-seed Qloo run completed with 10 recorded workflow steps and a visible Creative Tension Map. It contains no API key or private credential.

Pre-key UI evidence is retained separately at `docs/tasteforge-ui-ready.png` for provenance.

## Demo flow

Suggested example:

- Objective: quiet-luxury campaign for a cinematic mobile LUT collection.
- Typed seeds: Jil Sander (brand), Brian Eno (artist), Lost in Translation (movie), Blade Runner (movie).
- Market: Tokyo + global creative audience.
- Output: cultural tags + cross-domain taste map + campaign moves + exact Qloo workflow trace.

## Architecture

```text
browser
  |
POST /api/forge
  |
validateInput
  |
official @qloo/qloo-harness executor
  |-- describe(seed) x 2–4
  |-- entity_tags(all seeds)
  |-- recommend(brand)
  |-- recommend(movie)
  |-- recommend(artist)
  |-- recommend(place)
  '-- compare_audiences(pair A vs pair B) [4-seed runs]
  |
Creative Tension Map
  |-- named shared affinities -> bridges
  '-- named differentiators -> preserved contrast
  |
versioned Qloo result envelopes
  |-- status
  |-- correlation id
  |-- warnings
  '-- provenance
  |
evidence-only synthesis
  |
brief + normalized evidence + trace
```

## Responsible data handling

- No personal data is requested or sent to Qloo.
- API key is server-side only.
- Seeds/objective/market are length-bounded.
- Failed Qloo workflows are explicit in the trace.
- No database is required and the MVP does not persist user prompts/results.
- Qloo response evidence and TasteForge synthesis are visually separated.

## Known limitations

- Qloo results describe group-level taste relationships; they do not predict an individual person's behavior.
- TasteForge only synthesizes the domains returned by the official Qloo workflows; an empty or failed domain remains unresolved.
- Creative Tension Map appears only for four resolved seeds and only when official audience-comparison evidence exists.
- TasteForge does not compare affinity numbers across separate Qloo calls; bridges/tensions come from the single comparison operation.
- Seed resolution can be ambiguous when a short name maps to multiple cultural entities; the demo now sends explicit Qloo entity types to make the default judge flow deterministic.
- The current brief is intentionally compact and does not replace human brand/legal review.
- The MVP stores no history, user profile, or campaign workspace.
- The real typed four-seed production run is complete and preserved in `artifacts/qloo-live-demo.json`; transient Qloo rate limits are retried once and otherwise fail closed.

## Reproducibility

Without a live key:

```bash
npm ci
npm run verify:qloo
npm test
```

The tests inject the official executor boundary and verify operation ordering, partial failure, ambiguous seeds, result normalization, and no-fabrication behavior.

With a live key:

```bash
QLOO_API_KEY=... \
QLOO_BASE_URL=https://hackathon.api.qloo.com \
QLOO_TRUSTED_BASE_URL=https://hackathon.api.qloo.com \
npm run dev
```

The final redacted live-run artifact records workflow IDs, result status/count, correlation IDs and Qloo provenance but never credentials. The artifact builder and credential-exclusion regression test are implemented; the issued event key is server-side only.

## Current status

- Public GitHub repository: ready.
- MIT license: ready.
- Qloo Devpost registration: complete.
- Qloo API key: issued on 2026-10-06 and installed server-side in Vercel production.
- Official Qloo workflow migration: merged to main and CI-validated.
- Redacted live-demo artifact tooling: ready and tested.
- Judging-criteria alignment: documented and machine-checked.
- Real Qloo live artifact: complete; 4/4 seeds resolved, 10 workflow steps recorded, `compare_audiences` successful.
- Public Vercel deployment: live at `https://babydov-tasteforge-agent.vercel.app`; current health reports `qloo_configured=true`.
- Strict final gate: PASS — `npm run submission:strict` returns `ready=true`.
