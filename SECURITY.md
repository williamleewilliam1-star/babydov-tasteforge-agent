# Security

TasteForge keeps the trust boundary intentionally small.

## Secrets

- `QLOO_API_KEY` is read only in the server-side API route.
- The browser never receives the API key.
- The key is never placed in a URL or query parameter.
- `QLOO_API_KEY` is consumed server-side by the pinned official Qloo harness; application code does not manually expose or echo the credential.

## Input handling

- Seeds are whitespace-normalized, length-bounded, and capped at four.
- Objective and market strings are length-bounded.
- Client input never becomes executable code or a URL fetched by the server.

## External calls

- Qloo execution uses the official versioned workflow boundary from `@qloo/qloo-harness@0.1.26`.
- `QLOO_BASE_URL` and `QLOO_TRUSTED_BASE_URL` default to the hackathon host.
- The harness does not silently fall back to another transport.
- One failed workflow does not silently fabricate replacements; that domain stays empty and the error metadata is retained in the trace.

## Evidence policy

TasteForge separates Qloo evidence from agent synthesis.
The synthesis layer is not allowed to treat a missing Qloo result as factual cultural adjacency.

## Data retention

The MVP has no database and stores no user prompts or Qloo responses after the request completes.
