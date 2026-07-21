import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FileDropZone } from "./FileDropZone";

describe("file drop zone", () => {
  it("accepts a file drop", () => {
    const onFiles = vi.fn();
    const file = new File(["image"], "scene.jpg", { type: "image/jpeg" });
    const dataTransfer = transfer(file);
    render(
      <FileDropZone onFiles={onFiles}>
        <span>Workspace</span>
      </FileDropZone>,
    );
    const zone = screen.getByTestId("file-drop-zone");

    fireEvent.dragEnter(zone, { dataTransfer });
    expect(screen.getByText("Drop Images Here")).toBeInTheDocument();

    fireEvent.dragOver(zone, { dataTransfer });
    fireEvent.drop(zone, { dataTransfer });

    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(screen.queryByText("Drop Images Here")).not.toBeInTheDocument();
  });
});

function transfer(file: File) {
  return {
    types: ["Files"],
    files: {
      0: file,
      length: 1,
      item: (index: number) => (index === 0 ? file : null),
    },
    dropEffect: "none",
  };
}
