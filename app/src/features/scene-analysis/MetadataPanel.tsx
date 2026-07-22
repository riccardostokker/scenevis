import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import type { ImageMetadata } from "../../shared/api/client";
import { CAPTURE_DETAIL_FIELDS, metadataValue } from "./metadata";

export function MetadataPanel({ metadata }: { metadata: ImageMetadata }) {
  const [showSensitive, setShowSensitive] = useState(false);
  const sensitiveCount = metadata.entries.filter((entry) => entry.sensitive).length;

  return (
    <section className="metadata-panel" aria-labelledby="metadata-heading">
      <div className="section-heading metadata-heading">
        <div>
          <p className="eyebrow">Capture Context</p>
          <h2 id="metadata-heading">Image Metadata</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-pressed={showSensitive}
          onClick={() => setShowSensitive((visible) => !visible)}
        >
          {showSensitive ? (
            <EyeOff data-icon="inline-start" aria-hidden="true" />
          ) : (
            <Eye data-icon="inline-start" aria-hidden="true" />
          )}
          {showSensitive ? "Hide Sensitive Metadata" : "Show Sensitive Metadata"}
        </Button>
      </div>
      <p className="section-description metadata-description">
        Reported by the image and shown for comparison only. These values never change the
        visibility measurements.
      </p>

      <dl className="capture-metadata-list">
        {CAPTURE_DETAIL_FIELDS.map((field) => {
          const value = metadataValue(field, metadata.summary);
          return (
            <div key={field.key}>
              <dt title={field.description}>{field.title}</dt>
              <dd className={!value ? "missing" : ""}>
                {field.sensitive && value && !showSensitive ? "Hidden" : (value ?? "Not Reported")}
              </dd>
            </div>
          );
        })}
      </dl>

      <details className="metadata-inspector">
        <summary>
          <span>All Metadata</span>
          <small>{metadata.entries.length} Fields</small>
        </summary>
        <div className="metadata-privacy-note">
          <ShieldCheck aria-hidden="true" />
          <span>
            {sensitiveCount === 0
              ? "No sensitive source fields were detected."
              : `${sensitiveCount} sensitive ${sensitiveCount === 1 ? "field is" : "fields are"} hidden by default.`}
          </span>
        </div>
        <dl className="metadata-entry-list">
          {metadata.entries.map((entry) => (
            <div key={entry.key}>
              <dt>
                <span>{entry.group}</span>
                {entry.label}
              </dt>
              <dd>{entry.sensitive && !showSensitive ? "Hidden" : entry.value}</dd>
            </div>
          ))}
        </dl>
        {metadata.entries_truncated && (
          <p className="metadata-limit-note">Additional metadata fields were omitted.</p>
        )}
      </details>
    </section>
  );
}
