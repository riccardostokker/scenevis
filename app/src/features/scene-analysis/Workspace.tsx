import { useReducer } from "react";

import { createAnalysis, createPreview } from "../../shared/api/client";
import { ComparisonView } from "./ComparisonView";
import { EmptyWorkspace } from "./EmptyWorkspace";
import { downloadReport } from "./export";
import { FileDropZone } from "./FileDropZone";
import { complete, REGION_NAMES, type Region, type RegionName, type Selection } from "./model";
import { ScenarioEditor } from "./ScenarioEditor";
import { ScenarioRail } from "./ScenarioRail";
import {
  activeScenario,
  completedScenarios,
  createScenario,
  INITIAL_WORKSPACE,
  type Scenario,
  workspaceReducer,
} from "./scenarios";
import { suggestions } from "./selection";
import { useThemePreference } from "./ThemeControl";
import { WorkspaceHeader } from "./WorkspaceHeader";

export function Workspace() {
  const [state, dispatch] = useReducer(workspaceReducer, INITIAL_WORKSPACE);
  const [theme, setTheme] = useThemePreference();
  const active = activeScenario(state);
  const completed = completedScenarios(state);
  const analyzable = state.scenarios.filter(
    (scenario) =>
      scenario.preview &&
      complete(scenario.selection) &&
      scenario.activity === null &&
      scenario.analysis === null,
  );

  async function addFiles(files: File[]) {
    const scenarios = files.map((file) => createScenario(file, crypto.randomUUID()));
    dispatch({ type: "scenariosAdded", scenarios });
    await runPool(scenarios, 3, async (scenario) => {
      try {
        const preview = await createPreview(scenario.file);
        dispatch({ type: "previewSucceeded", id: scenario.id, preview });
      } catch (caught) {
        dispatch({ type: "operationFailed", id: scenario.id, message: message(caught) });
      }
    });
  }

  function selectRegion(scenario: Scenario, name: RegionName, region: Region) {
    if (!scenario.preview) return;
    if (name === "target") {
      dispatch({
        type: "selectionChanged",
        id: scenario.id,
        selection: suggestions(region, scenario.preview.bright_background_suggestion),
        activeRegion: "local_background",
      });
      return;
    }
    dispatch({
      type: "selectionChanged",
      id: scenario.id,
      selection: { ...scenario.selection, [name]: region },
      activeRegion: nextRegion(name),
    });
  }

  function clearRegion(scenario: Scenario, name: RegionName) {
    const selection: Selection = name === "target" ? {} : { ...scenario.selection };
    if (name !== "target") delete selection[name];
    dispatch({
      type: "selectionChanged",
      id: scenario.id,
      selection,
      activeRegion: name,
    });
  }

  function redetect(scenario: Scenario) {
    const target = scenario.selection.target;
    if (!target || !scenario.preview) return;
    dispatch({
      type: "selectionChanged",
      id: scenario.id,
      selection: suggestions(target, scenario.preview.bright_background_suggestion),
      activeRegion: "local_background",
    });
  }

  async function analyze(scenario: Scenario): Promise<boolean> {
    if (!scenario.preview || !complete(scenario.selection)) return false;
    dispatch({ type: "analysisRequested", id: scenario.id });
    try {
      const analysis = await createAnalysis(scenario.file, scenario.selection);
      dispatch({ type: "analysisSucceeded", id: scenario.id, analysis });
      return true;
    } catch (caught) {
      dispatch({ type: "operationFailed", id: scenario.id, message: message(caught) });
      return false;
    }
  }

  async function analyzeAll() {
    let succeeded = completed.length;
    for (const scenario of analyzable) {
      if (await analyze(scenario)) succeeded += 1;
    }
    if (succeeded > 0) dispatch({ type: "viewChanged", view: "compare" });
  }

  return (
    <FileDropZone onFiles={(files) => void addFiles(files)}>
      <div className="app-shell">
        <WorkspaceHeader
          view={state.view}
          completedCount={completed.length}
          analyzableCount={analyzable.length}
          theme={theme}
          onThemeChange={setTheme}
          onViewChange={(view) => dispatch({ type: "viewChanged", view })}
          onAnalyzeAll={() => void analyzeAll()}
          onExport={() => downloadReport(completed)}
        />

        {state.scenarios.length === 0 ? (
          <EmptyWorkspace onFiles={(files) => void addFiles(files)} />
        ) : (
          <div className="workspace-layout">
            <ScenarioRail
              scenarios={state.scenarios}
              activeId={state.activeId}
              onActivate={(id) => dispatch({ type: "scenarioActivated", id })}
              onRename={(id, name) => dispatch({ type: "scenarioRenamed", id, name })}
              onRemove={(id) => dispatch({ type: "scenarioRemoved", id })}
              onFiles={(files) => void addFiles(files)}
            />

            {state.view === "compare" ? (
              <ComparisonView scenarios={state.scenarios} />
            ) : (
              <ScenarioEditor
                scenario={active}
                onSelect={selectRegion}
                onClear={clearRegion}
                onRedetect={redetect}
                onAnalyze={(scenario) => void analyze(scenario)}
                dispatch={dispatch}
              />
            )}
          </div>
        )}
      </div>
    </FileDropZone>
  );
}

function nextRegion(name: RegionName): RegionName {
  const next = REGION_NAMES[REGION_NAMES.indexOf(name) + 1];
  return next ?? name;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : "The operation could not be completed.";
}

async function runPool<T>(
  items: readonly T[],
  concurrency: number,
  run: (item: T) => Promise<void>,
) {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      if (item) await run(item);
    }
  });
  await Promise.all(workers);
}
