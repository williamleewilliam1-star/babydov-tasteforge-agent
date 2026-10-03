# Submission preflight

TasteForge maps its final checks to the official Qloo hackathon submission guide:
`qloo/qloo-hackathon-kit/docs/SUBMISSION.md`.

## Static CI check

```bash
npm run submission:check
```

This verifies the repository already contains:

- a product problem statement;
- documented official Qloo workflow usage;
- a credential-safe request-to-result workflow;
- clean-environment setup steps;
- known limitations;
- responsible data handling;
- an open-source license;
- reproducible CI.

Dynamic requirements are reported but do not fail normal CI.

## Strict final check

```bash
npm run submission:strict
```

Strict mode additionally requires a real redacted Qloo live-run artifact and at least one screenshot or demo-video asset. It should stay red until the event key arrives and the real demo is captured.

The preflight never reads or prints the Qloo credential.
