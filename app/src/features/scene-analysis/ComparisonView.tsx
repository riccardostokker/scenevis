import { formatMetric, METRICS } from "./metrics";
import { REGION_NAMES } from "./model";
import { RegionShape } from "./SceneCanvas";
import type { Scenario } from "./scenarios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ComparisonView({ scenarios }: { scenarios: Scenario[] }) {
  const completed = scenarios.filter(
    (scenario): scenario is Scenario & { analysis: NonNullable<Scenario["analysis"]> } =>
      scenario.analysis !== null,
  );
  const headlineMetrics = METRICS.slice(0, 4);

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
                  <TableHead key={metric.key} title={metric.description}>
                    {metric.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {completed.map((scenario) => (
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

      <section className="scenario-grid" aria-label="Analyzed Scenario Frames">
        {completed.map((scenario) => (
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
              <dl>
                {headlineMetrics.slice(0, 3).map((metric) => (
                  <div key={metric.key}>
                    <dt>{metric.title}</dt>
                    <dd>{formatMetric(metric, scenario.analysis.result.metrics[metric.key])}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
