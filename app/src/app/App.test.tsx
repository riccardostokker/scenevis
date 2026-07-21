import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("application shell", () => {
  it("starts with an image chooser and memory policy", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Scenevis" })).toBeInTheDocument();
    expect(screen.getByText("Choose Image")).toBeInTheDocument();
    expect(screen.getByText(/remains in this browser session/i)).toBeInTheDocument();
  });
});
