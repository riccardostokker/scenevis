import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ImageMetadata } from "../../shared/api/client";
import { MetadataPanel } from "./MetadataPanel";

describe("image metadata panel", () => {
  it("reveals sensitive values only after an explicit action", () => {
    render(<MetadataPanel metadata={metadata()} />);

    expect(screen.queryByText("2026-07-21 18:42:00")).not.toBeInTheDocument();
    expect(screen.queryByText("CAMERA-123")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show Sensitive Metadata" }));

    expect(screen.getByText("2026-07-21 18:42:00")).toBeInTheDocument();
    expect(screen.getByText("CAMERA-123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide Sensitive Metadata" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

function metadata(): ImageMetadata {
  return {
    version: 1,
    entries_truncated: false,
    summary: {
      file_format: "jpg",
      file_size_bytes: 2_048_000,
      width_px: 6000,
      height_px: 4000,
      aperture_f_number: 2.8,
      exposure_time_seconds: 1 / 125,
      iso: 400,
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
    ],
  };
}
