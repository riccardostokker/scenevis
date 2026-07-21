import type { Point, Polygon, Rectangle } from "./model";

const MIN_DISTANCE = 0.004;

export function rectangle(start: Point, end: Point): Rectangle {
  return {
    type: "rectangle",
    x: Math.min(start[0], end[0]),
    y: Math.min(start[1], end[1]),
    width: Math.abs(end[0] - start[0]),
    height: Math.abs(end[1] - start[1]),
  };
}

export function appendPoint(points: Point[], point: Point): Point[] {
  const previous = points.at(-1);
  if (previous && Math.hypot(point[0] - previous[0], point[1] - previous[1]) < MIN_DISTANCE) {
    return points;
  }
  return [...points, point];
}

export function polygon(points: Point[]): Polygon | null {
  if (points.length < 3 || polygonArea(points) < 0.000025) return null;
  return { type: "polygon", points };
}

export function polygonArea(points: Point[]): number {
  return Math.abs(
    points.reduce((area, point, index) => {
      const next = points[(index + 1) % points.length];
      return next ? area + point[0] * next[1] - next[0] * point[1] : area;
    }, 0) / 2,
  );
}
