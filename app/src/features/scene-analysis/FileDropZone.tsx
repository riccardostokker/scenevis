import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  onFile: (file: File) => void;
};

export function FileDropZone({ children, onFile }: Props) {
  const dragDepth = useRef(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    function preventFileNavigation(event: globalThis.DragEvent) {
      if (!hasFiles(event.dataTransfer)) return;
      event.preventDefault();
      if (event.type === "drop") {
        dragDepth.current = 0;
        setActive(false);
      }
    }

    window.addEventListener("dragover", preventFileNavigation);
    window.addEventListener("drop", preventFileNavigation);
    return () => {
      window.removeEventListener("dragover", preventFileNavigation);
      window.removeEventListener("drop", preventFileNavigation);
    };
  }, []);

  function enter(event: DragEvent<HTMLElement>) {
    if (!hasFiles(event.dataTransfer)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setActive(true);
  }

  function over(event: DragEvent<HTMLElement>) {
    if (!hasFiles(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function leave(event: DragEvent<HTMLElement>) {
    if (!hasFiles(event.dataTransfer)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setActive(false);
  }

  function drop(event: DragEvent<HTMLElement>) {
    if (!hasFiles(event.dataTransfer)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setActive(false);
    const file = event.dataTransfer.files.item(0);
    if (file) onFile(file);
  }

  return (
    <section
      className={`file-drop-zone${active ? " dragging" : ""}`}
      data-testid="file-drop-zone"
      aria-label="Image Workspace"
      onDragEnter={enter}
      onDragOver={over}
      onDragLeave={leave}
      onDrop={drop}
    >
      {children}
      {active && (
        <div className="drop-overlay" role="status">
          <div>
            <p className="eyebrow">Image Ready</p>
            <strong>Drop Image Here</strong>
          </div>
        </div>
      )}
    </section>
  );
}

function hasFiles(dataTransfer: DataTransfer | null): boolean {
  return dataTransfer?.types.includes("Files") ?? false;
}
