import type { Analysis, Preview } from "../../shared/api/client";
import type { DrawingMode, RegionName, Selection } from "./model";

export type Scenario = {
  id: string;
  file: File;
  name: string;
  preview: Preview | null;
  selection: Selection;
  analysis: Analysis | null;
  activeRegion: RegionName;
  drawingMode: DrawingMode;
  activity: "preparing" | "analyzing" | null;
  error: string | null;
};

export type WorkspaceView = "annotate" | "compare";

export type WorkspaceState = {
  scenarios: Scenario[];
  activeId: string | null;
  view: WorkspaceView;
};

export type WorkspaceAction =
  | { type: "scenariosAdded"; scenarios: Scenario[] }
  | { type: "scenarioActivated"; id: string }
  | { type: "scenarioRenamed"; id: string; name: string }
  | { type: "scenarioRemoved"; id: string }
  | { type: "previewSucceeded"; id: string; preview: Preview }
  | { type: "operationFailed"; id: string; message: string }
  | { type: "selectionChanged"; id: string; selection: Selection; activeRegion: RegionName }
  | { type: "activeRegionChanged"; id: string; activeRegion: RegionName }
  | { type: "drawingModeChanged"; id: string; drawingMode: DrawingMode }
  | { type: "analysisRequested"; id: string }
  | { type: "analysisSucceeded"; id: string; analysis: Analysis }
  | { type: "viewChanged"; view: WorkspaceView };

export const INITIAL_WORKSPACE: WorkspaceState = {
  scenarios: [],
  activeId: null,
  view: "annotate",
};

export function createScenario(file: File, id: string): Scenario {
  return {
    id,
    file,
    name: withoutExtension(file.name),
    preview: null,
    selection: {},
    analysis: null,
    activeRegion: "target",
    drawingMode: "box",
    activity: "preparing",
    error: null,
  };
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "scenariosAdded":
      return {
        ...state,
        scenarios: [...state.scenarios, ...action.scenarios],
        activeId: action.scenarios[0]?.id ?? state.activeId,
        view: "annotate",
      };
    case "scenarioActivated":
      return { ...state, activeId: action.id, view: "annotate" };
    case "scenarioRenamed": {
      const name = action.name.trim();
      if (!name) return state;
      return update(state, action.id, (scenario) => ({ ...scenario, name }));
    }
    case "scenarioRemoved": {
      const removedIndex = state.scenarios.findIndex((scenario) => scenario.id === action.id);
      const scenarios = state.scenarios.filter((scenario) => scenario.id !== action.id);
      const activeId =
        state.activeId === action.id
          ? (scenarios[Math.min(removedIndex, scenarios.length - 1)]?.id ?? null)
          : state.activeId;
      return {
        ...state,
        scenarios,
        activeId,
        view: scenarios.length === 0 ? "annotate" : state.view,
      };
    }
    case "previewSucceeded":
      return update(state, action.id, (scenario) => ({
        ...scenario,
        preview: action.preview,
        activity: null,
        error: null,
      }));
    case "operationFailed":
      return update(state, action.id, (scenario) => ({
        ...scenario,
        activity: null,
        error: action.message,
      }));
    case "selectionChanged":
      return update(state, action.id, (scenario) => ({
        ...scenario,
        selection: action.selection,
        activeRegion: action.activeRegion,
        analysis: null,
        error: null,
      }));
    case "activeRegionChanged":
      return update(state, action.id, (scenario) => ({
        ...scenario,
        activeRegion: action.activeRegion,
      }));
    case "drawingModeChanged":
      return update(state, action.id, (scenario) => ({
        ...scenario,
        drawingMode: action.drawingMode,
      }));
    case "analysisRequested":
      return update(state, action.id, (scenario) => ({
        ...scenario,
        activity: "analyzing",
        error: null,
      }));
    case "analysisSucceeded":
      return update(state, action.id, (scenario) => ({
        ...scenario,
        activity: null,
        error: null,
        analysis: action.analysis,
      }));
    case "viewChanged":
      return { ...state, view: action.view };
  }
}

export function activeScenario(state: WorkspaceState): Scenario | null {
  return state.scenarios.find((scenario) => scenario.id === state.activeId) ?? null;
}

export function completedScenarios(state: WorkspaceState): Scenario[] {
  return state.scenarios.filter((scenario) => scenario.analysis !== null);
}

function update(
  state: WorkspaceState,
  id: string,
  transform: (scenario: Scenario) => Scenario,
): WorkspaceState {
  return {
    ...state,
    scenarios: state.scenarios.map((scenario) =>
      scenario.id === id ? transform(scenario) : scenario,
    ),
  };
}

function withoutExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "") || filename;
}
