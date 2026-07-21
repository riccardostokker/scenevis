from __future__ import annotations

import tkinter as tk
from pathlib import Path
from tkinter import messagebox, ttk

from PIL import Image, ImageTk

from scene_analyzer.error import SceneAnalyzerError
from scene_analyzer.scene.load import load
from scene_analyzer.scene.model import FloatImage
from scene_analyzer.scene.roi import Rectangle, save_roi_config
from scene_analyzer.scene.selection.model import Selection, default_output_path, suggest_regions

REGIONS = ("target", "local_background", "bright_background")
LABELS = {
    "target": "Target",
    "local_background": "Local background",
    "bright_background": "Bright background",
}
COLORS = {
    "target": "#d89b34",
    "local_background": "#75a7a1",
    "bright_background": "#c66a76",
}


def select_rois(
    image_path: Path, *, output_path: Path | None = None, overwrite: bool = False
) -> Path | None:
    """Open the native selector and return the saved YAML path, or None on cancel."""

    destination = output_path or default_output_path(image_path)
    if destination.exists() and not overwrite:
        raise SceneAnalyzerError(
            f"ROI document already exists: {destination}; pass --overwrite to replace"
        )
    loaded = load(image_path)
    try:
        root = tk.Tk()
    except tk.TclError as error:
        raise SceneAnalyzerError(f"could not open ROI selector: {error}") from error
    selector = _Selector(
        root,
        image_path=image_path,
        preview=loaded.preview,
        linear_rgb=loaded.linear_rgb,
        destination=destination,
    )
    root.mainloop()
    return selector.saved_path


class _Selector:
    def __init__(
        self,
        root: tk.Tk,
        *,
        image_path: Path,
        preview: Image.Image,
        linear_rgb: FloatImage,
        destination: Path,
    ) -> None:
        self.root = root
        self.image_path = image_path
        self.destination = destination
        self.linear_rgb = linear_rgb
        self.selection = Selection()
        self.mode = "target"
        self.drag_origin: tuple[int, int] | None = None
        self.drag_item: int | None = None
        self.saved_path: Path | None = None

        self.preview = preview.convert("RGB").copy()
        screen_width = max(720, root.winfo_screenwidth() - 420)
        screen_height = max(520, root.winfo_screenheight() - 180)
        self.preview.thumbnail((screen_width, screen_height), Image.Resampling.LANCZOS)
        self.photo = ImageTk.PhotoImage(self.preview)

        root.title(f"Select regions — {image_path.name}")
        root.configure(background="#1d1b18")
        root.protocol("WM_DELETE_WINDOW", self._cancel)
        self._style()
        self._build()
        self._redraw()

    def _style(self) -> None:
        style = ttk.Style(self.root)
        style.theme_use("clam")
        style.configure("TFrame", background="#1d1b18")
        style.configure("TLabel", background="#1d1b18", foreground="#e8e1d6")
        style.configure(
            "TButton", background="#35312b", foreground="#eee7dc", borderwidth=0, padding=9
        )
        style.map("TButton", background=[("active", "#494238")])
        style.configure("Accent.TButton", background="#b77c28", foreground="#17130f", borderwidth=0)
        style.map("Accent.TButton", background=[("active", "#d09537")])

    def _build(self) -> None:
        frame = ttk.Frame(self.root, padding=16)
        frame.grid(sticky="nsew")
        self.root.rowconfigure(0, weight=1)
        self.root.columnconfigure(0, weight=1)
        frame.rowconfigure(0, weight=1)
        frame.columnconfigure(0, weight=1)

        self.canvas = tk.Canvas(
            frame,
            width=self.preview.width,
            height=self.preview.height,
            background="#11100e",
            highlightthickness=0,
            cursor="crosshair",
        )
        self.canvas.grid(row=0, column=0, sticky="nsew")
        self.canvas.create_image(0, 0, image=self.photo, anchor="nw", tags=("image",))
        self.canvas.bind("<ButtonPress-1>", self._begin_drag)
        self.canvas.bind("<B1-Motion>", self._drag)
        self.canvas.bind("<ButtonRelease-1>", self._end_drag)

        panel = ttk.Frame(frame, padding=(22, 4, 0, 0))
        panel.grid(row=0, column=1, sticky="ns")
        ttk.Label(panel, text="Regions", font=("TkDefaultFont", 18, "bold")).pack(anchor="w")
        ttk.Label(
            panel,
            text="Draw the target first. Suggested backgrounds\ncan be redrawn before saving.",
            foreground="#bcb3a7",
        ).pack(anchor="w", pady=(8, 20))

        self.mode_buttons: dict[str, ttk.Button] = {}
        for name in REGIONS:
            button = ttk.Button(
                panel, text=LABELS[name], command=lambda value=name: self._set_mode(value)
            )
            button.pack(fill="x", pady=4)
            self.mode_buttons[name] = button

        self.status = ttk.Label(panel, text="", foreground="#bcb3a7")
        self.status.pack(anchor="w", pady=(20, 18))
        ttk.Button(panel, text="Clear selected", command=self._clear_selected).pack(
            fill="x", pady=4
        )
        ttk.Button(panel, text="Save YAML", style="Accent.TButton", command=self._save).pack(
            fill="x", pady=(24, 4)
        )
        ttk.Button(panel, text="Cancel", command=self._cancel).pack(fill="x", pady=4)
        ttk.Label(
            panel,
            text=f"YAML\n{self.destination}",
            foreground="#8f877c",
            wraplength=300,
        ).pack(anchor="w", side="bottom", pady=(30, 0))

    def _set_mode(self, mode: str) -> None:
        self.mode = mode
        self._redraw()

    def _begin_drag(self, event: tk.Event[tk.Misc]) -> None:
        self.drag_origin = self._clamped(event.x, event.y)
        x, y = self.drag_origin
        self.drag_item = self.canvas.create_rectangle(
            x, y, x, y, outline=COLORS[self.mode], width=3, dash=(5, 3), tags=("transient",)
        )

    def _drag(self, event: tk.Event[tk.Misc]) -> None:
        if self.drag_origin is None or self.drag_item is None:
            return
        x, y = self._clamped(event.x, event.y)
        self.canvas.coords(self.drag_item, *self.drag_origin, x, y)

    def _end_drag(self, event: tk.Event[tk.Misc]) -> None:
        if self.drag_origin is None:
            return
        end = self._clamped(event.x, event.y)
        x0, x1 = sorted((self.drag_origin[0], end[0]))
        y0, y1 = sorted((self.drag_origin[1], end[1]))
        self.drag_origin = None
        self.canvas.delete("transient")
        self.drag_item = None
        if x1 - x0 < 4 or y1 - y0 < 4:
            return
        region = Rectangle(
            x=x0 / self.preview.width,
            y=y0 / self.preview.height,
            width=(x1 - x0) / self.preview.width,
            height=(y1 - y0) / self.preview.height,
        )
        if self.mode == "target":
            self.selection = suggest_regions(self.linear_rgb, region)
            self.mode = "local_background"
        else:
            self.selection = self.selection.with_region(self.mode, region)
        self._redraw()

    def _redraw(self) -> None:
        self.canvas.delete("region")
        for name in REGIONS:
            region = getattr(self.selection, name)
            if region is None:
                continue
            x0 = round(region.x * self.preview.width)
            y0 = round(region.y * self.preview.height)
            x1 = round((region.x + region.width) * self.preview.width)
            y1 = round((region.y + region.height) * self.preview.height)
            width = 4 if name == self.mode else 2
            self.canvas.create_rectangle(
                x0, y0, x1, y1, outline=COLORS[name], width=width, tags=("region",)
            )
            self.canvas.create_text(
                x0 + 7,
                y0 + 7,
                text=LABELS[name],
                anchor="nw",
                fill=COLORS[name],
                font=("TkDefaultFont", 11, "bold"),
                tags=("region",),
            )
        present = sum(getattr(self.selection, name) is not None for name in REGIONS)
        self.status.configure(text=f"Editing: {LABELS[self.mode]}\n{present} of 3 regions ready")

    def _clear_selected(self) -> None:
        self.selection = Selection(
            **{
                name: None if name == self.mode else getattr(self.selection, name)
                for name in REGIONS
            }
        )
        self._redraw()

    def _save(self) -> None:
        try:
            config = self.selection.config(scene_id=self.image_path.stem)
            save_roi_config(config, self.destination)
        except (OSError, ValueError) as error:
            messagebox.showerror("Cannot save regions", str(error), parent=self.root)
            return
        self.saved_path = self.destination
        self.root.destroy()

    def _cancel(self) -> None:
        self.root.destroy()

    def _clamped(self, x: int, y: int) -> tuple[int, int]:
        return min(max(x, 0), self.preview.width), min(max(y, 0), self.preview.height)
