from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from pydantic import BaseModel, ConfigDict

type FloatImage = NDArray[np.float32]
type BoolMask = NDArray[np.bool_]
type MetadataValue = str | int | float | bool | None
type SettingValue = str | int | float | bool | list[int] | list[float] | None


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
    metadata: dict[str, MetadataValue]
