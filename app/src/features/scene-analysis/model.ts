import type { components } from "../../shared/api/schema";

export type Rectangle = components["schemas"]["Rectangle"];
export type Polygon = components["schemas"]["Polygon"];
export type Point = components["schemas"]["Point"];
export type Regions = components["schemas"]["Regions"];
export type Region = Regions["target"];
export type Result = components["schemas"]["Result"];
export type Metrics = components["schemas"]["Metrics"];
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

export const DRAWING_MODES: DrawingMode[] = ["select", "box", "lasso"];

export const DRAWING_MODE_LABELS: Record<DrawingMode, string> = {
  select: "Select",
  box: "Box",
  lasso: "Lasso",
};

export function complete(selection: Selection): selection is CompleteSelection {
  return REGION_NAMES.every((name) => selection[name] !== undefined);
}
