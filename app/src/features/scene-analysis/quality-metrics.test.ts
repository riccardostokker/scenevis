import { describe, expect, it } from "vitest";

import { formatQualityMetric, QUALITY_METRICS } from "./quality-metrics";

describe("quality metric presentation", () => {
  it("fully explains every requested quality measurement", () => {
    expect(QUALITY_METRICS.map((metric) => metric.title)).toEqual([
      "Target Sharpness",
      "Target Edge Acutance",
      "Target Edge Width",
      "Target In-Focus Coverage",
      "Target Sharpness Consistency",
      "Directional Blur Evidence",
      "Luminance Noise",
      "Chroma Noise",
      "Detail-to-Noise Ratio",
      "JPEG Blockiness",
      "Ringing and Halo Strength",
      "Banding Evidence",
      "Channel Saturation Clipping",
      "Center-to-Corner Falloff",
    ]);
    expect(QUALITY_METRICS.every((metric) => metric.description.length > 30)).toBe(true);
    expect(QUALITY_METRICS.every((metric) => metric.calculation.length > 50)).toBe(true);
    expect(QUALITY_METRICS.every((metric) => metric.range.length > 30)).toBe(true);
    expect(QUALITY_METRICS.every((metric) => metric.higherIsBetter.length > 50)).toBe(true);
  });

  it("formats unavailable and unit-bearing values", () => {
    const edgeWidth = QUALITY_METRICS.find((metric) => metric.key === "target_edge_width_px");
    if (!edgeWidth) throw new Error("edge-width definition missing");

    expect(formatQualityMetric(edgeWidth, 1.234)).toBe("1.23 px");
    expect(formatQualityMetric(edgeWidth, null)).toBe("Not Available");
  });
});
