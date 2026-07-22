import { describe, expect, it } from "vitest";

import type { Analysis, Preview } from "../../shared/api/client";
import { buildReport } from "./export";
import type { CompletedScenario } from "./scenarios";

describe("comparison report", () => {
  it("embeds named scenario frames, comparison KPIs, zones, and self-contained controls", () => {
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
    expect(html).toContain("How to Read the Measurements");
    expect(html).toContain("What Is a Stop?");
    expect(html).toContain("How It Is Calculated");
    expect(html).toContain("Value Range");
    expect(html).toContain("Is Higher Better?");
    expect(html).toContain("Camera Settings");
    expect(html).toContain("Filter by Camera Settings");
    expect(html).toContain('data-filter="aperture"');
    expect(html).toContain('data-sort-key="capture:aperture"');
    expect(html).toContain('data-sort-key="metric:cnr_robust"');
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("1/125 s");
    expect(html).toContain("Sensitive source fields and original filenames are excluded.");
    expect(html).not.toContain("CAMERA-123");
    expect(html).not.toContain("2026-07-21 18:42:00");
    expect(html).toContain('data-zone="target"');
    expect(html).toContain('stroke-width="1.6"');
    expect(html).toContain('stroke-linejoin="round"');
    expect(html).toContain('vector-effect="non-scaling-stroke"');
    expect(html).not.toContain("<text");
    expect(html).toContain("<script>");
    expect(html).not.toContain("innerHTML");
    expect(html).not.toContain("fetch(");
  });

  it("includes sensitive metadata only when requested", () => {
    const scenario = reportScenario("North Atrium", "private-name.jpg", "abc123", 3.4);

    const html = buildReport([scenario], { includeSensitiveMetadata: true });

    expect(html).toContain("private-name.jpg");
    expect(html).toContain("CAMERA-123");
    expect(html).toContain("2026-07-21 18:42:00");
    expect(html).toContain("Sensitive source fields are included in this artifact.");
  });

  it("escapes metadata used by report filters", () => {
    const scenario = reportScenario("North Atrium", "atrium.jpg", "abc123", 3.4);
    scenario.preview.metadata.summary.camera_model = 'EOS"><img src=x onerror=alert(1)>';

    const html = buildReport([scenario]);

    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("EOS&quot;&gt;&lt;img src=x onerror=alert(1)&gt;");
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
    metadata: {
      version: 1,
      entries_truncated: false,
      summary: {
        file_format: "jpg",
        file_size_bytes: 2_048_000,
        width_px: 6000,
        height_px: 4000,
        camera_make: "Canon",
        camera_model: "EOS 200D",
        aperture_f_number: 2.8,
        exposure_time_seconds: 1 / 125,
        iso: 400,
        focal_length_mm: 50,
        exposure_value_ev100: 9.94,
        captured_at: "2026-07-21 18:42:00",
      },
      entries: [
        {
          key: "EXIF BodySerialNumber",
          label: "Body Serial Number",
          group: "exif",
          value: "CAMERA-123",
          sensitive: true,
          truncated: false,
        },
        {
          key: "EXIF FNumber",
          label: "F Number",
          group: "exif",
          value: "2.8",
          sensitive: false,
          truncated: false,
        },
      ],
    },
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
