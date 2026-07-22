import { formatMetric, METRICS } from "./metrics";
import {
  CAPTURE_COMPARISON_FIELDS,
  CAPTURE_DETAIL_FIELDS,
  metadataValue,
  mismatchFields,
} from "./metadata";
import {
  REGION_COLORS,
  REGION_LABELS,
  REGION_NAMES,
  REGION_STROKES,
  type Region,
  type RegionName,
} from "./model";
import type { CompletedScenario } from "./scenarios";

const HEADLINE_METRICS = METRICS.slice(0, 4);

export type ExportPrivacy = "safe" | "all";

type ReportOptions = {
  includeSensitiveMetadata?: boolean;
};

export function buildReport(
  scenarios: readonly CompletedScenario[],
  options: ReportOptions = {},
): string {
  const includeSensitive = options.includeSensitiveMetadata ?? false;
  const captureMismatches = mismatchFields(
    scenarios.map((scenario) => scenario.preview.metadata.summary),
  );
  const captureHeadings = CAPTURE_COMPARISON_FIELDS.map(
    (field) => `<th scope="col">${escapeHtml(field.title)}</th>`,
  ).join("");
  const captureRows = scenarios
    .map(
      (scenario) =>
        `<tr><th scope="row">${escapeHtml(scenario.name)}</th>${CAPTURE_COMPARISON_FIELDS.map(
          (field) =>
            `<td${captureMismatches.has(field.key) ? ' class="differs"' : ""}>${escapeHtml(metadataValue(field, scenario.preview.metadata.summary) ?? "Not Reported")}</td>`,
        ).join("")}</tr>`,
    )
    .join("");
  const summaryHeadings = HEADLINE_METRICS.map(
    (metric) => `<th scope="col">${escapeHtml(metric.title)}</th>`,
  ).join("");
  const summaryRows = scenarios
    .map(
      (scenario) =>
        `<tr><th scope="row">${escapeHtml(scenario.name)}</th>${HEADLINE_METRICS.map(
          (metric) =>
            `<td>${escapeHtml(formatMetric(metric, scenario.analysis.result.metrics[metric.key]))}</td>`,
        ).join("")}</tr>`,
    )
    .join("");
  const frames = scenarios
    .map((scenario, index) => frame(scenario, index, includeSensitive))
    .join("");
  const privacyNotice = includeSensitive
    ? "Sensitive source fields are included in this artifact."
    : "Sensitive source fields and original filenames are excluded.";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><title>Location Study · Scenevis</title><style>
:root{color-scheme:light;--bg:#f2efe8;--paper:#fbf8f1;--ink:#24201b;--muted:#746c61;--line:#d9d1c4;--accent:#9a651f;--frame:#171512;font:15px/1.5 ui-sans-serif,system-ui,sans-serif}
@media(prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#1b1916;--paper:#24211d;--ink:#eee8dd;--muted:#aaa196;--line:#403a31;--accent:#d39a44;--frame:#0d0c0a}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink)}main{max-width:1680px;margin:auto;padding:clamp(24px,4vw,64px)}h1,h2,h3,p{margin-top:0}h1{margin-bottom:8px;font:600 clamp(36px,5vw,64px)/1.02 Georgia,serif;letter-spacing:-.035em}h2{font:600 26px/1.15 Georgia,serif}h3{font-size:16px}.eyebrow{margin:0 0 8px;color:var(--accent);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.muted{color:var(--muted)}
.report-header{display:flex;align-items:end;justify-content:space-between;gap:32px;margin-bottom:48px}.report-header p{margin-bottom:0}.count{font-variant-numeric:tabular-nums}.summary{margin-bottom:52px}.summary-heading{display:flex;align-items:end;justify-content:space-between;gap:24px}.summary-heading p{margin-bottom:0}.difference-count{color:var(--muted);font-size:12px}.table-wrap{overflow:auto;border:1px solid var(--line);background:var(--paper)}table{width:100%;border-collapse:collapse;white-space:nowrap}th,td{padding:13px 16px;border-bottom:1px solid var(--line);text-align:right;font-variant-numeric:tabular-nums}th:first-child,td:first-child{text-align:left}thead th{color:var(--muted);font-size:11px;letter-spacing:.05em;text-transform:uppercase}tbody tr:last-child>*{border-bottom:0}td.differs{box-shadow:inset 0 -2px var(--accent);background:color-mix(in srgb,var(--accent) 7%,transparent)}
.frames{display:grid;gap:40px}.scenario{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(320px,.8fr);gap:30px;padding-top:32px;border-top:1px solid var(--line);break-inside:avoid}.scene{position:relative;align-self:start;overflow:hidden;background:var(--frame);line-height:0}.scene img{display:block;width:100%;height:auto}.scene svg{position:absolute;inset:0;width:100%;height:100%}.scenario-copy header{margin-bottom:22px}.scenario-copy header p{margin-bottom:0}.zones{display:flex;flex-wrap:wrap;gap:8px 16px;margin:0 0 24px;padding:0;list-style:none;color:var(--muted);font-size:12px}.zones li{display:inline-flex;align-items:center;gap:7px}.swatch{width:10px;height:10px;border:2px solid var(--zone-color);background:color-mix(in srgb,var(--zone-color) 20%,transparent)}.metrics{margin:0;padding:0;list-style:none}.metrics li{display:grid;grid-template-columns:1fr auto;gap:20px;padding:13px 0;border-top:1px solid var(--line)}.metrics h3{margin-bottom:2px}.metrics p{max-width:56ch;margin-bottom:0;color:var(--muted);font-size:12px}.metrics strong{font-size:17px;font-variant-numeric:tabular-nums;white-space:nowrap}.warnings{margin:0 0 22px;padding:12px 16px;border-left:3px solid var(--accent);background:var(--paper)}.warnings ul{margin:6px 0 0;padding-left:18px;color:var(--muted);font-size:13px}.notice{margin-top:20px;color:var(--muted);font-size:11px}
.capture-context{margin:0 0 24px}.capture-context h3{margin-bottom:10px}.capture-context dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 20px;margin:0}.capture-context dl>div{display:grid;grid-template-columns:1fr auto;gap:10px;padding:7px 0;border-top:1px solid var(--line);font-size:12px}.capture-context dt{color:var(--muted)}.capture-context dd{margin:0;font-weight:650;text-align:right;font-variant-numeric:tabular-nums}.source-metadata{margin:0 0 24px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.source-metadata summary{display:flex;justify-content:space-between;gap:16px;padding:11px 0;cursor:pointer;font-weight:700}.source-metadata summary small{color:var(--muted);font-weight:500}.source-metadata dl{max-height:420px;margin:0;overflow:auto}.source-metadata dl>div{display:grid;grid-template-columns:minmax(120px,.75fr) minmax(0,1fr);gap:16px;padding:8px 0;border-top:1px solid var(--line);font-size:11px}.source-metadata dt{color:var(--muted)}.source-metadata dt span{margin-right:7px;color:var(--accent);font-size:9px;font-weight:800;text-transform:uppercase}.source-metadata dd{margin:0;overflow-wrap:anywhere}.privacy{margin-top:10px;color:var(--muted);font-size:11px}
@media(max-width:900px){.report-header{display:block}.count{margin-top:12px}.scenario{grid-template-columns:1fr}}
@media print{main{padding:20px}.summary{break-inside:avoid}.scenario{grid-template-columns:1.4fr 1fr;gap:20px;page-break-before:auto}.metrics li{break-inside:avoid}}
 </style></head><body><main><header class="report-header"><div><p class="eyebrow">Scenevis Comparison Report</p><h1>Location Study</h1><p class="muted">Visibility measurements from linear source data</p><p class="privacy">${escapeHtml(privacyNotice)}</p></div><p class="count">${scenarios.length} ${scenarios.length === 1 ? "scenario" : "scenarios"}</p></header>
<section class="summary"><div class="summary-heading"><div><p class="eyebrow">Capture Consistency</p><h2>Camera Settings</h2></div><p class="difference-count">${captureMismatches.size} ${captureMismatches.size === 1 ? "difference" : "differences"}</p></div><div class="table-wrap"><table><thead><tr><th scope="col">Scenario</th>${captureHeadings}</tr></thead><tbody>${captureRows}</tbody></table></div></section>
<section class="summary"><p class="eyebrow">Overview</p><h2>Key Measurements</h2><div class="table-wrap"><table><thead><tr><th scope="col">Scenario</th>${summaryHeadings}</tr></thead><tbody>${summaryRows}</tbody></table></div></section>
<section class="frames">${frames}</section></main></body></html>`;
}

export function downloadReport(
  scenarios: readonly CompletedScenario[],
  options: ReportOptions = {},
): void {
  const blob = new Blob([buildReport(scenarios, options)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "scenevis-location-study.html";
  anchor.click();
  URL.revokeObjectURL(url);
}

function frame(
  scenario: CompletedScenario,
  index: number,
  includeSensitiveMetadata: boolean,
): string {
  const zones = REGION_NAMES.map((name) => zone(name, scenario.analysis.regions[name])).join("");
  const legend = REGION_NAMES.map(
    (name) =>
      `<li><span class="swatch" style="--zone-color:${REGION_COLORS[name]}"></span>${escapeHtml(REGION_LABELS[name])}</li>`,
  ).join("");
  const metrics = METRICS.map(
    (metric) =>
      `<li><div><h3>${escapeHtml(metric.title)}</h3><p>${escapeHtml(metric.description)}</p></div><strong>${escapeHtml(
        formatMetric(metric, scenario.analysis.result.metrics[metric.key]),
      )}</strong></li>`,
  ).join("");
  const warnings = scenario.analysis.result.warnings
    .map((warning) => `<li>${escapeHtml(warning)}</li>`)
    .join("");
  const capture = CAPTURE_DETAIL_FIELDS.filter(
    (field) => !field.sensitive || includeSensitiveMetadata,
  )
    .map(
      (field) =>
        `<div><dt>${escapeHtml(field.title)}</dt><dd>${escapeHtml(metadataValue(field, scenario.preview.metadata.summary) ?? "Not Reported")}</dd></div>`,
    )
    .join("");
  const sourceEntries = scenario.preview.metadata.entries.filter(
    (entry) => includeSensitiveMetadata || !entry.sensitive,
  );
  const sourceMetadata = sourceEntries
    .map(
      (entry) =>
        `<div><dt><span>${escapeHtml(entry.group)}</span>${escapeHtml(entry.label)}</dt><dd>${escapeHtml(entry.value)}</dd></div>`,
    )
    .join("");
  const sourceLabel = includeSensitiveMetadata
    ? scenario.file.name
    : `${scenario.preview.metadata.summary.file_format.toUpperCase()} source`;

  return `<article class="scenario"><div class="scene"><img src="${scenario.preview.preview_data_url}" alt="${escapeHtml(scenario.name)}"><svg viewBox="0 0 1 1" preserveAspectRatio="none"><title>Selected analysis regions</title>${zones}</svg></div><section class="scenario-copy"><header><p class="eyebrow">Scenario ${String(index + 1).padStart(2, "0")}</p><h2>${escapeHtml(scenario.name)}</h2><p class="muted">${escapeHtml(sourceLabel)}</p></header><ul class="zones">${legend}</ul><section class="capture-context"><h3>Capture Context</h3><dl>${capture}</dl></section>${sourceMetadata ? `<details class="source-metadata"><summary><span>Source Metadata</span><small>${sourceEntries.length} Fields</small></summary><dl>${sourceMetadata}</dl></details>` : ""}${warnings ? `<div class="warnings"><strong>Measurement Warnings</strong><ul>${warnings}</ul></div>` : ""}<ol class="metrics">${metrics}</ol><p class="notice">${escapeHtml(scenario.analysis.result.preview_notice)}</p></section></article>`;
}

function zone(name: RegionName, region: Region): string {
  const color = REGION_COLORS[name];
  const treatment = REGION_STROKES.resting;
  const shared = `vector-effect="non-scaling-stroke" stroke-linejoin="round"`;
  if (region.type === "polygon") {
    const points = region.points.map(([x, y]) => `${x},${y}`).join(" ");
    return `<polygon points="${points}" fill="none" stroke="#0d0c0a" stroke-opacity="0.78" stroke-width="${treatment.halo}" stroke-linecap="round" ${shared}/><polygon data-zone="${name}" points="${points}" fill="${color}${treatment.fillAlpha}" stroke="${color}" stroke-width="${treatment.outline}" stroke-linecap="round" ${shared}/>`;
  }
  return `<rect x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}" fill="none" stroke="#0d0c0a" stroke-opacity="0.78" stroke-width="${treatment.halo}" ${shared}/><rect data-zone="${name}" x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}" fill="${color}${treatment.fillAlpha}" stroke="${color}" stroke-width="${treatment.outline}" ${shared}/>`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ??
      character,
  );
}
