import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  captureFilterOptions,
  type ComparisonFilters as ComparisonFilterState,
} from "./comparison";
import { CAPTURE_COMPARISON_FIELDS, type MetadataFieldKey } from "./metadata";
import type { CompletedScenario } from "./scenarios";

const ALL_VALUES = "__scenevis_all_values__";

type ComparisonFilterProps = {
  scenarios: readonly CompletedScenario[];
  visibleCount: number;
  filters: ComparisonFilterState;
  sortDescription: string | null;
  onFilterChange: (key: MetadataFieldKey, value: string | undefined) => void;
  onReset: () => void;
};

export function ComparisonFilters({
  scenarios,
  visibleCount,
  filters,
  sortDescription,
  onFilterChange,
  onReset,
}: ComparisonFilterProps) {
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasViewChanges = activeFilterCount > 0 || sortDescription !== null;

  return (
    <section className="comparison-controls" aria-labelledby="comparison-filter-heading">
      <div className="comparison-controls-heading">
        <div>
          <p className="eyebrow">View Controls</p>
          <h2 id="comparison-filter-heading">Filter by Camera Settings</h2>
          <p>
            Select an exact reported setting to compare like-for-like captures. Sorting a numeric
            column orders both tables and the scenario frames.
          </p>
        </div>
        <div className="comparison-view-status" aria-live="polite">
          <strong>
            Showing {visibleCount} of {scenarios.length}
          </strong>
          <span>
            {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"}
            {sortDescription ? ` · Sorted by ${sortDescription}` : ""}
          </span>
        </div>
      </div>

      <div className="comparison-filter-grid">
        {CAPTURE_COMPARISON_FIELDS.map((field) => (
          <div className="comparison-filter" key={field.key}>
            <span>{field.title}</span>
            <Select
              value={filters[field.key] ?? ALL_VALUES}
              onValueChange={(value) =>
                onFilterChange(field.key, value === ALL_VALUES ? undefined : value)
              }
            >
              <SelectTrigger size="sm" aria-label={`${field.title} Filter`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value={ALL_VALUES}>All {field.title}</SelectItem>
                {captureFilterOptions(scenarios, field).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="comparison-controls-footer">
        <p>Missing metadata appears as “Not Reported” and always sorts last.</p>
        <Button variant="outline" size="sm" disabled={!hasViewChanges} onClick={onReset}>
          Reset View
        </Button>
      </div>
    </section>
  );
}
