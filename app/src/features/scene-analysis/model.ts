import type { components } from "../../shared/api/schema";

export type Rectangle = components["schemas"]["Rectangle"];
export type Polygon = components["schemas"]["Polygon"];
export type Point = components["schemas"]["Point"];
export type Regions = components["schemas"]["Regions"];
export type Region = Regions["target"];
export type Result = components["schemas"]["Result"];
export type Metrics = components["schemas"]["Metrics"];
export type QualityMetrics = components["schemas"]["QualityMetrics"];
export type FocusTile = components["schemas"]["FocusTile"];
export type RegionName = "target" | "local_background" | "bright_background";
export type DrawingMode = "select" | "box" | "lasso";
export type Selection = Partial<Record<RegionName, Region>>;
export type CompleteSelection = Record<RegionName, Region>;

export const REGION_NAMES: RegionName[] = ["target", "local_background", "bright_background"];

export const REGION_LABELS: Record<RegionName, string> = {
  target: "Target",
  local_background: "Local Background",
  bright_background: "Bright Background",
};

export const REGION_DESCRIPTIONS: Record<RegionName, string> = {
  target: "The subject whose visibility you want to measure.",
  local_background: "The immediate context surrounding the target.",
  bright_background: "A bright reference area used for dynamic-range comparisons.",
};

export const REGION_AUTO_SELECTION_DESCRIPTIONS: Partial<Record<RegionName, string>> = {
  local_background:
    "Expands the target bounds to 2.5× their width and height, centered on the target and kept inside the image. Target pixels are excluded when measured.",
  bright_background:
    "Finds the 15%-wide by 15%-high box with the highest average brightness in the preview.",
};

export const REGION_COLORS: Record<RegionName, string> = {
  target: "#e3a43f",
  local_background: "#58a69a",
  bright_background: "#d07782",
};

export const REGION_STROKES = {
  resting: { halo: 3, outline: 1.6, fillAlpha: "0d" },
  active: { halo: 4, outline: 2.4, fillAlpha: "18" },
} as const;

export const DRAWING_MODES: DrawingMode[] = ["select", "box", "lasso"];

export const DRAWING_MODE_LABELS: Record<DrawingMode, string> = {
  select: "Select",
  box: "Box",
  lasso: "Lasso",
};

export function complete(selection: Selection): selection is CompleteSelection {
  return REGION_NAMES.every((name) => selection[name] !== undefined);
}
