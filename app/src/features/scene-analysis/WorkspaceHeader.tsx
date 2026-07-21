import { Download, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { WorkspaceView } from "./scenarios";
import { ThemeControl, type ThemePreference } from "./ThemeControl";

type Props = {
  view: WorkspaceView;
  completedCount: number;
  analyzableCount: number;
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onViewChange: (view: WorkspaceView) => void;
  onAnalyzeAll: () => void;
  onExport: () => void;
};

export function WorkspaceHeader({
  view,
  completedCount,
  analyzableCount,
  theme,
  onThemeChange,
  onViewChange,
  onAnalyzeAll,
  onExport,
}: Props) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true" />
        <div>
          <strong>Scenevis</strong>
          <span>Visibility Studies</span>
        </div>
      </div>

      <Tabs
        className="view-switcher"
        value={view}
        onValueChange={(nextView) => onViewChange(nextView as WorkspaceView)}
      >
        <TabsList aria-label="Workspace Views">
          <TabsTrigger value="annotate">Annotate</TabsTrigger>
          <TabsTrigger value="compare">
            Compare <span className="view-count">{completedCount}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="header-actions">
        <ThemeControl value={theme} onChange={onThemeChange} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="compact"
          disabled={analyzableCount === 0}
          onClick={onAnalyzeAll}
        >
          <Play data-icon="inline-start" aria-hidden="true" />
          Analyze All{analyzableCount > 0 ? ` (${analyzableCount})` : ""}
        </Button>
        <Button
          type="button"
          size="sm"
          className="compact"
          disabled={completedCount === 0}
          onClick={onExport}
        >
          <Download data-icon="inline-start" aria-hidden="true" />
          Export Report
        </Button>
      </div>
    </header>
  );
}
