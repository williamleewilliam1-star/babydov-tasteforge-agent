# Security

TasteForge keeps the trust boundary intentionally small.

## Secrets

- `QLOO_API_KEY` is read only in the server-side API route.
- The browser never receives the API key.
- The key is never placed in a URL or query parameter.
- Hackathon authentication uses the documented `X-Api-Key` header.

## Input handling

- Seeds are whitespace-normalized, length-bounded, and capped at four.
- Objective and market strings are length-bounded.
- Client input never becomes executable code or a URL fetched by the server.

## External calls

- Qloo requests have a 12-second timeout.
- Only the configured Qloo base URL plus known endpoint paths are used.
- One failed insight domain does not silently fabricate replacements; that domain returns an empty evidence group and an error trace entry.

## Evidence policy

TasteForge separates Qloo evidence from agent synthesis.
The synthesis layer is not allowed to treat a missing Qloo result as factual cultural adjacency.

## Data retention

The MVP has no database and stores no user prompts or Qloo responses after the request completes.
