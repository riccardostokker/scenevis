import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useThemePreference } from "./ThemeControl";

describe("theme preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("applies and remembers an explicit dark theme", async () => {
    render(<ThemeHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Use Dark Theme" }));

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem("scenevis-theme")).toBe("dark");
  });
});

function ThemeHarness() {
  const [theme, setTheme] = useThemePreference();
  return (
    <div>
      <span>{theme}</span>
      <button type="button" onClick={() => setTheme("dark")}>
        Use Dark Theme
      </button>
    </div>
  );
}
