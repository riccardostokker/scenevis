import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { complete } from "./model";
import type { Scenario } from "./scenarios";

type Props = {
  scenarios: Scenario[];
  activeId: string | null;
  onActivate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onFiles: (files: File[]) => void;
};

export function ScenarioRail({
  scenarios,
  activeId,
  onActivate,
  onRename,
  onRemove,
  onFiles,
}: Props) {
  return (
    <aside className="scenario-rail" aria-label="Scenarios">
      <div className="rail-heading">
        <div>
          <p className="eyebrow">Locations</p>
          <h2>Scenarios</h2>
        </div>
        <label
          className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "add-scenarios")}
          title="Add Images"
        >
          <Plus aria-hidden="true" />
          <span className="sr-only">Add Images</span>
          <input
            type="file"
            multiple
            accept=".cr2,.dng,.jpg,.jpeg,.png,.tif,.tiff,image/*"
            onChange={(event) => choose(event, onFiles)}
          />
        </label>
      </div>

      <ol className="scenario-list">
        {scenarios.map((scenario, index) => (
          <li key={scenario.id} className={scenario.id === activeId ? "active" : ""}>
            <button
              type="button"
              className="scenario-preview"
              aria-label={`Open ${scenario.name}`}
              aria-current={scenario.id === activeId ? "true" : undefined}
              onClick={() => onActivate(scenario.id)}
            >
              {scenario.preview ? (
                <img src={scenario.preview.preview_data_url} alt="" />
              ) : (
                <span className="preview-skeleton" aria-hidden="true" />
              )}
              <Badge variant="outline" className={`scenario-status ${status(scenario).tone}`}>
                {status(scenario).label}
              </Badge>
            </button>
            <div className="scenario-caption">
              <span className="scenario-index">{String(index + 1).padStart(2, "0")}</span>
              <ScenarioName scenario={scenario} onRename={onRename} />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="remove-scenario"
                aria-label={`Remove ${scenario.name}`}
                title="Remove Scenario"
                onClick={() => onRemove(scenario.id)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function ScenarioName({
  scenario,
  onRename,
}: {
  scenario: Scenario;
  onRename: (id: string, name: string) => void;
}) {
  const [draft, setDraft] = useState(scenario.name);

  function commit() {
    const name = draft.trim();
    if (name) onRename(scenario.id, name);
    else setDraft(scenario.name);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      setDraft(scenario.name);
      event.currentTarget.blur();
    }
  }

  return (
    <Input
      value={draft}
      aria-label={`Rename ${scenario.name}`}
      title="Rename Scenario"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
    />
  );
}

function status(scenario: Scenario): { label: string; tone: string } {
  if (scenario.activity === "preparing") return { label: "Preparing", tone: "working" };
  if (scenario.activity === "analyzing") return { label: "Analyzing", tone: "working" };
  if (scenario.error) return { label: "Needs Attention", tone: "error" };
  if (scenario.analysis) return { label: "Analyzed", tone: "complete" };
  if (complete(scenario.selection)) return { label: "Ready", tone: "ready" };
  return { label: "Set Target", tone: "neutral" };
}

function choose(event: ChangeEvent<HTMLInputElement>, onFiles: (files: File[]) => void) {
  const files = Array.from(event.target.files ?? []);
  if (files.length > 0) onFiles(files);
  event.target.value = "";
}
