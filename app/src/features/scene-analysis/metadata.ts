import type { CaptureMetadata } from "../../shared/api/client";

export type MetadataFieldKey =
  | "aperture"
  | "camera"
  | "capturedAt"
  | "dimensions"
  | "exposureCompensation"
  | "exposureValue"
  | "focalLength"
  | "format"
  | "iso"
  | "lens"
  | "meteringMode"
  | "shutter"
  | "whiteBalance";

export type MetadataField = {
  key: MetadataFieldKey;
  title: string;
  description: string;
  sensitive?: boolean;
  value: (metadata: CaptureMetadata) => string | null;
};

export const CAPTURE_DETAIL_FIELDS: readonly MetadataField[] = [
  {
    key: "shutter",
    title: "Shutter Speed",
    description: "Exposure duration reported by the camera.",
    value: (metadata) => shutter(metadata.exposure_time_seconds),
  },
  {
    key: "aperture",
    title: "Aperture",
    description: "Lens opening used for the capture.",
    value: (metadata) => number(metadata.aperture_f_number, "f/"),
  },
  {
    key: "iso",
    title: "ISO",
    description: "Camera sensitivity setting reported for the capture.",
    value: (metadata) => integer(metadata.iso),
  },
  {
    key: "focalLength",
    title: "Focal Length",
    description: "Actual lens focal length, with 35 mm equivalent when available.",
    value: (metadata) => focalLength(metadata),
  },
  {
    key: "exposureValue",
    title: "Exposure Value",
    description: "EV100 derived from aperture and shutter speed.",
    value: (metadata) => number(metadata.exposure_value_ev100, "", " EV100", 1),
  },
  {
    key: "exposureCompensation",
    title: "Exposure Compensation",
    description: "Camera exposure adjustment relative to its metered value.",
    value: (metadata) => signed(metadata.exposure_compensation_ev, " EV"),
  },
  {
    key: "camera",
    title: "Camera",
    description: "Camera make and model reported by the image.",
    value: camera,
  },
  {
    key: "lens",
    title: "Lens",
    description: "Lens model reported by the camera.",
    value: (metadata) => metadata.lens ?? null,
  },
  {
    key: "meteringMode",
    title: "Metering Mode",
    description: "Camera metering pattern used to evaluate the scene.",
    value: (metadata) => metadata.metering_mode ?? null,
  },
  {
    key: "whiteBalance",
    title: "White Balance",
    description: "White-balance mode recorded with the image.",
    value: (metadata) => metadata.white_balance ?? null,
  },
  {
    key: "capturedAt",
    title: "Capture Time",
    description: "Original timestamp reported by the image; hidden by default.",
    sensitive: true,
    value: (metadata) => metadata.captured_at ?? null,
  },
  {
    key: "dimensions",
    title: "Dimensions",
    description: "Decoded source dimensions before preview compression.",
    value: (metadata) =>
      `${metadata.width_px.toLocaleString()} × ${metadata.height_px.toLocaleString()} px`,
  },
  {
    key: "format",
    title: "Source File",
    description: "Source format and file size.",
    value: (metadata) =>
      `${metadata.file_format.toUpperCase()} · ${fileSize(metadata.file_size_bytes)}`,
  },
];

export const CAPTURE_COMPARISON_FIELDS = fields(
  "aperture",
  "shutter",
  "iso",
  "focalLength",
  "exposureValue",
  "camera",
);

export const CAPTURE_CARD_FIELDS = fields("shutter", "aperture", "iso");

export function metadataValue(field: MetadataField, metadata: CaptureMetadata): string | null {
  return field.value(metadata);
}

export function mismatchFields(
  captures: readonly CaptureMetadata[],
  definitions: readonly MetadataField[] = CAPTURE_COMPARISON_FIELDS,
): Set<MetadataFieldKey> {
  if (captures.length < 2) return new Set();
  return new Set(
    definitions
      .filter((definition) => {
        const values = new Set(captures.map((capture) => definition.value(capture) ?? null));
        return values.size > 1;
      })
      .map((definition) => definition.key),
  );
}

function fields(...keys: MetadataFieldKey[]): readonly MetadataField[] {
  return keys.map((key) => {
    const definition = CAPTURE_DETAIL_FIELDS.find((field) => field.key === key);
    if (!definition) throw new Error(`Unknown metadata field: ${key}`);
    return definition;
  });
}

function camera(metadata: CaptureMetadata): string | null {
  const make = metadata.camera_make?.trim();
  const model = metadata.camera_model?.trim();
  if (make && model)
    return model.toLocaleLowerCase().startsWith(make.toLocaleLowerCase())
      ? model
      : `${make} ${model}`;
  return model ?? make ?? null;
}

function focalLength(metadata: CaptureMetadata): string | null {
  const actual = number(metadata.focal_length_mm, "", " mm");
  if (!actual) return null;
  const equivalent = number(metadata.focal_length_35mm_mm, "", " mm eq.");
  return equivalent ? `${actual} · ${equivalent}` : actual;
}

function shutter(value: number | null | undefined): string | null {
  if (value === null || value === undefined || value <= 0) return null;
  if (value >= 1) return `${trim(value, 2)} s`;
  const denominator = Math.round(1 / value);
  const reconstructed = 1 / denominator;
  if (Math.abs(reconstructed - value) / value < 0.02) return `1/${denominator} s`;
  return `${trim(value, 4)} s`;
}

function integer(value: number | null | undefined): string | null {
  return value === null || value === undefined ? null : Math.round(value).toLocaleString();
}

function number(
  value: number | null | undefined,
  prefix = "",
  suffix = "",
  digits = 2,
): string | null {
  return value === null || value === undefined ? null : `${prefix}${trim(value, digits)}${suffix}`;
}

function signed(value: number | null | undefined, suffix: string): string | null {
  if (value === null || value === undefined) return null;
  return `${value > 0 ? "+" : ""}${trim(value, 2)}${suffix}`;
}

function trim(value: number, digits: number): string {
  return value.toFixed(digits).replace(/\.?0+$/, "");
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${trim(bytes / 1024, 1)} KiB`;
  return `${trim(bytes / 1024 ** 2, 1)} MiB`;
}
