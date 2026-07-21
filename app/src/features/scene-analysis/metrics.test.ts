import { describe, expect, it } from "vitest";

import { METRICS } from "./metrics";

describe("metric presentation", () => {
  it("orders named and described metrics by visibility importance", () => {
    expect(METRICS.map((metric) => metric.title)).toEqual([
      "Robust Contrast-to-Noise Ratio",
      "Weber Contrast",
      "Target Dynamic Range",
      "Target Signal-to-Noise Ratio",
      "Bright-Background Clipping",
      "Target Shadows Below 1%",
      "Local-Background Dynamic Range",
      "Michelson Contrast",
    ]);
    expect(METRICS.every((metric) => metric.description.length > 30)).toBe(true);
  });
});
