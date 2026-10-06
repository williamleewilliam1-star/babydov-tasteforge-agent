# Public deployment status

Pre-key deployment verified on 2026-10-03. Qloo event credential issued on 2026-10-06.

## Public URL

https://babydov-tasteforge-agent.vercel.app

## Verified production state

The production deployment is publicly reachable without Vercel authentication:

- `/` returns HTTP 200 and the TasteForge UI.
- `/api/forge` returns HTTP 200 JSON health.
- deployed service reports `integration=@qloo/qloo-harness`;
- deployed harness version reports `0.1.26`;
- `qloo_configured=true` after the issued hackathon key was installed as a Production secret and the deployment was rebuilt.

The deployment now satisfies the configuration prerequisite for the final deployment receipt. The remaining strict-gate requirement is a real end-to-end typed Qloo run plus its redacted live artifact.

## Remaining finalization

1. run the typed four-seed Qloo demo;
2. write the redacted live artifact;
3. write the durable deployment receipt;
4. run `npm run submission:strict`.

No credential is stored in this document, the repository, or public artifacts.