#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = process.argv[2];
const output = process.argv[3] || "artifacts/deployment.json";

if (!input) {
  throw new Error("Usage: node scripts/record-deployment.mjs https://demo.example artifacts/deployment.json");
}

const base = new URL(input);
if (base.protocol !== "https:") {
  throw new Error("External demo URL must use HTTPS.");
}
base.pathname = base.pathname.replace(/\/$/, "");
async function probe(url) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
    headers: { "user-agent": "TasteForge-deployment-verifier/1.0" }
  });
  return {
    status: response.status,
    content_type: response.headers.get("content-type") || "",
    text: await response.text()
  };
}

const rootProbe = await probe(base.href + "/");
const healthProbe = await probe(base.href + "/api/forge");

if (rootProbe.status !== 200) {
  throw new Error("External demo root did not return HTTP 200.");
}
if (healthProbe.status !== 200) {
  throw new Error("External demo /api/forge health did not return HTTP 200.");
}
let health;
try {
  health = JSON.parse(healthProbe.text);
} catch {
  throw new Error("External demo /api/forge did not return JSON health.");
}

if (health?.qloo_configured !== true) {
  throw new Error("External demo reports Qloo is not configured.");
}

const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8"
}).trim();

const receipt = {
  schema: "tasteforge.deployment.v1",
  checked_at: new Date().toISOString(),
  url: base.origin + base.pathname,
  commit,
  root_status: rootProbe.status,
  api_status: healthProbe.status,
  qloo_configured: true,
  service: String(health?.service || "TasteForge Agent"),
  version: String(health?.version || "unknown")
};
const outputPath = path.join(root, output);
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(receipt, null, 2) + "\n", {
  encoding: "utf8",
  flag: "wx"
});

console.log(JSON.stringify(receipt, null, 2));
console.error("Wrote deployment receipt to " + output);
