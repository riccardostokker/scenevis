from __future__ import annotations

from numbers import Real
from pathlib import Path

import numpy as np
from PIL import ExifTags, Image, ImageOps

from scenevis.scene.model import Loaded, MetadataValue, Processing


def load(path: Path) -> Loaded:
    """Load an ordinary raster and approximately linearize its sRGB values."""

    with Image.open(path) as source:
        metadata = _metadata(source)
        preview = ImageOps.exif_transpose(source).convert("RGB")

    encoded = np.asarray(preview, dtype=np.float32) / np.float32(255.0)
    linear = _inverse_srgb(encoded)
    metadata.update(
        {
            "file_type": path.suffix.lower().removeprefix("."),
            "width_px": preview.width,
            "height_px": preview.height,
        }
    )
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


def _metadata(image: Image.Image) -> dict[str, MetadataValue]:
    wanted = {
        "Model": "camera_model",
        "LensModel": "lens",
        "FocalLength": "focal_length_mm",
        "FNumber": "aperture",
        "ExposureTime": "exposure_time_s",
        "ISOSpeedRatings": "iso",
        "PhotographicSensitivity": "iso",
        "DateTimeOriginal": "captured_at",
        "ExposureBiasValue": "exposure_compensation_ev",
        "MeteringMode": "metering_mode",
        "WhiteBalance": "white_balance",
    }
    result: dict[str, MetadataValue] = {}
    for identifier, value in image.getexif().items():
        name = ExifTags.TAGS.get(identifier)
        field = wanted.get(name or "")
        if field is not None:
            result[field] = _plain(value)
    return result


def _plain(value: object) -> MetadataValue:
    if isinstance(value, str | int | float | bool) or value is None:
        return value
    if isinstance(value, Real):
        return float(value)
    return str(value)
