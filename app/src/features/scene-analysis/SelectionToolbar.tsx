import { DRAWING_MODE_LABELS, DRAWING_MODES, type DrawingMode } from "./model";
import { Lasso, MousePointer2, SquareDashed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  mode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
};

export function SelectionToolbar({ mode, onModeChange }: Props) {
  return (
    <fieldset className="selection-toolbar" aria-label="Drawing Tools">
      <legend className="sr-only">Drawing Tools</legend>
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
    </fieldset>
  );
}

function ToolMark({ mode }: { mode: DrawingMode }) {
  if (mode === "select") return <MousePointer2 className="tool-mark" aria-hidden="true" />;
  if (mode === "box") return <SquareDashed className="tool-mark" aria-hidden="true" />;
  return <Lasso className="tool-mark" aria-hidden="true" />;
}
