import { useState } from "react";

import {
  createAnalysis,
  createPreview,
  type Analysis,
  type Preview,
} from "../../shared/api/client";
import { downloadReport } from "./export";
import { MetricPanel } from "./MetricPanel";
import {
  complete,
  REGION_LABELS,
  REGION_NAMES,
  type Rectangle,
  type RegionName,
  type Selection,
} from "./model";
import { SceneCanvas } from "./SceneCanvas";
import { suggestions } from "./selection";

type Activity = "idle" | "preview" | "analysis";

export function Workspace() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [selection, setSelection] = useState<Selection>({});
  const [active, setActive] = useState<RegionName>("target");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [activity, setActivity] = useState<Activity>("idle");
  const [error, setError] = useState<string | null>(null);

  async function chooseImage(nextFile: File) {
    setFile(nextFile);
    setPreview(null);
    setSelection({});
    setAnalysis(null);
    setActive("target");
    setError(null);
    setActivity("preview");
    try {
      setPreview(await createPreview(nextFile));
    } catch (caught) {
      setError(message(caught));
    } finally {
      setActivity("idle");
    }
  }

  function selectRegion(name: RegionName, region: Rectangle) {
    setAnalysis(null);
    if (name === "target" && preview) {
      setSelection(suggestions(region, preview.bright_background_suggestion));
      setActive("local_background");
      return;
    }
    setSelection((current) => ({ ...current, [name]: region }));
    const index = REGION_NAMES.indexOf(name);
    const next = REGION_NAMES[index + 1];
    if (next) setActive(next);
  }

  async function analyze() {
    if (!file || !complete(selection)) return;
    setError(null);
    setActivity("analysis");
    try {
      setAnalysis(await createAnalysis(file, selection));
    } catch (caught) {
      setError(message(caught));
    } finally {
      setActivity("idle");
    }
  }

  return (
    <>
      <header className="masthead">
        <div>
          <p className="eyebrow">Photographic Visibility Analysis</p>
          <h1>Scenevis</h1>
          <p className="lede">
            Select the target and its context. Measurements stay grounded in linear source data.
          </p>
        </div>
        <label className="file-control">
          <span>{file ? "Choose Another Image" : "Choose Image"}</span>
          <input
            type="file"
            accept=".cr2,.dng,.jpg,.jpeg,.png,.tif,.tiff,image/*"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) void chooseImage(selected);
            }}
          />
        </label>
      </header>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {!preview && (
        <section className="empty-state">
          <p className="eyebrow">Start Here</p>
          <h2>{activity === "preview" ? "Preparing Preview…" : "Choose a RAW or Raster Image"}</h2>
          <p>
            The selected file remains in this browser session. The backend uses temporary storage
            only while decoding and measuring it.
          </p>
        </section>
      )}

      {preview && (
        <main className="workspace">
          <section className="scene-column">
            <div className="scene-heading">
              <div>
                <p className="eyebrow">
                  {preview.processing.source === "raw" ? "RAW Source" : "Rendered Source"}
                </p>
                <h2>{preview.image}</h2>
              </div>
              <p>
                {preview.width_px.toLocaleString()} × {preview.height_px.toLocaleString()} px
              </p>
            </div>

            <SceneCanvas
              image={preview.preview_data_url}
              selection={selection}
              active={active}
              onSelect={selectRegion}
            />

            <fieldset className="region-toolbar">
              <legend>Region Selection</legend>
              {REGION_NAMES.map((name) => (
                <button
                  type="button"
                  key={name}
                  className={active === name ? "active" : ""}
                  onClick={() => setActive(name)}
                >
                  <span className={`region-dot ${name}`} />
                  {REGION_LABELS[name]}
                  <small>{selection[name] ? "Ready" : "Draw"}</small>
                </button>
              ))}
            </fieldset>
          </section>

          <aside className="side-column">
            <section className="analysis-actions">
              <p className="eyebrow">Workflow</p>
              <h2>Measure the Target</h2>
              <p>
                Draw the target first. Scenevis suggests both backgrounds; redraw any region to
                refine it before analysis.
              </p>
              <button
                type="button"
                className="primary-button"
                disabled={!complete(selection) || activity !== "idle"}
                onClick={() => void analyze()}
              >
                {activity === "analysis" ? "Analyzing…" : "Analyze Scene"}
              </button>
              {analysis && preview && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => downloadReport(preview, analysis)}
                >
                  Export Static HTML
                </button>
              )}
            </section>

            {analysis ? (
              <MetricPanel analysis={analysis} />
            ) : (
              <section className="metric-placeholder">
                <p className="eyebrow">Metrics</p>
                <h2>Results Appear Here</h2>
                <p>Complete the three regions and analyze the scene to compare visibility.</p>
              </section>
            )}
          </aside>
        </main>
      )}
    </>
  );
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : "The operation could not be completed.";
}
