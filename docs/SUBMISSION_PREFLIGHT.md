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
- reproducible CI;
- explicit mapping to all four official Qloo judging criteria.

Dynamic requirements are reported but do not fail normal CI.

## Strict final check

```bash
npm run submission:strict
```

Strict mode additionally requires:

- a real redacted Qloo live-run artifact;
- a verified external HTTPS deployment receipt with the UI and health endpoint returning HTTP 200 and `qloo_configured=true`;
- at least one screenshot or demo-video asset.

The deployment receipt is created only after the public app is live:

```bash
npm run deployment:record -- https://your-public-demo.example artifacts/deployment.json
```

Strict mode should stay red until both the event key and the externally hosted working demo exist.

The preflight and deployment recorder never read or print the Qloo credential.
