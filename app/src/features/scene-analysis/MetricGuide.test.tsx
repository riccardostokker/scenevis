import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetricGuide } from "./MetricGuide";
import { METRICS } from "./metrics";

describe("metric guide", () => {
  it("explains stops and gives every metric a calculation, range, and direction", () => {
    render(<MetricGuide />);

    expect(screen.getByText("What Is a Stop?")).toBeInTheDocument();
    expect(screen.getByText(/1 stop is 2×, 2 stops is 4×, and 3 stops is 8×/)).toBeInTheDocument();
    expect(screen.getAllByText("How It Is Calculated")).toHaveLength(METRICS.length);
    expect(screen.getAllByText("Value Range")).toHaveLength(METRICS.length);
    expect(screen.getAllByText("Is Higher Better?")).toHaveLength(METRICS.length);
  });
});
