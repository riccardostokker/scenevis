import { useState, type PointerEvent } from "react";

import { appendPoint, polygon, rectangle } from "./drawing";
import {
  DRAWING_MODE_LABELS,
  REGION_LABELS,
  REGION_NAMES,
  type DrawingMode,
  type Point,
  type Region,
  type RegionName,
  type Selection,
} from "./model";

type Props = {
  image: string;
  selection: Selection;
  active: RegionName;
  mode: DrawingMode;
  onActiveChange: (name: RegionName) => void;
  onSelect: (name: RegionName, region: Region) => void;
};

const COLORS: Record<RegionName, string> = {
  target: "#e3a43f",
  local_background: "#78aaa2",
  bright_background: "#d07782",
};

export function SceneCanvas({ image, selection, active, mode, onActiveChange, onSelect }: Props) {
  const [origin, setOrigin] = useState<Point | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  const [lassoPoints, setLassoPoints] = useState<Point[]>([]);

  const draftBox = mode === "box" && origin && cursor ? rectangle(origin, cursor) : null;
  const draftLasso = mode === "lasso" ? lassoPoints : [];

  function resetDraft() {
    setOrigin(null);
    setCursor(null);
    setLassoPoints([]);
  }

  function start(event: PointerEvent<SVGSVGElement>) {
    if (mode === "select") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = normalizedPoint(event);
    setOrigin(point);
    setCursor(point);
    setLassoPoints(mode === "lasso" ? [point] : []);
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    if (!origin) return;
    const point = normalizedPoint(event);
    setCursor(point);
    if (mode === "lasso") setLassoPoints((current) => appendPoint(current, point));
  }

  function finish(event: PointerEvent<SVGSVGElement>) {
    if (!origin) return;
    const point = normalizedPoint(event);
    if (mode === "box") {
      const region = rectangle(origin, point);
      if (region.width >= 0.005 && region.height >= 0.005) onSelect(active, region);
    } else if (mode === "lasso") {
      const region = polygon(appendPoint(lassoPoints, point));
      if (region) onSelect(active, region);
    }
    resetDraft();
  }

  return (
    <div className={`scene-canvas mode-${mode}`}>
      <img src={image} alt="Selected scene preview" draggable={false} />
      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        aria-label={`${DRAWING_MODE_LABELS[mode]} ${REGION_LABELS[active]}`}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={resetDraft}
      >
        {REGION_NAMES.map((name) => {
          const region = selection[name];
          if (!region) return null;
          return (
            <g
              key={name}
              className={`region${name === active ? " active" : ""}`}
              style={{ pointerEvents: mode === "select" ? "visiblePainted" : "none" }}
              onPointerDown={(event) => {
                if (mode !== "select") return;
                event.stopPropagation();
                onActiveChange(name);
              }}
            >
              <RegionShape region={region} color={COLORS[name]} active={name === active} />
            </g>
          );
        })}

        {draftBox && (
          <rect
            x={draftBox.x}
            y={draftBox.y}
            width={draftBox.width}
            height={draftBox.height}
            className="draft-region"
            fill={`${COLORS[active]}28`}
            stroke={COLORS[active]}
          />
        )}
        {draftLasso.length > 1 && (
          <polyline
            points={points(draftLasso)}
            className="draft-region"
            fill={`${COLORS[active]}28`}
            stroke={COLORS[active]}
          />
        )}
      </svg>
    </div>
  );
}

function RegionShape({
  region,
  color,
  active,
}: {
  region: Region;
  color: string;
  active: boolean;
}) {
  return (
    <>
      <Geometry region={region} fill="none" stroke="#171511" strokeWidth={active ? 0.012 : 0.009} />
      <Geometry
        region={region}
        fill={`${color}28`}
        stroke={color}
        strokeWidth={active ? 0.007 : 0.005}
      />
    </>
  );
}

function Geometry({
  region,
  fill,
  stroke,
  strokeWidth,
}: {
  region: Region;
  fill: string;
  stroke: string;
  strokeWidth: number;
}) {
  if (region.type === "polygon") {
    return (
      <polygon
        points={points(region.points)}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }
  return (
    <rect
      x={region.x}
      y={region.y}
      width={region.width}
      height={region.height}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}

function normalizedPoint(event: PointerEvent<SVGSVGElement>): Point {
  const bounds = event.currentTarget.getBoundingClientRect();
  return [
    Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
    Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
  ];
}

function points(value: Point[]): string {
  return value.map(([x, y]) => `${x},${y}`).join(" ");
}
