#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");
const guide = "qloo/qloo-hackathon-kit/docs/SUBMISSION.md";

async function exists(relative) {
  try {
    await fs.access(path.join(root, relative));
    return true;
  } catch {
    return false;
  }
}

async function read(relative) {
  return fs.readFile(path.join(root, relative), "utf8");
}

const submission = await read("SUBMISSION.md");
const readme = await read("README.md");
const checks = [];

function add(id, ok, detail, dynamic = false) {
  checks.push({ id, ok: Boolean(ok), dynamic, detail });
}
add("problem_statement", /## Problem\b/.test(submission),
  "Short product problem statement is present.");
add("qloo_workflow", /## Qloo surface\b/.test(submission) && /@qloo\/qloo-harness/.test(submission),
  "Official Qloo workflow/tooling and rationale are documented.");
add("redacted_request_result", /redacted live-run artifact/i.test(submission) &&
  await exists("scripts/live-demo.mjs") && await exists("docs/LIVE_DEMO.md"),
  "Redacted request-to-result workflow is implemented and documented.");
add("setup_steps", /## Local run\b/.test(readme) && await exists("package-lock.json"),
  "Clean-environment setup steps and pinned dependency lockfile are present.");
add("known_limitations", /## Known limitations\b/.test(submission),
  "Known limitations are explicit.");
add("responsible_data", /## Responsible data handling\b/.test(submission),
  "Responsible data handling is documented.");
add("license", await exists("LICENSE"), "Open-source license is present.");
add("ci", await exists(".github/workflows/ci.yml"),
  "Reproducible CI workflow is present.");
const judging = await exists("docs/JUDGING_ALIGNMENT.md")
  ? await read("docs/JUDGING_ALIGNMENT.md")
  : "";
add("judging_alignment",
  ["Technological Implementation", "Design", "Potential Impact", "Quality of the Idea"]
    .every(label => judging.includes(label)),
  "All four official Qloo judging criteria are mapped to project evidence.");
const artifact = "artifacts/qloo-live-demo.json";
add("live_qloo_artifact", await exists(artifact),
  "Real redacted Qloo live-run artifact exists.", true);

let deploymentOk = false;
let deploymentDetail = "No verified external deployment receipt found.";
if (await exists("artifacts/deployment.json")) {
  try {
    const deployment = JSON.parse(await read("artifacts/deployment.json"));
    deploymentOk =
      deployment?.schema === "tasteforge.deployment.v1" &&
      /^https:\/\//.test(String(deployment?.url || "")) &&
      deployment?.root_status === 200 &&
      deployment?.api_status === 200 &&
      deployment?.qloo_configured === true;
    deploymentDetail = deploymentOk
      ? "Verified external demo: " + deployment.url
      : "Deployment receipt exists but is incomplete or not Qloo-ready.";
  } catch {
    deploymentDetail = "Deployment receipt is not valid JSON.";
  }
}
add("external_demo", deploymentOk, deploymentDetail, true);

let media = [];
for (const dir of ["docs", "artifacts"]) {
  try {
    const names = await fs.readdir(path.join(root, dir));
    media.push(...names
      .filter(name => /\.(png|jpe?g|webp|gif|mp4|mov|webm)$/i.test(name))
      .map(name => dir + "/" + name));
  } catch {}
}
add("demo_media", media.length > 0,
  media.length ? "Demo media: " + media.join(", ") : "No screenshot or demo video found yet.",
  true);

const requiredFailures = checks.filter(row => !row.dynamic && !row.ok);
const strictFailures = strict ? checks.filter(row => !row.ok) : requiredFailures;
const result = {
  schema: "tasteforge.submission_preflight.v1",
  official_guide: guide,
  mode: strict ? "strict" : "static",
  ready: strictFailures.length === 0,
  checks,
  blockers: strictFailures.map(row => row.id)
};
process.stdout.write(JSON.stringify(result, null, 2) + "\n");

if (strictFailures.length) {
  process.stderr.write(
    "TasteForge submission preflight blocked: " +
    strictFailures.map(row => row.id).join(", ") + "\n"
  );
  process.exit(1);
}
