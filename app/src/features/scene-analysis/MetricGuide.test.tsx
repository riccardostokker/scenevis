import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetricGuide } from "./MetricGuide";
import { METRICS } from "./metrics";
import { QUALITY_METRICS } from "./quality-metrics";

describe("metric guide", () => {
  it("explains stops and gives every metric a calculation, range, and direction", () => {
    render(<MetricGuide />);

    expect(screen.getByText("What Is a Stop?")).toBeInTheDocument();
    expect(screen.getByText(/1 stop is 2×, 2 stops is 4×, and 3 stops is 8×/)).toBeInTheDocument();
    const total = METRICS.length + QUALITY_METRICS.length;
    expect(
      screen.getByRole("heading", { name: "Focus, Noise, and Artifacts", hidden: true }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("How It Is Calculated")).toHaveLength(total);
    expect(screen.getAllByText("Value Range")).toHaveLength(total);
    expect(screen.getAllByText("Is Higher Better?")).toHaveLength(total);
  });
});
