import { Download, Play, ShieldAlert, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { ExportPrivacy } from "./export";
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
  exportPrivacy: ExportPrivacy;
  onExportPrivacyChange: (privacy: ExportPrivacy) => void;
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
  exportPrivacy,
  onExportPrivacyChange,
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
        <Select
          value={exportPrivacy}
          onValueChange={(privacy) => onExportPrivacyChange(privacy as ExportPrivacy)}
        >
          <SelectTrigger className="export-privacy" size="sm" aria-label="Report Metadata">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="safe">
              <ShieldCheck aria-hidden="true" />
              Safe Metadata
            </SelectItem>
            <SelectItem value="all">
              <ShieldAlert aria-hidden="true" />
              Include Sensitive
            </SelectItem>
          </SelectContent>
        </Select>
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
