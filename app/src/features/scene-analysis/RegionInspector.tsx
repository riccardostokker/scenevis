import {
  REGION_COLORS,
  REGION_DESCRIPTIONS,
  REGION_LABELS,
  REGION_NAMES,
  complete,
  type RegionName,
  type Selection,
} from "./model";
import type { Scenario } from "./scenarios";
import { RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  scenario: Scenario;
  onActiveRegionChange: (region: RegionName) => void;
  onClear: (region: RegionName) => void;
  onRedetect: () => void;
  onAnalyze: () => void;
};

export function RegionInspector({
  scenario,
  onActiveRegionChange,
  onClear,
  onRedetect,
  onAnalyze,
}: Props) {
  return (
    <aside className="inspector" aria-label="Analysis Inspector">
      <section className="inspector-section regions-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selection</p>
            <h2>Regions</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-button"
            disabled={!scenario.selection.target}
            onClick={onRedetect}
          >
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
            Redetect
          </Button>
        </div>
        <p className="section-description">
          Draw the target first. Both reference regions are detected automatically and remain
          editable.
        </p>

        <div className="region-list">
          {REGION_NAMES.map((name, index) => (
            <RegionControl
              key={name}
              index={index + 1}
              name={name}
              selection={scenario.selection}
              active={scenario.activeRegion === name}
              onActivate={() => onActiveRegionChange(name)}
              onClear={() => onClear(name)}
            />
          ))}
        </div>
      </section>

      {scenario.error && (
        <div className="error-message" role="alert">
          <strong>Could Not Complete the Operation</strong>
          <span className="error-detail">{scenario.error}</span>
        </div>
      )}

      <section className="inspector-section action-section">
        <Button
          type="button"
          size="lg"
          className="primary-button"
          disabled={!complete(scenario.selection) || scenario.activity !== null}
          onClick={onAnalyze}
        >
          {scenario.activity === "analyzing" ? "Analyzing…" : "Analyze Scenario"}
        </Button>
        <p>
          Measurements use linear source data. The displayed preview is for region placement only.
        </p>
      </section>
    </aside>
  );
}

function RegionControl({
  index,
  name,
  selection,
  active,
  onActivate,
  onClear,
}: {
  index: number;
  name: RegionName;
  selection: Selection;
  active: boolean;
  onActivate: () => void;
  onClear: () => void;
}) {
  const region = selection[name];
  return (
    <div className={`region-control${active ? " active" : ""}`}>
      <button type="button" className="region-select" aria-pressed={active} onClick={onActivate}>
        <span className="region-number">{index}</span>
        <span className="region-copy">
          <strong>
            <i style={{ background: REGION_COLORS[name] }} />
            {REGION_LABELS[name]}
          </strong>
          <small>{REGION_DESCRIPTIONS[name]}</small>
        </span>
        <Badge variant="outline" className={`region-state${region ? " complete" : ""}`}>
          {region ? (region.type === "polygon" ? "Lasso" : "Box") : "Empty"}
        </Badge>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="region-clear"
        disabled={!region}
        aria-label={`Clear ${REGION_LABELS[name]}`}
        onClick={onClear}
      >
        Clear
      </Button>
    </div>
  );
}
