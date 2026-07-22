import { captureFilterOptions, captureFilterValue, NOT_REPORTED } from "./comparison";
import { formatMetric, METRICS } from "./metrics";
import {
  formatQualityMetric,
  QUALITY_HEADLINE_METRICS,
  QUALITY_METRICS,
  qualityMetricValue,
} from "./quality-metrics";
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
import { REPORT_INTERACTIVITY } from "./report-interactivity";

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
  const reportFilters = CAPTURE_COMPARISON_FIELDS.map((field) => {
    const options = captureFilterOptions(scenarios, field)
      .map(
        (option) =>
          `<option value="${escapeHtml(option.value)}">${escapeHtml(option.value)}</option>`,
      )
      .join("");
    return `<label><span>${escapeHtml(field.title)}</span><select data-filter="${field.key}" aria-label="${escapeHtml(field.title)} Filter"><option value="">All ${escapeHtml(field.title)}</option>${options}</select></label>`;
  }).join("");
  const captureHeadings = CAPTURE_COMPARISON_FIELDS.map((field) =>
    field.numericValue
      ? sortableHeading(`capture:${field.key}`, field.title)
      : `<th scope="col">${escapeHtml(field.title)}</th>`,
  ).join("");
  const captureRows = scenarios
    .map((scenario, index) => {
      const scenarioId = `scenario-${index}`;
      const metadata = scenario.preview.metadata.summary;
      const values = CAPTURE_COMPARISON_FIELDS.map((field) => {
        const value = captureFilterValue(scenario, field);
        const numericValue = field.numericValue?.(metadata) ?? null;
        const sortData = field.numericValue
          ? ` data-sort-key="capture:${field.key}" data-sort-value="${numericValue ?? ""}"`
          : "";
        return `<td data-filter-key="${field.key}" data-filter-value="${escapeHtml(value)}"${sortData}${captureMismatches.has(field.key) ? ' class="differs"' : ""}>${escapeHtml(value)}</td>`;
      }).join("");
      return `<tr data-scenario="${scenarioId}" data-capture-row><th scope="row">${escapeHtml(scenario.name)}</th>${values}</tr>`;
    })
    .join("");
  const summaryHeadings = HEADLINE_METRICS.map((metric) =>
    sortableHeading(`metric:${metric.key}`, metric.title),
  ).join("");
  const summaryRows = scenarios
    .map((scenario, index) => {
      const scenarioId = `scenario-${index}`;
      const values = HEADLINE_METRICS.map((metric) => {
        const value = scenario.analysis.result.metrics[metric.key];
        return `<td data-sort-key="metric:${metric.key}" data-sort-value="${value}">${escapeHtml(formatMetric(metric, value))}</td>`;
      }).join("");
      return `<tr data-scenario="${scenarioId}"><th scope="row">${escapeHtml(scenario.name)}</th>${values}</tr>`;
    })
    .join("");
  const qualityHeadings = QUALITY_HEADLINE_METRICS.map((metric) =>
    sortableHeading(`quality:${metric.key}`, metric.title),
  ).join("");
  const qualityRows = scenarios
    .map((scenario, index) => {
      const scenarioId = `scenario-${index}`;
      const values = QUALITY_HEADLINE_METRICS.map((metric) => {
        const value = scenario.analysis.result.quality.metrics[metric.key];
        return `<td data-sort-key="quality:${metric.key}" data-sort-value="${value ?? ""}">${escapeHtml(formatQualityMetric(metric, value))}</td>`;
      }).join("");
      return `<tr data-scenario="${scenarioId}"><th scope="row">${escapeHtml(scenario.name)}</th>${values}</tr>`;
    })
    .join("");
  const metricGuide = METRICS.map(
    (metric) =>
      `<article><header><h3>${escapeHtml(metric.title)}</h3><span>${escapeHtml(metric.direction)}</span></header><p>${escapeHtml(metric.description)}</p><dl><div><dt>How It Is Calculated</dt><dd>${escapeHtml(metric.calculation)}</dd></div><div><dt>Value Range</dt><dd>${escapeHtml(metric.range)}</dd></div><div><dt>Is Higher Better?</dt><dd>${escapeHtml(metric.higherIsBetter)}</dd></div></dl></article>`,
  ).join("");
  const qualityGuide = QUALITY_METRICS.map(
    (metric) =>
      `<article><header><h3>${escapeHtml(metric.title)}</h3><span>${escapeHtml(metric.direction)}</span></header><p>${escapeHtml(metric.description)}</p><dl><div><dt>How It Is Calculated</dt><dd>${escapeHtml(metric.calculation)}</dd></div><div><dt>Value Range</dt><dd>${escapeHtml(metric.range)}</dd></div><div><dt>Is Higher Better?</dt><dd>${escapeHtml(metric.higherIsBetter)}</dd></div></dl></article>`,
  ).join("");
  const frames = scenarios
    .map((scenario, index) => frame(scenario, index, `scenario-${index}`, includeSensitive))
    .join("");
  const privacyNotice = includeSensitive
    ? "Sensitive source fields are included in this artifact."
    : "Sensitive source fields and original filenames are excluded.";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'"><meta name="color-scheme" content="light dark"><title>Location Study · Scenevis</title><style>
:root{color-scheme:light;--bg:#f2efe8;--paper:#fbf8f1;--ink:#24201b;--muted:#746c61;--line:#d9d1c4;--accent:#9a651f;--frame:#171512;font:15px/1.5 ui-sans-serif,system-ui,sans-serif}
@media(prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#1b1916;--paper:#24211d;--ink:#eee8dd;--muted:#aaa196;--line:#403a31;--accent:#d39a44;--frame:#0d0c0a}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink)}main{max-width:1680px;margin:auto;padding:clamp(24px,4vw,64px)}h1,h2,h3,p{margin-top:0}h1{margin-bottom:8px;font:600 clamp(36px,5vw,64px)/1.02 Georgia,serif;letter-spacing:-.035em}h2{font:600 26px/1.15 Georgia,serif}h3{font-size:16px}.eyebrow{margin:0 0 8px;color:var(--accent);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.muted{color:var(--muted)}
.report-header{display:flex;align-items:end;justify-content:space-between;gap:32px;margin-bottom:48px}.report-header p{margin-bottom:0}.count{font-variant-numeric:tabular-nums}.controls{margin-bottom:52px;padding:18px;border:1px solid var(--line);background:var(--paper)}.controls-heading{display:flex;align-items:end;justify-content:space-between;gap:28px;margin-bottom:18px}.controls-heading h2{margin-bottom:3px}.controls-heading p{max-width:72ch;margin-bottom:0;color:var(--muted);font-size:12px}.view-status{flex:none;color:var(--muted);font-size:12px;font-variant-numeric:tabular-nums}.filter-grid{display:grid;grid-template-columns:repeat(6,minmax(120px,1fr));gap:10px}.filter-grid label{display:grid;gap:5px}.filter-grid label>span{color:var(--muted);font-size:9px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}.filter-grid select{width:100%;height:34px;padding:0 9px;border:1px solid var(--line);border-radius:3px;color:var(--ink);background:var(--bg);font:12px inherit}.controls-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}.controls-footer p{margin:0;color:var(--muted);font-size:11px}.controls button{padding:6px 10px;border:1px solid var(--line);border-radius:3px;color:var(--ink);background:transparent;cursor:pointer}.empty{display:grid;min-height:220px;place-content:center;margin-bottom:52px;padding:32px;border:1px solid var(--line);background:var(--paper);text-align:center}.empty h2{margin-bottom:5px}.empty p{margin:0;color:var(--muted)}[hidden]{display:none!important}.summary{margin-bottom:52px}.summary-heading{display:flex;align-items:end;justify-content:space-between;gap:24px}.summary-heading p{margin-bottom:0}.difference-count{color:var(--muted);font-size:12px}.difference-count.active{color:var(--accent)}.table-wrap{overflow:auto;border:1px solid var(--line);background:var(--paper)}table{width:100%;border-collapse:collapse;white-space:nowrap}th,td{padding:13px 16px;border-bottom:1px solid var(--line);text-align:right;font-variant-numeric:tabular-nums}th:first-child,td:first-child{text-align:left}thead th{color:var(--muted);font-size:11px;letter-spacing:.05em;text-transform:uppercase}thead button{display:inline-flex;align-items:center;justify-content:flex-end;gap:5px;padding:0;border:0;color:inherit;background:transparent;font:inherit;letter-spacing:inherit;text-transform:inherit;cursor:pointer}thead button span:last-child{font-size:13px}th[aria-sort=ascending] button,th[aria-sort=descending] button{color:var(--accent)}tbody tr:last-child>*{border-bottom:0}td.differs{box-shadow:inset 0 -2px var(--accent);background:color-mix(in srgb,var(--accent) 7%,transparent)}
.guide{margin-bottom:52px}.guide-intro{max-width:80ch;color:var(--muted)}.guide-group{margin:36px 0 18px}.guide-group p{max-width:80ch;color:var(--muted);font-size:12px}.stop-explainer{max-width:80ch;margin:18px 0 26px;padding:14px 16px;border:1px solid var(--line);background:color-mix(in srgb,var(--accent) 5%,var(--paper))}.stop-explainer h3{margin-bottom:4px;color:var(--accent)}.stop-explainer p{margin:0;color:var(--muted);font-size:13px}.guide-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 32px}.guide-grid article{padding-top:15px;border-top:1px solid var(--line)}.guide-grid header{display:flex;flex-wrap:wrap;gap:7px 10px;align-items:center;margin-bottom:5px}.guide-grid h3{margin:0}.guide-grid header span{padding:2px 6px;border:1px solid var(--line);color:var(--accent);font-size:9px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}.guide-grid article>p{margin-bottom:13px;color:var(--muted);font-size:12px}.guide-grid dl{display:grid;gap:10px;margin:0}.guide-grid dt{font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.guide-grid dd{margin:2px 0 0;color:var(--muted);font-size:11px}
.frames{display:grid;gap:40px}.scenario{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(320px,.8fr);gap:30px;padding-top:32px;border-top:1px solid var(--line);break-inside:avoid}.scene{position:relative;align-self:start;overflow:hidden;background:var(--frame);line-height:0}.scene img{display:block;width:100%;height:auto}.scene svg{position:absolute;inset:0;width:100%;height:100%}.scenario-copy header{margin-bottom:22px}.scenario-copy header p{margin-bottom:0}.zones{display:flex;flex-wrap:wrap;gap:8px 16px;margin:0 0 24px;padding:0;list-style:none;color:var(--muted);font-size:12px}.zones li{display:inline-flex;align-items:center;gap:7px}.swatch{width:10px;height:10px;border:2px solid var(--zone-color);background:color-mix(in srgb,var(--zone-color) 20%,transparent)}.metrics{margin:0;padding:0;list-style:none}.metric-group{margin:26px 0 4px;color:var(--accent);font-size:11px;letter-spacing:.08em;text-transform:uppercase}.metrics li{display:grid;grid-template-columns:1fr auto;gap:20px;padding:13px 0;border-top:1px solid var(--line)}.metrics h3{margin-bottom:2px}.metrics p{max-width:56ch;margin-bottom:0;color:var(--muted);font-size:12px}.metrics strong{font-size:17px;font-variant-numeric:tabular-nums;white-space:nowrap}.warnings{margin:0 0 22px;padding:12px 16px;border-left:3px solid var(--accent);background:var(--paper)}.warnings ul{margin:6px 0 0;padding-left:18px;color:var(--muted);font-size:13px}.focus-legend{margin:8px 0 0;color:var(--muted);font-size:11px}.notice{margin-top:20px;color:var(--muted);font-size:11px}
.capture-context{margin:0 0 24px}.capture-context h3{margin-bottom:10px}.capture-context dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 20px;margin:0}.capture-context dl>div{display:grid;grid-template-columns:1fr auto;gap:10px;padding:7px 0;border-top:1px solid var(--line);font-size:12px}.capture-context dt{color:var(--muted)}.capture-context dd{margin:0;font-weight:650;text-align:right;font-variant-numeric:tabular-nums}.source-metadata{margin:0 0 24px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.source-metadata summary{display:flex;justify-content:space-between;gap:16px;padding:11px 0;cursor:pointer;font-weight:700}.source-metadata summary small{color:var(--muted);font-weight:500}.source-metadata dl{max-height:420px;margin:0;overflow:auto}.source-metadata dl>div{display:grid;grid-template-columns:minmax(120px,.75fr) minmax(0,1fr);gap:16px;padding:8px 0;border-top:1px solid var(--line);font-size:11px}.source-metadata dt{color:var(--muted)}.source-metadata dt span{margin-right:7px;color:var(--accent);font-size:9px;font-weight:800;text-transform:uppercase}.source-metadata dd{margin:0;overflow-wrap:anywhere}.privacy{margin-top:10px;color:var(--muted);font-size:11px}
@media(max-width:900px){.report-header,.controls-heading,.controls-footer{display:block}.count,.view-status{margin-top:12px}.filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.guide-grid,.scenario{grid-template-columns:1fr}}
@media print{main{padding:20px}.controls{display:none}.summary{break-inside:avoid}.guide-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.guide-grid article,.scenario{break-inside:avoid}.scenario{grid-template-columns:1.4fr 1fr;gap:20px;page-break-before:auto}.metrics li{break-inside:avoid}}
 </style></head><body><main data-report><header class="report-header"><div><p class="eyebrow">Scenevis Comparison Report</p><h1>Location Study</h1><p class="muted">Visibility measurements from linear source data</p><p class="privacy">${escapeHtml(privacyNotice)}</p></div><p class="count"><span data-visible-count>${scenarios.length}</span> of ${scenarios.length} ${scenarios.length === 1 ? "scenario" : "scenarios"} shown</p></header>
<section class="controls" aria-labelledby="filter-heading"><div class="controls-heading"><div><p class="eyebrow">View Controls</p><h2 id="filter-heading">Filter by Camera Settings</h2><p>Select an exact reported setting to compare like-for-like captures. Sorting a numeric column orders both tables and the scenario frames.</p></div><p class="view-status" data-view-status></p></div><div class="filter-grid">${reportFilters}</div><div class="controls-footer"><p>Missing metadata appears as “${NOT_REPORTED}” and always sorts last.</p><button type="button" data-reset>Reset View</button></div></section>
<section class="empty" data-empty hidden><h2>No Scenarios Match</h2><p>Change a camera-setting filter or reset the view to show every scenario.</p></section>
<div data-filtered-content>
<section class="summary"><div class="summary-heading"><div><p class="eyebrow">Capture Consistency</p><h2>Camera Settings</h2></div><p class="difference-count${captureMismatches.size > 0 ? " active" : ""}" data-difference-count>${captureMismatches.size} ${captureMismatches.size === 1 ? "difference" : "differences"}</p></div><div class="table-wrap"><table><thead><tr><th scope="col">Scenario</th>${captureHeadings}</tr></thead><tbody data-scenario-list>${captureRows}</tbody></table></div></section>
<section class="summary"><p class="eyebrow">Visibility</p><h2>Key Measurements</h2><div class="table-wrap"><table><thead><tr><th scope="col">Scenario</th>${summaryHeadings}</tr></thead><tbody data-scenario-list>${summaryRows}</tbody></table></div></section>
<section class="summary"><p class="eyebrow">Capture Quality</p><h2>Focus and Detail</h2><div class="table-wrap"><table><thead><tr><th scope="col">Scenario</th>${qualityHeadings}</tr></thead><tbody data-scenario-list>${qualityRows}</tbody></table></div></section>
<section class="guide"><p class="eyebrow">Metric Guide</p><h2>How to Read the Measurements</h2><p class="guide-intro">Brightness is measured from linear source data on a scale where 0 is black and 1 is the image maximum. A median is the middle pixel value, which makes it less sensitive to a few unusually bright or dark pixels.</p><aside class="stop-explainer"><h3>What Is a Stop?</h3><p>A stop is one doubling or halving of brightness. A difference of 1 stop is 2×, 2 stops is 4×, and 3 stops is 8×. A positive value means the bright reference is brighter than the region being compared; a negative value means it is darker.</p></aside><div class="guide-grid">${metricGuide}</div><div class="guide-group"><p class="eyebrow">Capture Quality</p><h2>Focus, Noise, and Artifacts</h2><p>Spatial quality measurements use a bounded linear image scale. Subject texture, lighting, and composition remain part of these no-reference results.</p></div><div class="guide-grid">${qualityGuide}</div></section>
<section class="frames" data-scenario-list>${frames}</section></div></main><script>${REPORT_INTERACTIVITY}</script></body></html>`;
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
  scenarioId: string,
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
  const qualityMetrics = QUALITY_METRICS.map(
    (metric) =>
      `<li><div><h3>${escapeHtml(metric.title)}</h3><p>${escapeHtml(metric.description)}</p></div><strong>${escapeHtml(qualityMetricValue(metric, scenario.analysis.result.quality.metrics))}</strong></li>`,
  ).join("");
  const warnings = scenario.analysis.result.warnings
    .map((warning) => `<li>${escapeHtml(warning)}</li>`)
    .join("");
  const qualityWarnings = scenario.analysis.result.quality.warnings
    .map((warning) => `<li>${escapeHtml(warning)}</li>`)
    .join("");
  const focusMap = scenario.analysis.result.quality.focus_map.map(focusTile).join("");
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

  return `<article class="scenario" data-scenario="${scenarioId}"><div><div class="scene"><img src="${scenario.preview.preview_data_url}" alt="${escapeHtml(scenario.name)}"><svg viewBox="0 0 1 1" preserveAspectRatio="none"><title>Selected regions and local target sharpness</title><g data-focus-map>${focusMap}</g>${zones}</svg></div><p class="focus-legend">Focus map: stronger amber indicates sharper target tiles.</p></div><section class="scenario-copy"><header><p class="eyebrow">Scenario <span data-scenario-number>${String(index + 1).padStart(2, "0")}</span></p><h2>${escapeHtml(scenario.name)}</h2><p class="muted">${escapeHtml(sourceLabel)}</p></header><ul class="zones">${legend}</ul><section class="capture-context"><h3>Capture Context</h3><dl>${capture}</dl></section>${sourceMetadata ? `<details class="source-metadata"><summary><span>Source Metadata</span><small>${sourceEntries.length} Fields</small></summary><dl>${sourceMetadata}</dl></details>` : ""}${warnings ? `<div class="warnings"><strong>Measurement Warnings</strong><ul>${warnings}</ul></div>` : ""}${qualityWarnings ? `<div class="warnings"><strong>Quality Interpretation</strong><ul>${qualityWarnings}</ul></div>` : ""}<h3 class="metric-group">Visibility</h3><ol class="metrics">${metrics}</ol><h3 class="metric-group">Capture Quality</h3><ol class="metrics">${qualityMetrics}</ol><p class="notice">${escapeHtml(scenario.analysis.result.preview_notice)}</p></section></article>`;
}

function focusTile(
  tile: CompletedScenario["analysis"]["result"]["quality"]["focus_map"][number],
): string {
  const fillOpacity = 0.08 + tile.relative_sharpness * 0.44;
  const strokeOpacity = 0.2 + tile.relative_sharpness * 0.55;
  return `<rect data-focus-tile data-in-focus="${tile.in_focus}" x="${tile.x}" y="${tile.y}" width="${tile.width}" height="${tile.height}" fill="#e3a43f" fill-opacity="${fillOpacity.toFixed(3)}" stroke="#e3a43f" stroke-opacity="${strokeOpacity.toFixed(3)}" stroke-width=".75" vector-effect="non-scaling-stroke"/>`;
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

function sortableHeading(key: string, title: string): string {
  return `<th scope="col" aria-sort="none"><button type="button" data-sort-key="${key}" data-sort-title="${escapeHtml(title)}" aria-label="Sort by ${escapeHtml(title)}"><span>${escapeHtml(title)}</span><span data-sort-indicator aria-hidden="true">↕</span></button></th>`;
}
