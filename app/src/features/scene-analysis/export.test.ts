import { describe, expect, it } from "vitest";

import type { Analysis, Preview } from "../../shared/api/client";
import { buildReport } from "./export";

describe("static report", () => {
  it("embeds the compressed image, zones, KPIs, and no scripts", () => {
    const preview = {
      preview_data_url: "data:image/jpeg;base64,abc123",
    } as Preview;
    const analysis = {
      regions: {
        target: { type: "rectangle", x: 0.1, y: 0.2, width: 0.1, height: 0.1 },
        local_background: { type: "rectangle", x: 0.05, y: 0.15, width: 0.25, height: 0.25 },
        bright_background: { type: "rectangle", x: 0.7, y: 0.1, width: 0.2, height: 0.2 },
      },
      result: {
        scene_id: "sample",
        image: "sample.CR2",
        warnings: [],
        preview_notice: "Display preview only.",
        metrics: {
          cnr_robust: 3.4,
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

    const html = buildReport(preview, analysis);

    expect(html).toContain("data:image/jpeg;base64,abc123");
    expect(html).toContain("Robust Contrast-to-Noise Ratio");
    expect(html).toContain("Target</text>");
    expect(html).toContain("<svg");
    expect(html).not.toContain("<script");
  });
});
