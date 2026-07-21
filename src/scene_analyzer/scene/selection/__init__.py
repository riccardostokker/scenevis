"""Interactive authoring of scene regions."""

from pathlib import Path

from scene_analyzer.scene.selection.model import (
    Selection,
    default_output_path,
    suggest_regions,
)


def select_rois(
    image_path: Path, *, output_path: Path | None = None, overwrite: bool = False
) -> Path | None:
    """Open the ROI selector without importing Tkinter during normal analysis."""

    from scene_analyzer.scene.selection.view import select_rois as open_selector

    return open_selector(image_path, output_path=output_path, overwrite=overwrite)


__all__ = ["Selection", "default_output_path", "select_rois", "suggest_regions"]
