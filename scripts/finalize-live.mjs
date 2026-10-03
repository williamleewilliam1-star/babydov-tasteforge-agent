#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoUrl = process.argv[2] || "https://babydov-tasteforge-agent.vercel.app";
const expectedBase = "https://hackathon.api.qloo.com";

function fail(message) {
  console.error("FINALIZE_BLOCKED: " + message);
  process.exit(2);
}

if (!process.env.QLOO_API_KEY) {
  fail("QLOO_API_KEY is missing.");
}
for (const name of ["QLOO_BASE_URL", "QLOO_TRUSTED_BASE_URL"]) {
  if (process.env[name] !== expectedBase) {
    fail(name + " must equal " + expectedBase);
  }
}

const liveArtifact = path.join(root, "artifacts/qloo-live-demo.json");
const deploymentReceipt = path.join(root, "artifacts/deployment.json");

for (const file of [liveArtifact, deploymentReceipt]) {
  if (fs.existsSync(file)) {
    fail("Refusing to overwrite existing receipt: " + path.relative(root, file));
  }
}
function run(command, args) {
  console.error("\n> " + [command, ...args].join(" "));
  execFileSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env
  });
}

run("npm", ["run", "verify:qloo"]);
run("npm", ["test"]);
run("npm", ["run", "demo:live", "--", "artifacts/qloo-live-demo.json"]);
run("npm", [
  "run",
  "deployment:record",
  "--",
  demoUrl,
  "artifacts/deployment.json"
]);
run("npm", ["run", "submission:strict"]);

console.log(JSON.stringify({
  ok: true,
  demo_url: demoUrl,
  live_artifact: "artifacts/qloo-live-demo.json",
  deployment_receipt: "artifacts/deployment.json",
  next_action: "Finalize Devpost exactly once and verify confirmation."
}, null, 2));
