import { describe, expect, it } from "vitest";

import type { CaptureMetadata } from "../../shared/api/client";
import {
  CAPTURE_COMPARISON_FIELDS,
  CAPTURE_DETAIL_FIELDS,
  metadataValue,
  mismatchFields,
} from "./metadata";

describe("capture metadata", () => {
  it("formats photographic settings for comparison", () => {
    const capture = metadata({
      aperture_f_number: 2.8,
      exposure_time_seconds: 1 / 125,
      iso: 400,
      focal_length_mm: 50,
      focal_length_35mm_mm: 80,
      exposure_value_ev100: 9.9366,
    });

    const values = Object.fromEntries(
      CAPTURE_DETAIL_FIELDS.map((field) => [field.key, metadataValue(field, capture)]),
    );
    expect(values.aperture).toBe("f/2.8");
    expect(values.shutter).toBe("1/125 s");
    expect(values.iso).toBe("400");
    expect(values.focalLength).toBe("50 mm · 80 mm eq.");
    expect(values.exposureValue).toBe("9.9 EV100");
    expect(
      CAPTURE_COMPARISON_FIELDS.find((field) => field.key === "shutter")?.numericValue?.(capture),
    ).toBe(1 / 125);
  });

  it("identifies capture settings that differ", () => {
    const first = metadata({ aperture_f_number: 2.8, iso: 100 });
    const second = metadata({ aperture_f_number: 4, iso: 100 });

    const mismatches = mismatchFields([first, second]);

    expect(mismatches.has("aperture")).toBe(true);
    expect(mismatches.has("iso")).toBe(false);
    expect(mismatches.size).toBe(1);
    expect(CAPTURE_COMPARISON_FIELDS).toHaveLength(6);
  });
});

function metadata(overrides: Partial<CaptureMetadata>): CaptureMetadata {
  return {
    file_format: "jpg",
    file_size_bytes: 1_024_000,
    width_px: 6000,
    height_px: 4000,
    ...overrides,
  };
}
