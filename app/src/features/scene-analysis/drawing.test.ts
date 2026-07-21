import { describe, expect, it } from "vitest";

import { appendPoint, polygon, polygonArea, rectangle } from "./drawing";
import type { Point } from "./model";

describe("selection drawing", () => {
  it("builds a box in either drag direction", () => {
    const box = rectangle([0.7, 0.8], [0.2, 0.3]);
    expect(box).toMatchObject({
      type: "rectangle",
      x: 0.2,
      y: 0.3,
      height: 0.5,
    });
    expect(box.width).toBeCloseTo(0.5);
  });

  it("builds a lasso with meaningful area", () => {
    const points: Point[] = [
      [0.1, 0.1],
      [0.6, 0.1],
      [0.5, 0.6],
      [0.1, 0.5],
    ];

    expect(polygonArea(points)).toBeGreaterThan(0.1);
    expect(polygon(points)).toEqual({ type: "polygon", points });
  });

  it("filters incidental lasso jitter", () => {
    const start: [number, number] = [0.2, 0.2];
    expect(appendPoint([start], [0.201, 0.201])).toEqual([start]);
  });
});
