import type { Analysis, Preview } from "../../shared/api/client";
import { formatMetric, METRICS } from "./metrics";
import { REGION_LABELS, REGION_NAMES, type Region, type RegionName } from "./model";

const COLORS: Record<RegionName, string> = {
  target: "#e3a43f",
  local_background: "#78aaa2",
  bright_background: "#d07782",
};

export function buildReport(preview: Preview, analysis: Analysis): string {
  const metrics = METRICS.map(
    (definition) => `<li>
      <div><h2>${escapeHtml(definition.title)}</h2><p>${escapeHtml(definition.description)}</p></div>
      <strong>${escapeHtml(formatMetric(definition, analysis.result.metrics[definition.key]))}</strong>
    </li>`,
  ).join("");
  const zones = REGION_NAMES.map((name) => zone(name, analysis.regions[name])).join("");
  const warnings = analysis.result.warnings
    .map((warning) => `<li>${escapeHtml(warning)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${escapeHtml(analysis.result.scene_id)} — Scenevis</title><style>
:root{color-scheme:dark;background:#1b1916;color:#eee8dd;font:16px/1.5 system-ui,sans-serif}
*{box-sizing:border-box}body{margin:0;padding:clamp(20px,4vw,64px)}main{max-width:1500px;margin:auto}
header{margin-bottom:28px}h1,h2,p{margin:0}h1{font:600 clamp(32px,5vw,58px)/1.05 Georgia,serif}
header p,.notice{color:#aaa196}.layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(340px,1fr);gap:36px;align-items:start}
.scene{position:relative;background:#111;line-height:0}.scene img{width:100%;height:auto}.scene svg{position:absolute;inset:0;width:100%;height:100%}
.scene text{font-family:system-ui,sans-serif;font-weight:700}
.warnings{border-left:3px solid #e3a43f;padding-left:18px;margin-bottom:28px}.warnings h2{font-size:18px}.warnings ul{padding-left:20px;color:#d8d0c5}
.metrics{list-style:none;margin:0;padding:0}.metrics li{display:grid;grid-template-columns:1fr auto;gap:24px;padding:18px 0;border-top:1px solid #3a352e}
.metrics h2{font-size:17px}.metrics p{margin-top:5px;color:#aaa196;font-size:14px;max-width:58ch}.metrics strong{font-size:20px;white-space:nowrap;color:#fff}
.notice{margin-top:28px;font-size:13px}@media(max-width:850px){.layout{grid-template-columns:1fr}.metrics strong{font-size:18px}}
@media print{body{padding:20px}.layout{grid-template-columns:1.5fr 1fr}.metrics li{break-inside:avoid}}
</style></head><body><main><header><h1>${escapeHtml(analysis.result.scene_id)}</h1><p>${escapeHtml(analysis.result.image)} · Scenevis visibility analysis</p></header>
<div class="layout"><div class="scene"><img src="${preview.preview_data_url}" alt="Analyzed scene"><svg viewBox="0 0 1 1" preserveAspectRatio="none"><title>Selected analysis regions</title>${zones}</svg></div>
<section>${warnings ? `<div class="warnings"><h2>Measurement Warnings</h2><ul>${warnings}</ul></div>` : ""}<ol class="metrics">${metrics}</ol><p class="notice">${escapeHtml(analysis.result.preview_notice)}</p></section></div>
</main></body></html>`;
}

export function downloadReport(preview: Preview, analysis: Analysis): void {
  const blob = new Blob([buildReport(preview, analysis)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${analysis.result.scene_id}.scenevis.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function zone(name: RegionName, region: Region): string {
  if (region.type === "polygon") {
    const points = region.points.map(([x, y]) => `${x},${y}`).join(" ");
    const [labelX, labelY] = region.points[0] ?? [0, 0];
    return `<polygon points="${points}" fill="none" stroke="${COLORS[name]}" stroke-width="0.005" vector-effect="non-scaling-stroke"/><text x="${labelX + 0.008}" y="${labelY + 0.028}" fill="${COLORS[name]}" font-size="0.025" stroke="#171511" stroke-width="0.004" paint-order="stroke">${REGION_LABELS[name]}</text>`;
  }
  const labelX = region.x + 0.008;
  const labelY = region.y + 0.028;
  return `<rect x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}" fill="none" stroke="${COLORS[name]}" stroke-width="0.005" vector-effect="non-scaling-stroke"/><text x="${labelX}" y="${labelY}" fill="${COLORS[name]}" font-size="0.025" stroke="#171511" stroke-width="0.004" paint-order="stroke">${REGION_LABELS[name]}</text>`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ??
      character,
  );
}
