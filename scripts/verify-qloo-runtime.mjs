import fs from "node:fs/promises";
import { HARNESS_VERSION } from "@qloo/qloo-harness";

const EXPECTED = {
  harness: "0.1.26",
  contract: "1.0.0",
  schema: "1.0-preview.1",
  checksum: "sha256:762bdcc5e14ff797b6de739d2658a83f78af35e68d7a5a3449455be6046924f5"
};

function atLeast(actual, required) {
  const a = actual.split(".").map(Number);
  const r = required.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, r.length); i++) {
    const x = a[i] || 0;
    const y = r[i] || 0;
    if (x !== y) return x > y;
  }
  return true;
}

if (!atLeast(process.versions.node, "22.19.0")) {
  throw new Error("Node " + process.versions.node + " is below Qloo minimum 22.19.0.");
}
if (HARNESS_VERSION !== EXPECTED.harness) {
  throw new Error("Qloo harness drift: expected " + EXPECTED.harness + ", got " + HARNESS_VERSION + ".");
}

const pkg = JSON.parse(await fs.readFile(new URL("../package.json", import.meta.url), "utf8"));
if (pkg.dependencies?.["@qloo/qloo-harness"] !== EXPECTED.harness) {
  throw new Error("package.json must pin @qloo/qloo-harness exactly.");
}

const router = await fs.readFile(
  new URL("../node_modules/@qloo/qloo-harness/dist/router.js", import.meta.url),
  "utf8"
);
for (const value of [EXPECTED.contract, EXPECTED.schema, EXPECTED.checksum]) {
  if (!router.includes(value)) throw new Error("Pinned Qloo contract marker missing: " + value);
}

console.log(JSON.stringify({
  ok: true,
  node: process.versions.node,
  harness_version: HARNESS_VERSION,
  workflow_contract: EXPECTED.contract,
  result_schema: EXPECTED.schema,
  contract_checksum: EXPECTED.checksum
}, null, 2));

