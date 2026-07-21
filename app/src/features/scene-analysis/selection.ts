import type { CompleteSelection, Rectangle, Region } from "./model";

export function suggestions(target: Region, brightBackground: Rectangle): CompleteSelection {
  return {
    target,
    local_background: expand(bounds(target), 2.5),
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

function bounds(region: Region): Rectangle {
  if (region.type === "rectangle") return region;
  const xs = region.points.map(([x]) => x);
  const ys = region.points.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    type: "rectangle",
    x,
    y,
    width: Math.max(...xs) - x,
    height: Math.max(...ys) - y,
  };
}
