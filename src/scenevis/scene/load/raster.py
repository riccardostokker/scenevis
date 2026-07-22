from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

from scenevis.scene.metadata import read as read_metadata
from scenevis.scene.model import Loaded, Processing


def load(path: Path) -> Loaded:
    """Load an ordinary raster and approximately linearize its sRGB values."""

    with Image.open(path) as source:
        preview = ImageOps.exif_transpose(source).convert("RGB")

    encoded = np.asarray(preview, dtype=np.float32) / np.float32(255.0)
    linear = _inverse_srgb(encoded)
    metadata = read_metadata(path, width_px=preview.width, height_px=preview.height)
    processing = Processing(
        source="raster",
        linear=True,
        profile="raster-srgb-v1",
        white_balance_policy="embedded rendering",
        settings={
            "inverse_transfer": "sRGB",
            "auto_brightness": False,
            "highlight_recovery": False,
        },
    )
    return Loaded(linear_rgb=linear, preview=preview, processing=processing, metadata=metadata)


def _inverse_srgb(encoded: np.ndarray) -> np.ndarray:
    return np.where(
        encoded <= 0.04045,
        encoded / 12.92,
        np.power((encoded + 0.055) / 1.055, 2.4),
    ).astype(np.float32)
