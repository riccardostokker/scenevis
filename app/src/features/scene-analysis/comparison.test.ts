import { describe, expect, it } from "vitest";

import type { CaptureMetadata } from "../../shared/api/client";
import { captureFilterOptions, comparisonScenarios, type ComparisonSort } from "./comparison";
import { CAPTURE_COMPARISON_FIELDS } from "./metadata";
import type { CompletedScenario } from "./scenarios";

describe("comparison view model", () => {
  const scenarios = [
    scenario("Wide", { aperture_f_number: 2.8, exposure_time_seconds: 1 / 60 }, 1.2),
    scenario("Stopped Down", { aperture_f_number: 8, exposure_time_seconds: 1 / 250 }, 4.8),
    scenario("Missing", {}, 2.5),
  ];

  it("filters scenarios by the exact displayed camera setting", () => {
    const result = comparisonScenarios(scenarios, { aperture: "f/8" }, null);

    expect(result.map(({ name }) => name)).toEqual(["Stopped Down"]);
  });

  it.each([
    [
      { source: "capture", key: "shutter", direction: "ascending" },
      ["Stopped Down", "Wide", "Missing"],
    ],
    [
      { source: "capture", key: "shutter", direction: "descending" },
      ["Wide", "Stopped Down", "Missing"],
    ],
    [
      { source: "metric", key: "cnr_robust", direction: "descending" },
      ["Stopped Down", "Missing", "Wide"],
    ],
    [
      { source: "quality", key: "target_sharpness", direction: "ascending" },
      ["Wide", "Missing", "Stopped Down"],
    ],
  ] satisfies [ComparisonSort, string[]][])(
    "sorts numeric values and leaves missing metadata last",
    (sort, expected) => {
      expect(comparisonScenarios(scenarios, {}, sort).map(({ name }) => name)).toEqual(expected);
    },
  );

  it("orders filter choices numerically and leaves missing metadata last", () => {
    const aperture = CAPTURE_COMPARISON_FIELDS.find((field) => field.key === "aperture");
    if (!aperture) throw new Error("aperture field missing");

    expect(captureFilterOptions(scenarios, aperture).map(({ value }) => value)).toEqual([
      "f/2.8",
      "f/8",
      "Not Reported",
    ]);
  });
});

function scenario(
  name: string,
  metadata: Partial<CaptureMetadata>,
  contrast: number,
): CompletedScenario {
  return {
    id: name,
    name,
    preview: {
      metadata: {
        summary: {
          file_format: "jpg",
          file_size_bytes: 1_000,
          width_px: 100,
          height_px: 100,
          ...metadata,
        },
      },
    },
    analysis: {
      result: {
        metrics: { cnr_robust: contrast },
        quality: { metrics: { target_sharpness: contrast } },
      },
    },
  } as unknown as CompletedScenario;
}
