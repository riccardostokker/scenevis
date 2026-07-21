import { describe, expect, it } from "vitest";

import type { Rectangle } from "./model";
import { expand, suggestions } from "./selection";

const target: Rectangle = { type: "rectangle", x: 0.2, y: 0.3, width: 0.1, height: 0.15 };

describe("region suggestions", () => {
  it("surrounds the target and retains the bright suggestion", () => {
    const bright: Rectangle = {
      type: "rectangle",
      x: 0.75,
      y: 0.05,
      width: 0.15,
      height: 0.15,
    };
    const regions = suggestions(target, bright);

    expect(regions.local_background.x).toBeLessThan(target.x);
    expect(regions.local_background.width).toBeGreaterThan(target.width);
    expect(regions.bright_background).toBe(bright);
  });

  it("keeps expansions within the image", () => {
    const edge: Rectangle = {
      type: "rectangle",
      x: 0.94,
      y: 0.95,
      width: 0.06,
      height: 0.05,
    };
    const region = expand(edge, 2.5);

    expect(region.x + region.width).toBeLessThanOrEqual(1);
    expect(region.y + region.height).toBeLessThanOrEqual(1);
  });
});
