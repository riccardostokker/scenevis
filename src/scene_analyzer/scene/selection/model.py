from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np

from scene_analyzer.scene.model import FloatImage
from scene_analyzer.scene.roi import Rectangle, Regions, RoiConfig


@dataclass(frozen=True, slots=True)
class Selection:
    """The editable rectangle selection shown by the desktop UI."""

    target: Rectangle | None = None
    local_background: Rectangle | None = None
    bright_background: Rectangle | None = None

    def with_region(self, name: str, region: Rectangle) -> Selection:
        if name == "target":
            return Selection(
                target=region,
                local_background=self.local_background,
                bright_background=self.bright_background,
            )
        if name == "local_background":
            return Selection(
                target=self.target,
                local_background=region,
                bright_background=self.bright_background,
            )
        if name == "bright_background":
            return Selection(
                target=self.target,
                local_background=self.local_background,
                bright_background=region,
            )
        raise ValueError(f"unknown region: {name}")

    def config(self, *, scene_id: str) -> RoiConfig:
        if self.target is None or self.local_background is None or self.bright_background is None:
            raise ValueError("target, local background, and bright background are required")
        return RoiConfig(
            scene_id=scene_id,
            regions=Regions(
                target=self.target,
                local_background=self.local_background,
                bright_background=self.bright_background,
            ),
        )


def default_output_path(image_path: Path) -> Path:
    """Return the sidecar path used when the CLI receives no output override."""

    return image_path.with_name(f"{image_path.stem}.rois.yaml")


def suggest_regions(linear_rgb: FloatImage, target: Rectangle) -> Selection:
    """Suggest context and highlight rectangles after the user identifies the target."""

    local = _expanded(target, factor=2.5)
    bright = _brightest_available(linear_rgb, excluded=local, target=target)
    return Selection(target=target, local_background=local, bright_background=bright)


def _expanded(region: Rectangle, *, factor: float) -> Rectangle:
    width = min(1.0, region.width * factor)
    height = min(1.0, region.height * factor)
    center_x = region.x + region.width / 2
    center_y = region.y + region.height / 2
    return Rectangle(
        x=min(max(0.0, center_x - width / 2), 1.0 - width),
        y=min(max(0.0, center_y - height / 2), 1.0 - height),
        width=width,
        height=height,
    )


def _brightest_available(
    linear_rgb: FloatImage, *, excluded: Rectangle, target: Rectangle
) -> Rectangle:
    height, width, _ = linear_rgb.shape
    luminance = linear_rgb @ np.asarray([0.2126, 0.7152, 0.0722], dtype=np.float32)
    region_width = min(0.25, max(0.08, target.width))
    region_height = min(0.25, max(0.08, target.height))
    pixel_width = max(1, round(region_width * width))
    pixel_height = max(1, round(region_height * height))
    x_positions = np.unique(np.linspace(0, width - pixel_width, 31, dtype=np.int64))
    y_positions = np.unique(np.linspace(0, height - pixel_height, 31, dtype=np.int64))

    best: tuple[float, int, int] | None = None
    fallback: tuple[float, int, int] | None = None
    for y in y_positions:
        for x in x_positions:
            score = float(np.mean(luminance[y : y + pixel_height, x : x + pixel_width]))
            candidate = Rectangle(
                x=float(x / width),
                y=float(y / height),
                width=float(pixel_width / width),
                height=float(pixel_height / height),
            )
            item = (score, int(x), int(y))
            if fallback is None or item[0] > fallback[0]:
                fallback = item
            if not _overlaps(candidate, excluded) and (best is None or item[0] > best[0]):
                best = item

    _, x, y = best or fallback or (0.0, 0, 0)
    return Rectangle(
        x=x / width,
        y=y / height,
        width=pixel_width / width,
        height=pixel_height / height,
    )


def _overlaps(left: Rectangle, right: Rectangle) -> bool:
    return not (
        left.x + left.width <= right.x
        or right.x + right.width <= left.x
        or left.y + left.height <= right.y
        or right.y + right.height <= left.y
    )
