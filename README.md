# TasteForge Agent

TasteForge is a Qloo-powered cultural intelligence agent for creative direction.

Give it 2-4 cultural seeds (artists, brands, films, destinations, places) and an objective. The agent resolves those seeds through Qloo, queries cross-domain taste affinities, and builds a campaign direction whose claims remain traceable to Qloo evidence.

## Why Qloo matters

A generic LLM can write a plausible moodboard. TasteForge is intentionally different: it refuses to invent missing cultural evidence and shows the exact Qloo tool trace behind each direction.

Pipeline:

1. Resolve each seed through Qloo search.
2. Build a stable set of Qloo entity IDs.
3. Query Qloo insights across destinations, brands, films, artists, and places.
4. Normalize affinity evidence.
5. Synthesize a creative brief from only the returned evidence.
6. Display the complete tool trace and unresolved domains.

## Local run

```bash
cp .env.example .env
# add QLOO_API_KEY
set -a; source .env; set +a
npm test
npm run dev
```

Open http://127.0.0.1:8788

## Environment

- `QLOO_API_KEY` — required
- `QLOO_BASE_URL` — defaults to `https://hackathon.api.qloo.com` for hackathon keys

## API

`POST /api/forge`

```json
{
  "objective": "Create a quiet-luxury launch campaign for a cinematic LUT collection",
  "market": "Tokyo + global creative audience",
  "seeds": ["Jil Sander", "Brian Eno", "Lost in Translation", "Kyoto"]
}
```

The response contains:
- resolved Qloo seeds
- cross-domain evidence groups
- evidence-first creative brief
- complete agent tool trace

## Hackathon

Built during the Qloo Agentic Hackathon submission period (Sep 30-Oct 30, 2026).

Submission requirements targeted:
- functional externally hosted demo
- public source repository
- open-source license
- genuine Qloo API integration
- coherent product experience

## Status

MVP scaffold complete. Live Qloo execution requires a hackathon API key.

## License

MIT
