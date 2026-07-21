import type { Analysis } from "../../shared/api/client";
import { formatMetric, METRICS } from "./metrics";

export function MetricPanel({ analysis }: { analysis: Analysis }) {
  const { result } = analysis;
  return (
    <section className="metric-panel" aria-labelledby="metric-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Analysis</p>
          <h2 id="metric-heading">Visibility Metrics</h2>
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div className="warnings" role="status">
          <h3>Measurement Warnings</h3>
          <ul>
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <ol className="metric-list">
        {METRICS.map((definition) => (
          <li key={definition.key}>
            <div className="metric-copy">
              <h3>{definition.title}</h3>
              <p>{definition.description}</p>
            </div>
            <strong>{formatMetric(definition, result.metrics[definition.key])}</strong>
          </li>
        ))}
      </ol>
      <p className="preview-notice">{result.preview_notice}</p>
    </section>
  );
}
