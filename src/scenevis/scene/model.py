from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from pydantic import BaseModel, ConfigDict

type FloatImage = NDArray[np.float32]
type BoolMask = NDArray[np.bool_]
type SettingValue = str | int | float | bool | list[int] | list[float] | None
type MetadataGroup = Literal["file", "image", "exif", "gps", "camera", "thumbnail", "xmp", "other"]


class CaptureMetadata(BaseModel):
    """Normalized photographic context used to compare scene captures."""

    model_config = ConfigDict(frozen=True)

    file_format: str
    file_size_bytes: int
    width_px: int
    height_px: int
    camera_make: str | None = None
    camera_model: str | None = None
    lens: str | None = None
    aperture_f_number: float | None = None
    exposure_time_seconds: float | None = None
    iso: int | None = None
    focal_length_mm: float | None = None
    focal_length_35mm_mm: float | None = None
    exposure_compensation_ev: float | None = None
    exposure_value_ev100: float | None = None
    metering_mode: str | None = None
    white_balance: str | None = None
    captured_at: str | None = None
    orientation: str | None = None
    color_space: str | None = None


class MetadataEntry(BaseModel):
    """One bounded, display-safe metadata entry from the source image."""

    model_config = ConfigDict(frozen=True)

    key: str
    label: str
    group: MetadataGroup
    value: str
    sensitive: bool = False
    truncated: bool = False


class ImageMetadata(BaseModel):
    """Normalized comparison fields plus namespaced source metadata."""

    model_config = ConfigDict(frozen=True)

    version: Literal[1] = 1
    summary: CaptureMetadata
    entries: list[MetadataEntry]
    entries_truncated: bool = False


class Processing(BaseModel):
    """Reproducible processing choices applied before measurement."""

    model_config = ConfigDict(frozen=True)

    source: Literal["raw", "raster"]
    linear: bool
    profile: str
    white_balance_policy: str
    settings: dict[str, SettingValue]
    black_level_per_channel: list[int] | None = None
    white_level: int | None = None


@dataclass(frozen=True, slots=True)
class Loaded:
    """A loaded scene with measurement data and a display-only preview."""

    linear_rgb: FloatImage
    preview: Image.Image
    processing: Processing
    metadata: ImageMetadata
