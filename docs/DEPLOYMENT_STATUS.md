# Public deployment status

Verified on 2026-10-03.

## Public URL

https://babydov-tasteforge-agent.vercel.app

## Verified pre-key state

The production deployment is publicly reachable without Vercel authentication:

- `/` returns HTTP 200 and the TasteForge UI.
- `/api/forge` returns HTTP 200 JSON health.
- deployed service reports `integration=@qloo/qloo-harness`;
- deployed harness version reports `0.1.26`;
- `qloo_configured=false` until the personal hackathon key is delivered.

This is intentionally **not** the final deployment receipt used by the strict submission gate.

`npm run deployment:record` requires `qloo_configured=true`, so it cannot produce a passing receipt until the real Qloo credential is installed server-side and the live end-to-end Qloo flow succeeds.

## Next deployment transition

After the event key arrives:

1. set `QLOO_API_KEY` only in Vercel environment secrets;
2. set both Qloo base URLs to `https://hackathon.api.qloo.com`;
3. redeploy the same production project;
4. verify the public health endpoint reports `qloo_configured=true`;
5. run the live Qloo demo and redacted artifact builder;
6. write the durable deployment receipt;
7. run `npm run submission:strict`.

No credential is stored in this document, the repository, or public artifacts.