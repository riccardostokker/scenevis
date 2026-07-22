import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SceneCanvas } from "./SceneCanvas";

describe("scene canvas", () => {
  it("renders visible geometry without image text", () => {
    render(
      <SceneCanvas
        image="data:image/jpeg;base64,abc"
        selection={{
          target: { type: "rectangle", x: 0.1, y: 0.2, width: 0.2, height: 0.3 },
        }}
        active="target"
        mode="box"
        onActiveChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    const canvas = screen.getByLabelText("Box Target");
    const coloredOutline = canvas.querySelector('rect[data-layer="outline"]');
    const halo = canvas.querySelector('rect[data-layer="halo"]');
    expect(canvas.querySelector("text")).toBeNull();
    expect(coloredOutline).toHaveAttribute("stroke", "#e3a43f");
    expect(coloredOutline).toHaveAttribute("stroke-width", "2.4");
    expect(coloredOutline).toHaveAttribute("stroke-linejoin", "round");
    expect(coloredOutline).toHaveAttribute("vector-effect", "non-scaling-stroke");
    expect(halo).toHaveAttribute("stroke", "#0d0c0a");
    expect(halo).toHaveAttribute("stroke-opacity", "0.78");
    expect(halo).toHaveAttribute("stroke-width", "4");
  });

  it("renders a bounded local sharpness map when requested", () => {
    render(
      <SceneCanvas
        image="data:image/jpeg;base64,abc"
        selection={{}}
        active="target"
        mode="select"
        focusMap={[
          {
            x: 0.1,
            y: 0.2,
            width: 0.1,
            height: 0.1,
            sharpness: 0.2,
            relative_sharpness: 0.75,
            in_focus: true,
          },
        ]}
        showFocusMap
        onActiveChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    const tile = screen.getByLabelText("Select Target").querySelector(".focus-tile");
    expect(tile).toHaveAttribute("data-in-focus", "true");
    expect(tile).toHaveAttribute("data-relative-sharpness", "0.750");
    expect(tile).toHaveAttribute("vector-effect", "non-scaling-stroke");
  });
});
