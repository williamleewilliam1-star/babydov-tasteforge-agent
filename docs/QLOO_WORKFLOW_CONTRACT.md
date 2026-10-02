# Qloo workflow contract

TasteForge targets the official Qloo Agentic Hackathon workflow contract, not a guessed private API surface.

## Contract snapshot

- Official package: `@qloo/qloo-harness`
- Harness version inspected: `0.1.26`
- Workflow contract version: `1.0.0`
- Contract checksum: `sha256:762bdcc5e14ff797b6de739d2658a83f78af35e68d7a5a3449455be6046924f5`
- Result schema version: `1.0-preview.1`
- Hackathon API base: `https://hackathon.api.qloo.com`

The hackathon kit states that `qloo exec`, `qloo explore`, and `qloo mcp` share the same validated workflow/result contract.

## TasteForge workflow map

The intended production flow uses these official operations:

1. `entity_tags`
   - Input: all cultural seed entities together.
   - Purpose: retrieve Qloo concepts that jointly characterize the seed set.
2. `recommend` with `target_type=brand`
   - Purpose: brand adjacency for styling and partnership direction.
3. `recommend` with `target_type=movie`
   - Purpose: cinematic references.
4. `recommend` with `target_type=artist`
   - Purpose: sonic direction.
5. `recommend` with `target_type=place`
   - Purpose: activation/place adjacency.
6. Optional `where_popular`
   - Purpose: geographic affinity when the user gives a concrete region.
7. Optional `compare_audiences`
   - Purpose: contrast two taste clusters rather than mixing them into one profile.

## Trust boundary

- Names supplied by the user are resolved by Qloo's official resolution layer.
- Each workflow returns a versioned status, execution metadata, correlation id, warnings, and provenance.
- TasteForge synthesis may cite returned Qloo evidence.
- A failed or empty workflow must remain empty/failed; it is never replaced with an LLM guess.
- No personal data is sent to Qloo.

## API key state

The official API-key request form has been submitted and confirmed.
The project must not publish, log, commit, or expose the key when it arrives.

## Submission evidence to preserve after live access

For at least one demo run, retain a redacted artifact containing:

- workflow inputs without credentials,
- operation IDs,
- result statuses/counts,
- entity/tag resolution choices,
- correlation IDs,
- Qloo provenance endpoint metadata,
- user-visible synthesis derived from those results,
- known limitations.

This directly maps to the Qloo hackathon submission guide.
