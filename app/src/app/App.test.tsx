import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("application shell", () => {
  it("starts with a multi-image study chooser and memory policy", () => {
    render(<App />);

    expect(screen.getByText("Scenevis")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Compare Visibility across Locations" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Choose Images")).toBeInTheDocument();
    expect(screen.getByText(/remain in browser memory/i)).toBeInTheDocument();
  });
});
