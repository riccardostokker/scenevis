import type { QualityMetrics } from "./model";

export type QualityMetricDefinition = {
  key: keyof QualityMetrics;
  title: string;
  description: string;
  calculation: string;
  range: string;
  direction: string;
  higherIsBetter: string;
  format: "decimal" | "percent" | "signedPercent" | "pixels";
};

export const QUALITY_METRICS: QualityMetricDefinition[] = [
  {
    key: "target_sharpness",
    title: "Target Sharpness",
    description:
      "The amount of fine luminance detail recorded throughout the selected target at the standardized analysis scale.",
    calculation:
      "Root-mean-square Sobel gradient magnitude inside the target, calculated from linear luminance after reducing the image to at most 1,600 pixels on its longest edge without upscaling.",
    range: "0 to no fixed maximum. A perfectly uniform target has a value of 0.",
    direction: "Higher Is Usually Sharper",
    higherIsBetter:
      "Usually, when the target and framing are alike. Real texture and contrast raise this score, so unrelated subjects should not be ranked against each other.",
    format: "decimal",
  },
  {
    key: "target_edge_acutance",
    title: "Target Edge Acutance",
    description: "How abruptly the strongest recorded target edges change in brightness.",
    calculation:
      "The 90th percentile Sobel gradient magnitude among target pixels at the standardized analysis scale.",
    range:
      "0 to approximately 1 for ordinary normalized image values; unavailable without enough target pixels.",
    direction: "Higher Is Crisper",
    higherIsBetter:
      "Usually. Stronger edge transitions look crisper, although subject contrast and sharpening can also raise the result.",
    format: "decimal",
  },
  {
    key: "target_edge_width_px",
    title: "Target Edge Width",
    description:
      "The typical distance over which suitable target edges transition from dark to light.",
    calculation:
      "Median 10%–90% transition width across monotonic profiles sampled perpendicular to strong target edges, in standardized analysis pixels.",
    range:
      "0 pixels to no fixed maximum; unavailable when the target contains too few suitable edges.",
    direction: "Lower Is Sharper",
    higherIsBetter:
      "No. Narrower edge transitions are sharper. Compare results produced at the same documented analysis scale.",
    format: "pixels",
  },
  {
    key: "target_in_focus_coverage",
    title: "Target In-Focus Coverage",
    description:
      "How much of the selected target retains detail close to its sharpest target areas.",
    calculation:
      "Fraction of target focus-map tiles whose sharpness is at least half the target's 90th-percentile tile sharpness.",
    range: "0% to 100%; unavailable when fewer than four target tiles contain enough pixels.",
    direction: "Higher Is More Even",
    higherIsBetter:
      "Usually. This is a relative within-target measure: an entirely blurred target can still appear consistent, so read it with Target Sharpness.",
    format: "percent",
  },
  {
    key: "target_sharpness_consistency",
    title: "Target Sharpness Consistency",
    description: "How unevenly local sharpness is distributed across the target.",
    calculation: "Robust spread of focus-tile sharpness divided by the median tile sharpness.",
    range: "0 to no fixed maximum; 0 means every measured target tile has the same sharpness.",
    direction: "Lower Is More Consistent",
    higherIsBetter:
      "No. Lower variation is more even. Deliberate depth of field, subject shape, or uneven texture can legitimately increase it.",
    format: "decimal",
  },
  {
    key: "directional_blur_anisotropy",
    title: "Directional Blur Evidence",
    description:
      "Whether high-frequency target detail is distributed much more strongly in some directions than others.",
    calculation:
      "One minus the normalized entropy of an 18-bin, gradient-weighted target orientation histogram. The weakest orientation supplies the reported probable direction.",
    range: "0 to 1; 0 is directionally balanced and 1 is strongly directional.",
    direction: "Lower Is More Balanced",
    higherIsBetter:
      "No. A high value can indicate motion blur, but architectural lines and directional subject texture can produce the same pattern.",
    format: "decimal",
  },
  {
    key: "luminance_noise",
    title: "Luminance Noise",
    description:
      "Fine brightness variation remaining in the smoothest parts of the target and local background.",
    calculation:
      "Robust sigma of the difference between linear luminance and a 3×3 local mean, sampled from the lowest-gradient 35% of target and local-background pixels.",
    range: "0% to no fixed maximum as a fraction of normalized full-scale brightness.",
    direction: "Lower Is Cleaner",
    higherIsBetter:
      "No. Lower is cleaner, although unresolved fine texture can be counted as noise in a single no-reference image.",
    format: "percent",
  },
  {
    key: "chroma_noise",
    title: "Chroma Noise",
    description: "Fine coloured variation remaining in smooth target and local-background areas.",
    calculation:
      "Robust sigma of high-pass red-minus-green and blue-minus-green residuals, combined into one normalized magnitude.",
    range: "0% to no fixed maximum as a fraction of normalized full-scale channel intensity.",
    direction: "Lower Is Cleaner",
    higherIsBetter:
      "No. Lower means less coloured grain, but very fine real colour texture can contribute to the estimate.",
    format: "percent",
  },
  {
    key: "detail_to_noise_ratio",
    title: "Detail-to-Noise Ratio",
    description:
      "How much strong target edge detail remains relative to the estimated luminance noise floor.",
    calculation: "Target Edge Acutance divided by the robust luminance-noise estimate.",
    range:
      "0 to no fixed maximum; unavailable when noise or suitable target detail cannot be estimated.",
    direction: "Higher Is Better",
    higherIsBetter:
      "Usually. Higher values indicate recorded edge structure is stronger relative to the local noise estimate.",
    format: "decimal",
  },
  {
    key: "jpeg_blockiness",
    title: "JPEG Blockiness",
    description: "Excess discontinuity along the source image's 8×8 JPEG compression grid.",
    calculation:
      "Mean luminance difference across 8-pixel block boundaries minus neighbouring non-boundary differences, divided by those neighbouring differences.",
    range:
      "0 to no fixed maximum; available only for JPEG sources. 0 means no excess grid boundary was detected.",
    direction: "Lower Is Better",
    higherIsBetter:
      "No. Lower means the JPEG block grid is less visible relative to ordinary neighbouring-pixel changes.",
    format: "decimal",
  },
  {
    key: "ringing_halo_strength",
    title: "Ringing and Halo Strength",
    description:
      "Brightness overshoot or undershoot beside strong target edges from sharpening or compression.",
    calculation:
      "Median edge-profile overshoot beyond its dark and light endpoints, divided by the edge contrast.",
    range:
      "0% to no fixed maximum; unavailable when suitable target edge profiles cannot be found.",
    direction: "Lower Is Better",
    higherIsBetter:
      "No. Lower means fewer visible halos. Some naturally complex edges cannot support a reliable estimate and are excluded.",
    format: "percent",
  },
  {
    key: "banding_fraction",
    title: "Banding Evidence",
    description:
      "Sparse tonal levels and repeated plateaus inside otherwise smooth image gradients.",
    calculation:
      "The upper-quartile product of tonal-level sparsity and equal-neighbour plateaus across smooth, gradually changing image tiles.",
    range: "0% to 100%; unavailable when the image contains too few suitable smooth gradients.",
    direction: "Lower Is Better",
    higherIsBetter:
      "No. Lower means smoother tonal transitions. Scene surfaces with naturally stepped tones can raise this no-reference estimate.",
    format: "percent",
  },
  {
    key: "channel_saturation_clipping",
    title: "Channel Saturation Clipping",
    description:
      "How much of the image clips at least one colour channel even if total luminance is below white.",
    calculation:
      "Fraction of source pixels where red, green, or blue reaches at least 99% of normalized linear channel intensity.",
    range: "0% to 100%. 0% means no source pixel clips any measured colour channel.",
    direction: "Lower Is Better",
    higherIsBetter:
      "No. Lower preserves more colour information. Specular highlights may clip acceptably depending on the scene.",
    format: "percent",
  },
  {
    key: "center_to_corner_falloff",
    title: "Center-to-Corner Falloff",
    description: "The median brightness change between the image centre and its outer corners.",
    calculation:
      "Centre median linear luminance minus corner median luminance, divided by the centre median. Positive values mean darker corners.",
    range:
      "No fixed range. 0% means equal medians; positive values mean darker corners; negative values mean brighter corners.",
    direction: "Closer to Zero Is More Uniform",
    higherIsBetter:
      "Not simply. Values closer to zero are more uniform, but scene lighting and composition can dominate optical vignetting.",
    format: "signedPercent",
  },
];

export const QUALITY_HEADLINE_METRICS = QUALITY_METRICS.slice(0, 5);

export function formatQualityMetric(
  definition: QualityMetricDefinition,
  value: number | null,
): string {
  if (value === null) return "Not Available";
  switch (definition.format) {
    case "percent":
      return `${(value * 100).toFixed(2)}%`;
    case "signedPercent":
      return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
    case "pixels":
      return `${value.toFixed(2)} px`;
    case "decimal":
      return value.toFixed(3);
  }
}

export function qualityMetricValue(
  definition: QualityMetricDefinition,
  metrics: QualityMetrics,
): string {
  const formatted = formatQualityMetric(definition, metrics[definition.key]);
  if (
    definition.key === "directional_blur_anisotropy" &&
    metrics.directional_blur_angle_degrees !== null
  ) {
    return `${formatted} at ${metrics.directional_blur_angle_degrees.toFixed(0)}°`;
  }
  return formatted;
}
