from __future__ import annotations

from pathlib import Path

import numpy as np
import rawpy
from PIL import Image

from scene_analyzer.scene.model import Loaded, MetadataValue, Processing


def load(path: Path) -> Loaded:
    """Load RAW data with a fixed linear, no-auto-bright processing profile."""

    with rawpy.imread(str(path)) as raw:
        rgb = raw.postprocess(
            gamma=(1.0, 1.0),
            no_auto_bright=True,
            output_bps=16,
            use_camera_wb=True,
            use_auto_wb=False,
            highlight_mode=rawpy.HighlightMode.Clip,
            fbdd_noise_reduction=rawpy.FBDDNoiseReductionMode.Off,
            median_filter_passes=0,
            output_color=rawpy.ColorSpace.sRGB,
        )
        linear = (rgb.astype(np.float32) / np.float32(65535.0)).astype(np.float32)
        preview = _preview(linear)
        black_levels = [int(value) for value in raw.black_level_per_channel]
        white_level = int(raw.white_level)
        white_balance = [float(value) for value in (raw.auto_whitebalance or [])]
        metadata = _metadata(raw, path=path, width=rgb.shape[1], height=rgb.shape[0])

    processing = Processing(
        source="raw",
        linear=True,
        profile="raw-linear-v1",
        white_balance_policy="camera as-shot white balance",
        settings={
            "gamma": [1.0, 1.0],
            "no_auto_bright": True,
            "output_bits": 16,
            "highlight_mode": "clip",
            "noise_reduction": "off",
            "output_color": "sRGB primaries",
            "applied_white_balance": white_balance,
        },
        black_level_per_channel=black_levels,
        white_level=white_level,
    )
    return Loaded(linear_rgb=linear, preview=preview, processing=processing, metadata=metadata)


def _preview(linear: np.ndarray) -> Image.Image:
    luminance = linear @ np.asarray([0.2126, 0.7152, 0.0722], dtype=np.float32)
    scale = max(float(np.percentile(luminance, 99.0)), 1e-6)
    display = np.clip(linear / scale, 0.0, 1.0)
    encoded = np.where(
        display <= 0.0031308,
        12.92 * display,
        1.055 * np.power(display, 1 / 2.4) - 0.055,
    )
    return Image.fromarray(np.asarray(np.rint(encoded * 255.0), dtype=np.uint8), mode="RGB")


def _metadata(raw: rawpy.RawPy, *, path: Path, width: int, height: int) -> dict[str, MetadataValue]:
    other = raw.other
    lens = raw.lens
    return {
        "file_type": path.suffix.lower().removeprefix("."),
        "width_px": width,
        "height_px": height,
        "iso": _number(other.iso_speed),
        "exposure_time_s": _number(other.shutter_speed),
        "aperture": _number(other.aperture),
        "focal_length_mm": _number(other.focal_length),
        "captured_at": str(other.timestamp) if other.timestamp is not None else None,
        "lens": str(lens) if lens is not None else None,
    }


def _number(value: object) -> float | None:
    return float(value) if isinstance(value, int | float) else None
