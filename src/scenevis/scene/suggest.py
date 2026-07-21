from __future__ import annotations

import numpy as np
from PIL import Image

from scenevis.scene.regions import Rectangle


def bright_background(preview: Image.Image) -> Rectangle:
    """Suggest a compact bright region from a display preview."""

    reduced = preview.convert("L").copy()
    reduced.thumbnail((240, 160), Image.Resampling.BILINEAR)
    values = np.asarray(reduced, dtype=np.float32)
    height, width = values.shape
    region_width = max(1, round(width * 0.15))
    region_height = max(1, round(height * 0.15))
    integral = np.pad(values, ((1, 0), (1, 0))).cumsum(axis=0).cumsum(axis=1)
    sums = (
        integral[region_height:, region_width:]
        - integral[:-region_height, region_width:]
        - integral[region_height:, :-region_width]
        + integral[:-region_height, :-region_width]
    )
    y, x = np.unravel_index(int(np.argmax(sums)), sums.shape)
    return Rectangle(
        x=float(x / width),
        y=float(y / height),
        width=float(region_width / width),
        height=float(region_height / height),
    )
