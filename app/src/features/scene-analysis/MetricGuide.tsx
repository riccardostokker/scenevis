import { METRICS } from "./metrics";

export function StopExplainer() {
  return (
    <aside className="stop-explainer" aria-labelledby="stop-explainer-heading">
      <h3 id="stop-explainer-heading">What Is a Stop?</h3>
      <p>
        A stop is one doubling or halving of brightness. A difference of 1 stop is 2×, 2 stops is
        4×, and 3 stops is 8×. A positive value means the bright reference is brighter than the
        region being compared; a negative value means it is darker.
      </p>
    </aside>
  );
}

export function MetricGuide() {
  return (
    <details className="metric-guide">
      <summary>
        <span>
          <span className="eyebrow">Metric Guide</span>
          <strong>How to Read the Measurements</strong>
        </span>
        <small>Meaning, calculation, range, and direction</small>
      </summary>
      <div className="metric-guide-body">
        <p className="metric-guide-intro">
          Brightness is measured from linear source data on a scale where 0 is black and 1 is the
          image maximum. A median is the middle pixel value, which makes it less sensitive to a few
          unusually bright or dark pixels.
        </p>
        <StopExplainer />
        <div className="metric-guide-grid">
          {METRICS.map((metric) => (
            <article key={metric.key}>
              <header>
                <h3>{metric.title}</h3>
                <span>{metric.direction}</span>
              </header>
              <p>{metric.description}</p>
              <dl>
                <div>
                  <dt>How It Is Calculated</dt>
                  <dd>{metric.calculation}</dd>
                </div>
                <div>
                  <dt>Value Range</dt>
                  <dd>{metric.range}</dd>
                </div>
                <div>
                  <dt>Is Higher Better?</dt>
                  <dd>{metric.higherIsBetter}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </details>
  );
}
