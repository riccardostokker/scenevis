import type { Analysis } from "../../shared/api/client";
import { StopExplainer } from "./MetricGuide";
import { formatMetric, METRICS } from "./metrics";
import { QUALITY_METRICS, qualityMetricValue } from "./quality-metrics";

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

      <StopExplainer />

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
              <div className="metric-title-row">
                <h3>{definition.title}</h3>
                <span>{definition.direction}</span>
              </div>
              <p>{definition.description}</p>
              <details className="metric-details">
                <summary>Calculation and Range</summary>
                <dl>
                  <div>
                    <dt>How It Is Calculated</dt>
                    <dd>{definition.calculation}</dd>
                  </div>
                  <div>
                    <dt>Value Range</dt>
                    <dd>{definition.range}</dd>
                  </div>
                  <div>
                    <dt>Is Higher Better?</dt>
                    <dd>{definition.higherIsBetter}</dd>
                  </div>
                </dl>
              </details>
            </div>
            <strong>{formatMetric(definition, result.metrics[definition.key])}</strong>
          </li>
        ))}
      </ol>

      <section className="quality-metric-section" aria-labelledby="quality-metric-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Capture Quality</p>
            <h2 id="quality-metric-heading">Focus, Noise, and Artifacts</h2>
            <p className="quality-scale-note">
              Spatial metrics use linear source data reduced to {result.quality.analysis_width_px}
              {" × "}
              {result.quality.analysis_height_px} px without upscaling. Use the Focus Map tool on
              the image to inspect local sharpness.
            </p>
          </div>
        </div>

        {result.quality.warnings.length > 0 && (
          <div className="warnings quality-warnings" role="status">
            <h3>Quality Interpretation</h3>
            <ul>
              {result.quality.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <ol className="metric-list">
          {QUALITY_METRICS.map((definition) => (
            <li key={definition.key}>
              <div className="metric-copy">
                <div className="metric-title-row">
                  <h3>{definition.title}</h3>
                  <span>{definition.direction}</span>
                </div>
                <p>{definition.description}</p>
                <details className="metric-details">
                  <summary>Calculation and Range</summary>
                  <dl>
                    <div>
                      <dt>How It Is Calculated</dt>
                      <dd>{definition.calculation}</dd>
                    </div>
                    <div>
                      <dt>Value Range</dt>
                      <dd>{definition.range}</dd>
                    </div>
                    <div>
                      <dt>Is Higher Better?</dt>
                      <dd>{definition.higherIsBetter}</dd>
                    </div>
                  </dl>
                </details>
              </div>
              <strong>{qualityMetricValue(definition, result.quality.metrics)}</strong>
            </li>
          ))}
        </ol>
      </section>
      <p className="preview-notice">{result.preview_notice}</p>
    </section>
  );
}
