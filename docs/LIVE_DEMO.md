# TasteForge live demo artifact

The Qloo hackathon submission guide asks for a redacted request-to-result explanation, including entity/tag choices, provenance, and known limitations.

TasteForge prepares that evidence with one command once the issued event API key is available in the local/server environment.

## Run

Keep the Qloo key only in the server/local environment:

```bash
export QLOO_API_KEY=...
export QLOO_BASE_URL=https://hackathon.api.qloo.com
export QLOO_TRUSTED_BASE_URL=https://hackathon.api.qloo.com
npm run verify:qloo
npm run demo:live -- artifacts/qloo-live-demo.json
```

The output file is created with exclusive-write semantics. The script refuses to overwrite an existing artifact.
## What is included

The artifact allowlists:

- campaign objective, market context, and up to four cultural seeds;
- harness / workflow-contract / result-schema versions;
- normalized Qloo seed and cross-domain evidence;
- TasteForge creative brief;
- workflow operation names and statuses;
- correlation IDs, durations, warnings, and provenance.

## What is excluded

The builder never copies arbitrary request/result objects. It does not include:

- environment variables;
- Authorization or x-api-key headers;
- Qloo credentials;
- raw executor internals outside the allowlist.

A regression test injects credential-shaped fields at multiple levels and asserts they are absent from the serialized artifact.

## Pending

The Qloo event key was issued on 2026-10-06. No live artifact is committed yet because the final production-secret installation and real end-to-end run have not been completed. Do not substitute fixture output for a real Qloo result in the final submission.
