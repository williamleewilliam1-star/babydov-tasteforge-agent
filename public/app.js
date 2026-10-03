const $ = id => document.getElementById(id);
const safe = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;"
})[ch]);
const pct = value => value == null ? "—" : `${Math.round(Number(value) * 100)}%`;

function card(item, extra = "") {
  const affinity = item.affinity == null ? "" : `<span class="pill">${pct(item.affinity)}</span>`;
  return `<article class="card"><div><strong>${safe(item.name)}</strong><small>${safe(item.type || extra)}</small></div>${affinity}</article>`;
}

function render(result) {
  $("result").classList.remove("hidden");
  $("status").innerHTML = `<strong>Complete.</strong> ${result.trace.length} agent steps recorded.`;
  $("brief-title").textContent = result.brief.title;
  $("thesis").textContent = result.brief.thesis || "Qloo returned insufficient evidence for a thesis.";

  $("moves").innerHTML = result.brief.moves.map(move =>
    `<article class="move"><span>${safe(move.lane)}</span><p>${safe(move.action)}</p></article>`
  ).join("");

  $("resolved").innerHTML = result.seeds.map(seed => card(seed, seed.source_seed)).join("");
  const entries = Object.entries(result.groups || {});
  $("domains").innerHTML = entries.map(([name, items]) => {
    const body = items.length ? items.map(item => card(item)).join("") : '<p class="empty">No Qloo evidence returned.</p>';
    return `<section class="domain"><h3>${name}</h3>${body}</section>`;
  }).join("");

  $("trace").innerHTML = result.trace.map(step => {
    const state = step.status === "ok" ? "ok" : "warn";
    const detail = step.entity_name || step.filter_type || step.error || step.seed || "";
    return `<li><span class="${state}">${safe(step.status)}</span><strong>${safe(step.step)}</strong><small>${safe(detail)}</small></li>`;
  }).join("");

  const e = result.brief.evidence_summary;
  $("metrics").innerHTML = Object.entries(e).map(([k,v]) =>
    `<div><strong>${v}</strong><span>${k.replaceAll("_"," ")}</span></div>`
  ).join("");
}

$("forge-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("run");
  button.disabled = true;
  $("status").innerHTML = "<strong>Running.</strong> Resolving seeds and querying Qloo across cultural domains…";
  $("result").classList.add("hidden");

  const seeds = [...document.querySelectorAll(".seed")].map(x => x.value).filter(Boolean);
  try {
    const response = await fetch("/api/forge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        objective: $("objective").value,
        market: $("market").value,
        seeds
      })
    });
    const data = await response.json();
    if (!response.ok) {
      const prefix = data.code ? `${data.code}: ` : "";
      const recovery = data.recovery ? ` ${data.recovery}` : "";
      throw new Error(prefix + (data.error || "Agent run failed.") + recovery);
    }
    render(data);
  } catch (error) {
    $("status").innerHTML = `<strong>Blocked.</strong> ${safe(error.message)}`;
  } finally {
    button.disabled = false;
  }
});

async function checkReadiness() {
  try {
    const response = await fetch("/api/forge", { headers: { "accept": "application/json" } });
    const data = await response.json();
    if (response.ok && data.qloo_configured === false) {
      $("status").innerHTML = "<strong>Credential pending.</strong> Qloo API access is not configured on this deployment yet.";
    }
  } catch {}
}

checkReadiness();
