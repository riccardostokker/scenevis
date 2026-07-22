import { useState, type PointerEvent, type ReactNode } from "react";

import { appendPoint, polygon, rectangle } from "./drawing";
import {
  DRAWING_MODE_LABELS,
  type FocusTile,
  REGION_COLORS,
  REGION_LABELS,
  REGION_NAMES,
  REGION_STROKES,
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
  toolbar?: ReactNode;
  focusMap?: FocusTile[];
  showFocusMap?: boolean;
};

export function SceneCanvas({
  image,
  selection,
  active,
  mode,
  onActiveChange,
  onSelect,
  toolbar,
  focusMap = [],
  showFocusMap = false,
}: Props) {
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
        {showFocusMap && focusMap.length > 0 && (
          <g className="focus-map">
            <title>Local Target Sharpness Map</title>
            {focusMap.map((tile) => (
              <rect
                key={`${tile.x}-${tile.y}`}
                className="focus-tile"
                x={tile.x}
                y={tile.y}
                width={tile.width}
                height={tile.height}
                fill={REGION_COLORS.target}
                fillOpacity={0.08 + tile.relative_sharpness * 0.44}
                stroke={REGION_COLORS.target}
                strokeOpacity={0.2 + tile.relative_sharpness * 0.55}
                strokeWidth={0.75}
                vectorEffect="non-scaling-stroke"
                data-in-focus={tile.in_focus}
                data-relative-sharpness={tile.relative_sharpness.toFixed(3)}
              />
            ))}
          </g>
        )}

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
              <RegionShape region={region} name={name} active={name === active} />
            </g>
          );
        })}

        {draftBox && <DraftBox region={draftBox} color={REGION_COLORS[active]} />}
        {draftLasso.length > 1 && <DraftLasso value={draftLasso} color={REGION_COLORS[active]} />}
      </svg>
      {toolbar}
    </div>
  );
}

export function RegionShape({
  region,
  name,
  active,
}: {
  region: Region;
  name: RegionName;
  active: boolean;
}) {
  const color = REGION_COLORS[name];
  const treatment = active ? REGION_STROKES.active : REGION_STROKES.resting;
  return (
    <>
      <Geometry
        region={region}
        fill="none"
        stroke="#0d0c0a"
        strokeOpacity={0.78}
        strokeWidth={treatment.halo}
        dataLayer="halo"
      />
      <Geometry
        region={region}
        fill={`${color}${treatment.fillAlpha}`}
        stroke={color}
        strokeWidth={treatment.outline}
        dataLayer="outline"
      />
    </>
  );
}

function Geometry({
  region,
  fill,
  stroke,
  strokeOpacity,
  strokeWidth,
  dataLayer,
}: {
  region: Region;
  fill: string;
  stroke: string;
  strokeOpacity?: number;
  strokeWidth: number;
  dataLayer: "halo" | "outline";
}) {
  if (region.type === "polygon") {
    return (
      <polygon
        points={points(region.points)}
        fill={fill}
        stroke={stroke}
        strokeOpacity={strokeOpacity}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        data-layer={dataLayer}
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
      strokeOpacity={strokeOpacity}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      data-layer={dataLayer}
    />
  );
}

function DraftBox({ region, color }: { region: Region & { type: "rectangle" }; color: string }) {
  return (
    <>
      <rect
        x={region.x}
        y={region.y}
        width={region.width}
        height={region.height}
        className="draft-region halo"
        fill="none"
        stroke="#0d0c0a"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x={region.x}
        y={region.y}
        width={region.width}
        height={region.height}
        className="draft-region outline"
        fill={`${color}18`}
        stroke={color}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

function DraftLasso({ value, color }: { value: Point[]; color: string }) {
  return (
    <>
      <polyline
        points={points(value)}
        className="draft-region halo"
        fill="none"
        stroke="#0d0c0a"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={points(value)}
        className="draft-region outline"
        fill={`${color}18`}
        stroke={color}
        vectorEffect="non-scaling-stroke"
      />
    </>
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
