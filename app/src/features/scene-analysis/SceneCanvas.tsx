import { useState } from "react";

import {
  REGION_LABELS,
  REGION_NAMES,
  type Rectangle,
  type RegionName,
  type Selection,
} from "./model";

type Props = {
  image: string;
  selection: Selection;
  active: RegionName;
  onSelect: (name: RegionName, region: Rectangle) => void;
};

const COLORS: Record<RegionName, string> = {
  target: "#e3a43f",
  local_background: "#78aaa2",
  bright_background: "#d07782",
};

export function SceneCanvas({ image, selection, active, onSelect }: Props) {
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const draft = origin && cursor ? rectangle(origin, cursor) : null;

  return (
    <div className="scene-canvas">
      <img src={image} alt="Selected scene preview" draggable={false} />
      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        aria-label={`Draw ${REGION_LABELS[active]}`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          const point = normalizedPoint(event);
          setOrigin(point);
          setCursor(point);
        }}
        onPointerMove={(event) => {
          if (origin) setCursor(normalizedPoint(event));
        }}
        onPointerUp={(event) => {
          if (!origin) return;
          const selected = rectangle(origin, normalizedPoint(event));
          setOrigin(null);
          setCursor(null);
          if (selected.width >= 0.005 && selected.height >= 0.005) {
            onSelect(active, selected);
          }
        }}
      >
        {REGION_NAMES.map((name) => {
          const region = selection[name];
          if (!region) return null;
          return (
            <g key={name} className="region">
              <rect
                x={region.x}
                y={region.y}
                width={region.width}
                height={region.height}
                fill="none"
                stroke={COLORS[name]}
                strokeWidth={name === active ? 0.006 : 0.004}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={region.x + 0.008}
                y={region.y + 0.028}
                fill={COLORS[name]}
                fontSize={0.025}
                stroke="#171511"
                strokeWidth={0.004}
                paintOrder="stroke"
              >
                {REGION_LABELS[name]}
              </text>
            </g>
          );
        })}
        {draft && (
          <rect
            x={draft.x}
            y={draft.y}
            width={draft.width}
            height={draft.height}
            fill="none"
            stroke={COLORS[active]}
            strokeWidth={0.006}
            strokeDasharray="0.012 0.008"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  );
}

function normalizedPoint(event: React.PointerEvent<SVGSVGElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
    y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
  };
}

function rectangle(start: { x: number; y: number }, end: { x: number; y: number }): Rectangle {
  return {
    type: "rectangle",
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}
