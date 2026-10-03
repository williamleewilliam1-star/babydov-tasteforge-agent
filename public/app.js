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

function chipList(items, emptyText = "None returned") {
  if (!Array.isArray(items) || !items.length) {
    return `<span class="chip muted">${safe(emptyText)}</span>`;
  }
  return items.map(item => `<span class="chip">${safe(item.name || item)}</span>`).join("");
}

function renderCoherence(coherence) {
  const panel = $("coherence-panel");
  if (!coherence || coherence.mode !== "dual-pole") {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");
  const poleA = coherence.poles?.a || [];
  const poleB = coherence.poles?.b || [];
  $("poles").innerHTML = [
    `<article><span>POLE A</span><strong>${poleA.map(safe).join(" × ") || "—"}</strong></article>`,
    `<article><span>POLE B</span><strong>${poleB.map(safe).join(" × ") || "—"}</strong></article>`
  ].join("");

  if (!coherence.available) {
    $("coherence-note").textContent = coherence.reason || "Qloo audience comparison is unavailable.";
    $("shared-affinities").innerHTML = chipList([], "No comparison evidence");
    $("differentiators").innerHTML = chipList([], "No comparison evidence");
    return;
  }

  $("coherence-note").textContent =
    "Qloo compared the first two resolved seeds against the second two as one aggregate audience-comparison operation.";
  $("shared-affinities").innerHTML = chipList(coherence.shared || []);

  const diffA = (coherence.differentiators?.a || []).map(item => ({ ...item, name: `A · ${item.name}` }));
  const diffB = (coherence.differentiators?.b || []).map(item => ({ ...item, name: `B · ${item.name}` }));
  const diffGeneral = coherence.differentiators?.general || [];
  $("differentiators").innerHTML = chipList(
    [...diffA, ...diffB, ...diffGeneral],
    "No named differentiators returned"
  );
}

function render(result) {
  $("result").classList.remove("hidden");
  $("status").innerHTML = `<strong>Complete.</strong> ${result.trace.length} agent steps recorded.`;
  $("brief-title").textContent = result.brief.title;
  $("thesis").textContent = result.brief.thesis || "Qloo returned insufficient evidence for a thesis.";

  $("moves").innerHTML = result.brief.moves.map(move =>
    `<article class="move"><span>${safe(move.lane)}</span><p>${safe(move.action)}</p></article>`
  ).join("");

  renderCoherence(result.creative_coherence);

  $("resolved").innerHTML = result.seeds.map(seed => card(seed, seed.source_seed)).join("");
  const entries = Object.entries(result.groups || {});
  $("domains").innerHTML = entries.map(([name, items]) => {
    const body = items.length ? items.map(item => card(item)).join("") : '<p class="empty">No Qloo evidence returned.</p>';
    return `<section class="domain"><h3>${name}</h3>${body}</section>`;
  }).join("");

  $("trace").innerHTML = result.trace.map(step => {
    const state = step.status === "ok" ? "ok" : "warn";
    const operation = step.operation || step.step || "unknown";
    const detail =
      step.target_type ||
      step.code ||
      step.entity_name ||
      step.filter_type ||
      step.error ||
      step.seed ||
      (step.result_count != null ? `${step.result_count} result(s)` : "");
    return `<li><span class="${state}">${safe(step.status)}</span><strong>${safe(operation)}</strong><small>${safe(detail)}</small></li>`;
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
