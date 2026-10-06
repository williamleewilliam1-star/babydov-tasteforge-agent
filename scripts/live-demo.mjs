#!/usr/bin/env node
import fs from "node:fs/promises";
import { executeAgent } from "../api/forge.js";
import { buildSubmissionArtifact } from "../src/live-demo-artifact.js";
import { validateInput } from "../src/qloo-core.js";

const outputPath = process.argv[2] || "";
if (!outputPath) {
  console.error("Usage: npm run demo:live -- <output.json>");
  process.exit(2);
}
if (!process.env.QLOO_API_KEY) {
  console.error("QLOO_API_KEY is required for a live demo run.");
  process.exit(2);
}

const input = validateInput({
  objective: "Create a quiet-luxury launch campaign for a cinematic mobile LUT collection.",
  market: "Tokyo + global creative audience",
  seeds: [
    { name: "Jil Sander", type: "brand" },
    { name: "Brian Eno", type: "artist" },
    { name: "Lost in Translation", type: "movie" },
    { name: "Kyoto", type: "place" }
  ]
});

const result = await executeAgent(input);
const artifact = buildSubmissionArtifact(input, result);
const rendered = JSON.stringify(artifact, null, 2) + "\n";
const forbidden = [
  process.env.QLOO_API_KEY,
  "authorization",
  "x-api-key",
  "api_key",
  "credential"
].filter(Boolean);

for (const marker of forbidden) {
  if (rendered.toLowerCase().includes(String(marker).toLowerCase())) {
    throw new Error("Refusing to write artifact containing a credential marker.");
  }
}

await fs.writeFile(outputPath, rendered, { encoding: "utf8", flag: "wx" });
console.error("Wrote redacted TasteForge live artifact to " + outputPath);
process.stdout.write(JSON.stringify({
  ok: true,
  output: outputPath,
  trace_steps: artifact.trace.length,
  resolved_seeds: artifact.evidence.seeds.length
}) + "\n");
