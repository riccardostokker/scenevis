import type { Metrics } from "./model";

export type MetricDefinition = {
  key: keyof Metrics;
  title: string;
  description: string;
  calculation: string;
  range: string;
  direction: string;
  higherIsBetter: string;
  format: "decimal" | "signed" | "stops" | "percent";
};

export const METRICS: MetricDefinition[] = [
  {
    key: "cnr_robust",
    title: "Robust Contrast-to-Noise Ratio",
    description:
      "How strongly the target stands out from its nearby background after allowing for texture and noise in both regions.",
    calculation:
      "The absolute difference between the target and local-background median brightness, divided by their combined robust variation. Robust variation uses the median pixel spread, so a few unusual pixels have less influence.",
    range: "0 to no fixed maximum. 0 means there is no difference in median brightness.",
    direction: "Higher Is Usually Better",
    higherIsBetter:
      "Usually. A higher value means clearer separation relative to texture and noise, but there is no universal pass mark.",
    format: "decimal",
  },
  {
    key: "weber_contrast_signed",
    title: "Weber Contrast",
    description:
      "How much brighter or darker the target is than its nearby background, relative to that background.",
    calculation:
      "(target median brightness − local-background median brightness) ÷ local-background median brightness.",
    range:
      "−1 to no fixed positive maximum. 0 means equal brightness; −1 means a black target; +1 means the target is twice as bright.",
    direction: "Farther From Zero Is Stronger",
    higherIsBetter:
      "Not simply. Distance from 0 matters: either a large negative or a large positive value means stronger contrast. The sign only says darker (−) or brighter (+).",
    format: "signed",
  },
  {
    key: "dr_target_median_stops",
    title: "Target Dynamic Range",
    description:
      "How many brightness doublings separate the bright reference area from the target.",
    calculation:
      "log₂(bright-background median brightness ÷ target median brightness). The result is expressed in photographic stops.",
    range:
      "No fixed range. 0 stops means equal brightness; +1 means the bright background is 2× brighter; +2 means 4× brighter; −1 means the target is 2× brighter.",
    direction: "Context, Not a Score",
    higherIsBetter:
      "No. A larger positive value means the target is much darker than the bright background and the scene demands more dynamic range. Compare similar scenes rather than chasing a high value.",
    format: "stops",
  },
  {
    key: "snr_target_robust",
    title: "Target Signal-to-Noise Ratio",
    description:
      "How steady the brightness is inside the target region compared with the target's typical brightness.",
    calculation:
      "Target median brightness ÷ robust variation within the target. Both sensor noise and real surface texture count as variation.",
    range:
      "0 to no fixed maximum for normal image values. A nearly uniform target can produce a very large value.",
    direction: "Higher Is Usually Cleaner",
    higherIsBetter:
      "Usually cleaner, but not necessarily more visible. Smooth targets score higher; genuine surface texture can lower the value even in a good image.",
    format: "decimal",
  },
  {
    key: "bright_clipped_99_percent",
    title: "Bright-Background Clipping",
    description:
      "How much of the bright reference area is at or near pure white, where highlight detail may already be lost.",
    calculation:
      "Number of bright-background pixels at or above 99% of normalized linear brightness ÷ all pixels in that region.",
    range: "0% to 100%. 0% means no measured pixels are clipped; 100% means all of them are.",
    direction: "Lower Is Better",
    higherIsBetter:
      "No. Lower is better. Heavy clipping makes the bright reference less trustworthy because the original brightness may extend beyond what the camera recorded.",
    format: "percent",
  },
  {
    key: "target_below_1_percent",
    title: "Target Shadows Below 1%",
    description:
      "How much of the target is extremely close to black, where fine differences can be difficult to record reliably.",
    calculation:
      "Number of target pixels below 1% of normalized linear brightness ÷ all pixels in the target region.",
    range: "0% to 100%. 0% means none of the target is this dark; 100% means all of it is.",
    direction: "Lower Is Usually Better",
    higherIsBetter:
      "No. Lower is usually better. A high value means much of the target sits near the camera's shadow floor, where noise and limited precision can dominate.",
    format: "percent",
  },
  {
    key: "dr_local_median_stops",
    title: "Local-Background Dynamic Range",
    description:
      "How many brightness doublings separate the bright reference area from the target's nearby background.",
    calculation:
      "log₂(bright-background median brightness ÷ local-background median brightness). The result is expressed in photographic stops.",
    range:
      "No fixed range. 0 stops means equal brightness; +1 means the bright background is 2× brighter; +2 means 4× brighter.",
    direction: "Context, Not a Score",
    higherIsBetter:
      "No. This describes the lighting context rather than quality. Use it to understand the scene around the target, especially when comparing similarly framed images.",
    format: "stops",
  },
  {
    key: "michelson_contrast",
    title: "Michelson Contrast",
    description:
      "A balanced comparison of target and nearby-background brightness that treats darker and brighter targets symmetrically.",
    calculation:
      "(target median brightness − local-background median brightness) ÷ (target median brightness + local-background median brightness).",
    range:
      "−1 to +1. 0 means equal brightness; values near −1 mean a much darker target; values near +1 mean a much brighter target.",
    direction: "Farther From Zero Is Stronger",
    higherIsBetter:
      "Not simply. Distance from 0 indicates contrast strength. The sign only tells whether the target is darker (−) or brighter (+) than its nearby background.",
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
