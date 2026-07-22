import { useState, type Dispatch } from "react";

import { MetadataPanel } from "./MetadataPanel";
import { MetricPanel } from "./MetricPanel";
import { REGION_NAMES, type Region, type RegionName } from "./model";
import { RegionInspector } from "./RegionInspector";
import type { Scenario, WorkspaceAction } from "./scenarios";
import { SceneCanvas } from "./SceneCanvas";
import { SelectionToolbar } from "./SelectionToolbar";

type Props = {
  scenario: Scenario | null;
  onSelect: (scenario: Scenario, name: RegionName, region: Region) => void;
  onClear: (scenario: Scenario, name: RegionName) => void;
  onRedetect: (scenario: Scenario) => void;
  onAnalyze: (scenario: Scenario) => void;
  dispatch: Dispatch<WorkspaceAction>;
};

export function ScenarioEditor({
  scenario,
  onSelect,
  onClear,
  onRedetect,
  onAnalyze,
  dispatch,
}: Props) {
  const [showFocusMap, setShowFocusMap] = useState(false);
  if (!scenario) return null;
  if (!scenario.preview) {
    return (
      <main className="editor-loading">
        <span className="loading-mark" />
        <p className="eyebrow">Preparing Preview</p>
        <h1>{scenario.name}</h1>
        {scenario.error && <p className="error-copy">{scenario.error}</p>}
      </main>
    );
  }

  return (
    <main className="scenario-editor">
      <header className="editor-heading">
        <div>
          <p className="eyebrow">
            {scenario.preview.processing.source === "raw" ? "RAW Source" : "Rendered Source"}
          </p>
          <h1>{scenario.name}</h1>
        </div>
        <div className="source-details">
          <span>{scenario.file.name}</span>
          <strong>
            {scenario.preview.width_px.toLocaleString()} ×{" "}
            {scenario.preview.height_px.toLocaleString()} px
          </strong>
        </div>
      </header>

      <div className="editor-grid">
        <section className="image-workbench" aria-label="Image Workbench">
          <div className="image-frame">
            <SceneCanvas
              image={scenario.preview.preview_data_url}
              selection={scenario.selection}
              active={scenario.activeRegion}
              mode={scenario.drawingMode}
              focusMap={scenario.analysis?.result.quality.focus_map}
              showFocusMap={showFocusMap}
              onActiveChange={(activeRegion) =>
                dispatch({ type: "activeRegionChanged", id: scenario.id, activeRegion })
              }
              onSelect={(name, region) => onSelect(scenario, name, region)}
              toolbar={
                <SelectionToolbar
                  mode={scenario.drawingMode}
                  onModeChange={(drawingMode) =>
                    dispatch({ type: "drawingModeChanged", id: scenario.id, drawingMode })
                  }
                  focusMapAvailable={Boolean(scenario.analysis?.result.quality.focus_map.length)}
                  showFocusMap={showFocusMap}
                  onFocusMapChange={setShowFocusMap}
                />
              }
            />
          </div>
          <footer className="workbench-footer">
            <span>
              Editing <strong>{REGION_NAMES.indexOf(scenario.activeRegion) + 1} of 3</strong>
            </span>
            <span>Drag to draw · Select to inspect</span>
          </footer>
        </section>

        <div className="inspector-column">
          <RegionInspector
            scenario={scenario}
            onActiveRegionChange={(activeRegion) =>
              dispatch({ type: "activeRegionChanged", id: scenario.id, activeRegion })
            }
            onClear={(name) => onClear(scenario, name)}
            onRedetect={() => onRedetect(scenario)}
            onAnalyze={() => onAnalyze(scenario)}
          />
          <MetadataPanel metadata={scenario.preview.metadata} />
          {scenario.analysis && <MetricPanel analysis={scenario.analysis} />}
        </div>
      </div>
    </main>
  );
}
