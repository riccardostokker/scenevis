import type { Metrics } from "./model";

export type MetricDefinition = {
  key: keyof Metrics;
  title: string;
  description: string;
  format: "decimal" | "signed" | "stops" | "percent";
};

export const METRICS: MetricDefinition[] = [
  {
    key: "cnr_robust",
    title: "Robust Contrast-to-Noise Ratio",
    description:
      "How clearly the target separates from its local background despite variation in both regions.",
    format: "decimal",
  },
  {
    key: "weber_contrast_signed",
    title: "Weber Contrast",
    description:
      "Target brightness relative to the local background. The sign shows whether it is darker or brighter.",
    format: "signed",
  },
  {
    key: "dr_target_median_stops",
    title: "Target Dynamic Range",
    description:
      "Brightness difference between the bright background and target in photographic stops.",
    format: "stops",
  },
  {
    key: "snr_target_robust",
    title: "Target Signal-to-Noise Ratio",
    description:
      "Target signal relative to variation within the target region. Surface texture also contributes.",
    format: "decimal",
  },
  {
    key: "bright_clipped_99_percent",
    title: "Bright-Background Clipping",
    description:
      "Share of bright-background pixels at or above 99%. High clipping weakens dynamic-range evidence.",
    format: "percent",
  },
  {
    key: "target_below_1_percent",
    title: "Target Shadows Below 1%",
    description: "Share of target pixels near the normalized linear shadow floor.",
    format: "percent",
  },
  {
    key: "dr_local_median_stops",
    title: "Local-Background Dynamic Range",
    description:
      "Brightness difference between the bright background and local background in stops.",
    format: "stops",
  },
  {
    key: "michelson_contrast",
    title: "Michelson Contrast",
    description: "A symmetric supporting contrast measure for target and background brightness.",
    format: "signed",
  },
];

export function formatMetric(definition: MetricDefinition, value: number): string {
  switch (definition.format) {
    case "percent":
      return `${(value * 100).toFixed(1)}%`;
    case "signed":
      return `${value >= 0 ? "+" : ""}${value.toFixed(3)}`;
    case "stops":
      return `${value.toFixed(2)} stops`;
    case "decimal":
      return value.toFixed(2);
  }
}
