import { useState } from "react";

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ComparisonFilters } from "./ComparisonFilters";
import {
  comparisonScenarios,
  sortLabel,
  type ComparisonFilters as ComparisonFilterState,
  type ComparisonSort,
  type ComparisonSortTarget,
} from "./comparison";
import { formatMetric, METRICS } from "./metrics";
import { MetricGuide } from "./MetricGuide";
import {
  CAPTURE_CARD_FIELDS,
  CAPTURE_COMPARISON_FIELDS,
  metadataValue,
  mismatchFields,
} from "./metadata";
import { REGION_NAMES } from "./model";
import {
  formatQualityMetric,
  QUALITY_HEADLINE_METRICS,
  qualityMetricValue,
} from "./quality-metrics";
import { RegionShape } from "./SceneCanvas";
import type { CompletedScenario, Scenario } from "./scenarios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ComparisonView({ scenarios }: { scenarios: Scenario[] }) {
  const [filters, setFilters] = useState<ComparisonFilterState>({});
  const [sort, setSort] = useState<ComparisonSort | null>(null);
  const completed = scenarios.filter(
    (scenario): scenario is CompletedScenario =>
      scenario.preview !== null && scenario.analysis !== null,
  );
  const headlineMetrics = METRICS.slice(0, 4);
  const visible = comparisonScenarios(completed, filters, sort);
  const captureMismatches = mismatchFields(
    visible.map((scenario) => scenario.preview.metadata.summary),
  );

  function toggleSort(target: ComparisonSortTarget) {
    setSort((current) => {
      const isCurrent = current?.source === target.source && current.key === target.key;
      return {
        ...target,
        direction: isCurrent && current.direction === "ascending" ? "descending" : "ascending",
      } as ComparisonSort;
    });
  }

  function resetView() {
    setFilters({});
    setSort(null);
  }

  if (completed.length === 0) {
    return (
      <section className="comparison-empty">
        <p className="eyebrow">Comparison</p>
        <h1>Analyze a Scenario to Begin</h1>
        <p>
          Completed scenarios appear here as comparable image frames with the most important
          visibility measurements aligned in one table.
        </p>
      </section>
    );
  }

  return (
    <main className="comparison-view">
      <header className="comparison-heading">
        <div>
          <p className="eyebrow">Comparison</p>
          <h1>Location Study</h1>
          <p>
            {completed.length} of {scenarios.length} scenarios analyzed
          </p>
        </div>
      </header>

      <ComparisonFilters
        scenarios={completed}
        visibleCount={visible.length}
        filters={filters}
        sortDescription={sortLabel(sort)}
        onFilterChange={(key, value) =>
          setFilters((current) => {
            const next = { ...current };
            if (value === undefined) delete next[key];
            else next[key] = value;
            return next;
          })
        }
        onReset={resetView}
      />

      {visible.length === 0 ? (
        <section className="comparison-filter-empty" role="status">
          <h2>No Scenarios Match</h2>
          <p>Change a camera-setting filter or reset the view to show every analyzed scenario.</p>
          <Button variant="outline" size="sm" onClick={resetView}>
            Reset View
          </Button>
        </section>
      ) : (
        <>
          <section className="capture-comparison-section" aria-labelledby="capture-table-heading">
            <div className="section-heading comparison-section-heading">
              <div>
                <p className="eyebrow">Capture Consistency</p>
                <h2 id="capture-table-heading">Camera Settings</h2>
                <p className="comparison-section-description">
                  Metadata is reported by each image and does not affect visibility measurements.
                </p>
              </div>
              <span
                className={
                  captureMismatches.size > 0 ? "difference-count active" : "difference-count"
                }
              >
                {captureMismatches.size}{" "}
                {captureMismatches.size === 1 ? "Difference" : "Differences"}
              </span>
            </div>
            <div className="comparison-table-wrap">
              <Table className="comparison-table capture-comparison-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    {CAPTURE_COMPARISON_FIELDS.map((field) =>
                      field.numericValue ? (
                        <SortableTableHead
                          key={field.key}
                          title={field.title}
                          description={field.description}
                          target={{ source: "capture", key: field.key }}
                          sort={sort}
                          onSort={toggleSort}
                        />
                      ) : (
                        <TableHead key={field.key} title={field.description}>
                          {field.title}
                        </TableHead>
                      ),
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((scenario) => (
                    <TableRow key={scenario.id}>
                      <TableCell className="scenario-name-cell">{scenario.name}</TableCell>
                      {CAPTURE_COMPARISON_FIELDS.map((field) => {
                        const differs = captureMismatches.has(field.key);
                        return (
                          <TableCell
                            key={field.key}
                            className={differs ? "metadata-differs" : undefined}
                            title={differs ? `${field.title} differs between scenarios` : undefined}
                          >
                            {metadataValue(field, scenario.preview.metadata.summary) ??
                              "Not Reported"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="comparison-table-section" aria-labelledby="comparison-table-heading">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Overview</p>
                <h2 id="comparison-table-heading">Key Measurements</h2>
              </div>
            </div>
            <div className="comparison-table-wrap">
              <Table className="comparison-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    {headlineMetrics.map((metric) => (
                      <SortableTableHead
                        key={metric.key}
                        title={metric.title}
                        description={metric.description}
                        target={{ source: "metric", key: metric.key }}
                        sort={sort}
                        onSort={toggleSort}
                      />
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((scenario) => (
                    <TableRow key={scenario.id}>
                      <TableCell className="scenario-name-cell">{scenario.name}</TableCell>
                      {headlineMetrics.map((metric) => (
                        <TableCell key={metric.key}>
                          {formatMetric(metric, scenario.analysis.result.metrics[metric.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="comparison-table-section" aria-labelledby="quality-table-heading">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Capture Quality</p>
                <h2 id="quality-table-heading">Focus and Detail</h2>
                <p className="comparison-section-description">
                  Compare similarly framed targets. Subject texture remains part of every
                  no-reference quality score.
                </p>
              </div>
            </div>
            <div className="comparison-table-wrap">
              <Table className="comparison-table quality-comparison-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    {QUALITY_HEADLINE_METRICS.map((metric) => (
                      <SortableTableHead
                        key={metric.key}
                        title={metric.title}
                        description={metric.description}
                        target={{ source: "quality", key: metric.key }}
                        sort={sort}
                        onSort={toggleSort}
                      />
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((scenario) => (
                    <TableRow key={scenario.id}>
                      <TableCell className="scenario-name-cell">{scenario.name}</TableCell>
                      {QUALITY_HEADLINE_METRICS.map((metric) => (
                        <TableCell key={metric.key}>
                          {formatQualityMetric(
                            metric,
                            scenario.analysis.result.quality.metrics[metric.key],
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <MetricGuide />

          <section className="scenario-grid" aria-label="Analyzed Scenario Frames">
            {visible.map((scenario) => (
              <article className="comparison-card" key={scenario.id}>
                <figure className="comparison-frame">
                  {scenario.preview && (
                    <img src={scenario.preview.preview_data_url} alt={scenario.name} />
                  )}
                  <svg viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
                    {REGION_NAMES.map((name) => (
                      <RegionShape
                        key={name}
                        region={scenario.analysis.regions[name]}
                        name={name}
                        active={false}
                      />
                    ))}
                  </svg>
                </figure>
                <div className="comparison-card-copy">
                  <div>
                    <p className="eyebrow">Scenario</p>
                    <h2>{scenario.name}</h2>
                  </div>
                  <div className="comparison-card-facts">
                    <p className="eyebrow">Capture</p>
                    <dl>
                      {CAPTURE_CARD_FIELDS.map((field) => (
                        <div key={field.key}>
                          <dt>{field.title}</dt>
                          <dd>
                            {metadataValue(field, scenario.preview.metadata.summary) ??
                              "Not Reported"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="eyebrow metric-eyebrow">Visibility</p>
                    <dl>
                      {headlineMetrics.slice(0, 3).map((metric) => (
                        <div key={metric.key}>
                          <dt>{metric.title}</dt>
                          <dd>
                            {formatMetric(metric, scenario.analysis.result.metrics[metric.key])}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="eyebrow metric-eyebrow">Capture Quality</p>
                    <dl>
                      {QUALITY_HEADLINE_METRICS.slice(0, 3).map((metric) => (
                        <div key={metric.key}>
                          <dt>{metric.title}</dt>
                          <dd>
                            {qualityMetricValue(metric, scenario.analysis.result.quality.metrics)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

type SortableTableHeadProps = {
  title: string;
  description: string;
  target: ComparisonSortTarget;
  sort: ComparisonSort | null;
  onSort: (target: ComparisonSortTarget) => void;
};

function SortableTableHead({ title, description, target, sort, onSort }: SortableTableHeadProps) {
  const active = sort?.source === target.source && sort.key === target.key;
  const direction = active ? sort.direction : null;
  const Icon =
    direction === "ascending"
      ? ArrowUpIcon
      : direction === "descending"
        ? ArrowDownIcon
        : ArrowUpDownIcon;
  return (
    <TableHead title={description} aria-sort={direction ?? "none"}>
      <button
        className="comparison-sort-button"
        type="button"
        onClick={() => onSort(target)}
        aria-label={`Sort by ${title}${direction ? `, currently ${direction}` : ""}`}
      >
        <span>{title}</span>
        <Icon aria-hidden="true" />
      </button>
    </TableHead>
  );
}
