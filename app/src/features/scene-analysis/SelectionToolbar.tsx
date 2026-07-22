import { DRAWING_MODE_LABELS, DRAWING_MODES, type DrawingMode } from "./model";
import { Lasso, MousePointer2, ScanSearch, SquareDashed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  mode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
  focusMapAvailable: boolean;
  showFocusMap: boolean;
  onFocusMapChange: (visible: boolean) => void;
};

export function SelectionToolbar({
  mode,
  onModeChange,
  focusMapAvailable,
  showFocusMap,
  onFocusMapChange,
}: Props) {
  return (
    <fieldset className="selection-toolbar" aria-label="Image Tools">
      <legend className="sr-only">Image Tools</legend>
      <div className="toolbar-grip" aria-hidden="true" />
      <div className="toolbar-tools">
        {DRAWING_MODES.map((drawingMode) => (
          <Tooltip key={drawingMode}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant={mode === drawingMode ? "secondary" : "ghost"}
                className={mode === drawingMode ? "active" : ""}
                aria-label={DRAWING_MODE_LABELS[drawingMode]}
                aria-pressed={mode === drawingMode}
                onClick={() => onModeChange(drawingMode)}
              >
                <ToolMark mode={drawingMode} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {DRAWING_MODE_LABELS[drawingMode]}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="toolbar-separator" aria-hidden="true" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant={showFocusMap ? "secondary" : "ghost"}
            className={showFocusMap ? "active" : ""}
            aria-label="Focus Map"
            aria-pressed={showFocusMap}
            disabled={!focusMapAvailable}
            onClick={() => onFocusMapChange(!showFocusMap)}
          >
            <ScanSearch className="tool-mark" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {focusMapAvailable ? "Focus Map" : "Analyze to Create a Focus Map"}
        </TooltipContent>
      </Tooltip>
    </fieldset>
  );
}

function ToolMark({ mode }: { mode: DrawingMode }) {
  if (mode === "select") return <MousePointer2 className="tool-mark" aria-hidden="true" />;
  if (mode === "box") return <SquareDashed className="tool-mark" aria-hidden="true" />;
  return <Lasso className="tool-mark" aria-hidden="true" />;
}
