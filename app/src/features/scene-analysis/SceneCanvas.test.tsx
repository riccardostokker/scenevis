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
    const coloredOutline = canvas.querySelector('rect[stroke="#e3a43f"]');
    expect(canvas.querySelector("text")).toBeNull();
    expect(coloredOutline).toHaveAttribute("stroke-width", "0.007");
    expect(coloredOutline).not.toHaveAttribute("vector-effect");
  });
});
