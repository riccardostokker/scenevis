import type { Metrics, QualityMetrics } from "./model";
import { METRICS } from "./metrics";
import { QUALITY_METRICS } from "./quality-metrics";
import {
  CAPTURE_COMPARISON_FIELDS,
  metadataValue,
  type MetadataField,
  type MetadataFieldKey,
} from "./metadata";
import type { CompletedScenario } from "./scenarios";

export const NOT_REPORTED = "Not Reported";

export type ComparisonFilters = Partial<Record<MetadataFieldKey, string>>;
export type SortDirection = "ascending" | "descending";
export type ComparisonSortTarget =
  | { source: "capture"; key: MetadataFieldKey }
  | { source: "metric"; key: keyof Metrics }
  | { source: "quality"; key: keyof QualityMetrics };
export type ComparisonSort = ComparisonSortTarget & { direction: SortDirection };

export type FilterOption = {
  value: string;
  numericValue: number | null;
};

export function captureFilterValue(scenario: CompletedScenario, field: MetadataField): string {
  return metadataValue(field, scenario.preview.metadata.summary) ?? NOT_REPORTED;
}

export function captureFilterOptions(
  scenarios: readonly CompletedScenario[],
  field: MetadataField,
): FilterOption[] {
  const unique = new Map<string, number | null>();
  for (const scenario of scenarios) {
    const value = captureFilterValue(scenario, field);
    if (!unique.has(value)) {
      unique.set(value, field.numericValue?.(scenario.preview.metadata.summary) ?? null);
    }
  }
  return [...unique.entries()]
    .map(([value, numericValue]) => ({ value, numericValue }))
    .sort(
      (left, right) =>
        compareOptional(left.numericValue, right.numericValue, "ascending") ||
        left.value.localeCompare(right.value),
    );
}

export function comparisonScenarios(
  scenarios: readonly CompletedScenario[],
  filters: ComparisonFilters,
  sort: ComparisonSort | null,
): CompletedScenario[] {
  const filtered = scenarios.filter((scenario) =>
    CAPTURE_COMPARISON_FIELDS.every((field) => {
      const expected = filters[field.key];
      return expected === undefined || captureFilterValue(scenario, field) === expected;
    }),
  );
  if (!sort) return filtered;

  const field =
    sort.source === "capture"
      ? CAPTURE_COMPARISON_FIELDS.find((candidate) => candidate.key === sort.key)
      : undefined;
  return filtered
    .map((scenario, index) => ({ scenario, index }))
    .sort((left, right) => {
      const comparison = compareOptional(
        sortValue(left.scenario, sort, field),
        sortValue(right.scenario, sort, field),
        sort.direction,
      );
      return comparison || left.index - right.index;
    })
    .map(({ scenario }) => scenario);
}

export function sortLabel(sort: ComparisonSort | null): string | null {
  if (!sort) return null;
  const title =
    sort.source === "capture"
      ? CAPTURE_COMPARISON_FIELDS.find((field) => field.key === sort.key)?.title
      : sort.source === "metric"
        ? METRICS.find((metric) => metric.key === sort.key)?.title
        : QUALITY_METRICS.find((metric) => metric.key === sort.key)?.title;
  return `${title ?? sort.key} ${sort.direction}`;
}

function sortValue(
  scenario: CompletedScenario,
  sort: ComparisonSort,
  field: MetadataField | undefined,
): number | null {
  if (sort.source === "capture") {
    return field?.numericValue?.(scenario.preview.metadata.summary) ?? null;
  }
  if (sort.source === "metric") return scenario.analysis.result.metrics[sort.key];
  return scenario.analysis.result.quality.metrics[sort.key];
}

function compareOptional(
  left: number | null,
  right: number | null,
  direction: SortDirection,
): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return (left - right) * (direction === "ascending" ? 1 : -1);
}
