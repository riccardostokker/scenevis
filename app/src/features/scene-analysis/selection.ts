import type { CompleteSelection, Rectangle } from "./model";

export function suggestions(target: Rectangle, brightBackground: Rectangle): CompleteSelection {
  return {
    target,
    local_background: expand(target, 2.5),
    bright_background: brightBackground,
  };
}

export function expand(region: Rectangle, factor: number): Rectangle {
  const width = Math.min(1, region.width * factor);
  const height = Math.min(1, region.height * factor);
  const centerX = region.x + region.width / 2;
  const centerY = region.y + region.height / 2;
  return {
    type: "rectangle",
    x: Math.min(Math.max(0, centerX - width / 2), 1 - width),
    y: Math.min(Math.max(0, centerY - height / 2), 1 - height),
    width,
    height,
  };
}
