import {
  DRAWING_MODE_LABELS,
  DRAWING_MODES,
  REGION_LABELS,
  REGION_NAMES,
  type DrawingMode,
  type RegionName,
  type Selection,
} from "./model";

type Props = {
  activeRegion: RegionName;
  mode: DrawingMode;
  selection: Selection;
  onActiveRegionChange: (region: RegionName) => void;
  onModeChange: (mode: DrawingMode) => void;
  onClear: () => void;
};

export function SelectionToolbar({
  activeRegion,
  mode,
  selection,
  onActiveRegionChange,
  onModeChange,
  onClear,
}: Props) {
  return (
    <section className="selection-toolbar" aria-label="Selection Tools">
      <fieldset className="toolbar-group region-tools">
        <legend>Region</legend>
        {REGION_NAMES.map((name) => (
          <button
            type="button"
            key={name}
            className={activeRegion === name ? "active" : ""}
            aria-pressed={activeRegion === name}
            onClick={() => onActiveRegionChange(name)}
          >
            <span className={`region-dot ${name}`} />
            <span>{REGION_LABELS[name]}</span>
            <small>
              {selection[name] ? (selection[name].type === "polygon" ? "Lasso" : "Box") : "Empty"}
            </small>
          </button>
        ))}
      </fieldset>

      <fieldset className="toolbar-group drawing-tools">
        <legend>Tool</legend>
        {DRAWING_MODES.map((drawingMode) => (
          <button
            type="button"
            key={drawingMode}
            className={mode === drawingMode ? "active" : ""}
            aria-label={DRAWING_MODE_LABELS[drawingMode]}
            aria-pressed={mode === drawingMode}
            onClick={() => onModeChange(drawingMode)}
          >
            <ToolMark mode={drawingMode} />
            <span>{DRAWING_MODE_LABELS[drawingMode]}</span>
          </button>
        ))}
      </fieldset>

      <button
        type="button"
        className="clear-region"
        aria-label={`Clear ${REGION_LABELS[activeRegion]}`}
        disabled={!selection[activeRegion]}
        onClick={onClear}
      >
        Clear
      </button>
    </section>
  );
}

function ToolMark({ mode }: { mode: DrawingMode }) {
  if (mode === "select") return <span className="tool-mark pointer-mark">↖</span>;
  if (mode === "box") return <span className="tool-mark box-mark" />;
  return <span className="tool-mark lasso-mark">⌁</span>;
}
