import { describe, expect, it } from "vitest";

import type { Analysis, Preview } from "../../shared/api/client";
import { buildReport } from "./export";
import type { CompletedScenario } from "./scenarios";

describe("comparison report", () => {
  it("embeds named scenario frames, comparison KPIs, zones, and no scripts", () => {
    const scenarios = [
      reportScenario("North Atrium", "atrium.jpg", "abc123", 3.4),
      reportScenario("Platform <West>", "platform.jpg", "xyz789", 5.2),
    ];

    const html = buildReport(scenarios);

    expect(html).toContain("Location Study");
    expect(html).toContain("2 scenarios");
    expect(html).toContain("North Atrium");
    expect(html).toContain("Platform &lt;West&gt;");
    expect(html).toContain("data:image/jpeg;base64,abc123");
    expect(html).toContain("data:image/jpeg;base64,xyz789");
    expect(html).toContain("Robust Contrast-to-Noise Ratio");
    expect(html).toContain('data-zone="target"');
    expect(html).not.toContain("<text");
    expect(html).not.toContain("vector-effect");
    expect(html).not.toContain("<script");
  });
});

function reportScenario(
  name: string,
  filename: string,
  image: string,
  contrast: number,
): CompletedScenario {
  const preview = {
    preview_data_url: `data:image/jpeg;base64,${image}`,
  } as Preview;
  const analysis = {
    regions: {
      target: { type: "rectangle", x: 0.1, y: 0.2, width: 0.1, height: 0.1 },
      local_background: { type: "rectangle", x: 0.05, y: 0.15, width: 0.25, height: 0.25 },
      bright_background: { type: "rectangle", x: 0.7, y: 0.1, width: 0.2, height: 0.2 },
    },
    result: {
      scene_id: name,
      image: filename,
      warnings: [],
      preview_notice: "Display preview only.",
      metrics: {
        cnr_robust: contrast,
        weber_contrast_signed: -0.3,
        dr_target_median_stops: 7.2,
        snr_target_robust: 5.1,
        bright_clipped_99_percent: 0.02,
        target_below_1_percent: 0.4,
        dr_local_median_stops: 4.2,
        michelson_contrast: -0.1,
      },
    },
  } as unknown as Analysis;
  return {
    id: name,
    file: new File(["image"], filename, { type: "image/jpeg" }),
    name,
    preview,
    selection: analysis.regions,
    analysis,
    activeRegion: "target",
    drawingMode: "box",
    activity: null,
    error: null,
  };
}
