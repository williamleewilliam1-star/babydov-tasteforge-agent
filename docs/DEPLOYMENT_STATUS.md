# Public deployment status

Verified production state on **2026-10-06**.

## Public URL

https://babydov-tasteforge-agent.vercel.app

## Production verification

The deployment is publicly reachable without Vercel authentication:

- `/` returns HTTP 200 and the TasteForge UI;
- `/api/forge` returns HTTP 200 JSON health;
- deployed service reports `integration=@qloo/qloo-harness`;
- harness version is `0.1.26`;
- Qloo base URL is `https://hackathon.api.qloo.com`;
- `qloo_configured=true`.

The issued Qloo hackathon key is installed only as a Vercel Production secret. It is not present in the browser, repository, live artifact, screenshot, or deployment receipt.

## Verified live execution

The production app completed the typed four-seed judge flow with:

- 4/4 resolved seeds;
- 10 workflow steps;
- successful cross-domain recommendations;
- successful `compare_audiences`;
- a visible Creative Tension Map;
- one transient Qloo rate-limit recovered by the bounded one-shot retry path.

## Durable deployment receipt

`artifacts/deployment.json` records:

- schema `tasteforge.deployment.v1`;
- checked URL `https://babydov-tasteforge-agent.vercel.app/`;
- deployed commit `54ce236a9ae51b7c0f09066a9959feed66e68979`;
- root HTTP 200;
- API HTTP 200;
- `qloo_configured=true`.

## Submission gate

`npm run submission:strict` returns `ready=true`.

Evidence:

- `artifacts/qloo-live-demo.json`;
- `artifacts/deployment.json`;
- `docs/tasteforge-live-result.png`.

No credential is stored in this document, the repository, or public artifacts.
