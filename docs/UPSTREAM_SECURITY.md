# Upstream dependency security note

TasteForge intentionally depends on the event-supported `@qloo/qloo-harness@0.1.26`.

A local `npm audit` on 2026-10-03 reports advisories in dependencies pulled through:

```
@qloo/qloo-harness@0.1.26
└─ @earendil-works/pi-coding-agent@0.84.2
   ├─ undici@8.9.0
   └─ minimatch@10.2.5
      └─ brace-expansion@5.0.9
```

## Decision

TasteForge does **not** force a semver override over the organizer-supported Qloo package.

- `undici@8.9.0` is pinned exactly by `pi-coding-agent@0.84.2`.
- `brace-expansion@5.0.9` is transitively selected under the harness dependency tree.
- Blind overrides could make the hackathon-supported Qloo runtime non-reproducible.

## Exposure reduction

TasteForge does not expose the Qloo harness as a general shell or chat interface.

The application uses only the official direct workflow executor for:
- `describe`
- `entity_tags`
- `recommend`
- `compare_audiences`

User input is bounded before it reaches those workflows. No arbitrary URL, shell command, websocket endpoint, package glob, or filesystem pattern is accepted from the browser.

## Follow-up

Re-run `npm audit` whenever Qloo publishes a newer event-supported harness. Upgrade the harness rather than independently overriding its pinned runtime unless Qloo documents that override as supported.
