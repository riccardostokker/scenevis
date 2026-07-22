from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

from scenevis.analysis.model import Result
from scenevis.scene.model import ImageMetadata, Processing
from scenevis.scene.regions import Rectangle, Regions


class Health(BaseModel):
    """Service readiness response."""

    model_config = ConfigDict(frozen=True)

    status: Literal["ok"] = "ok"


class Problem(BaseModel):
    """Stable caller-facing error envelope."""

    model_config = ConfigDict(frozen=True)

    code: str
    message: str


class Preview(BaseModel):
    """Compressed display preview and source information."""

    model_config = ConfigDict(frozen=True)

    version: Literal[2] = 2
    image: str
    width_px: int
    height_px: int
    preview_data_url: str
    bright_background_suggestion: Rectangle
    metadata: ImageMetadata
    processing: Processing


class Analysis(BaseModel):
    """Analysis result paired with the validated regions that produced it."""

    model_config = ConfigDict(frozen=True)

    result: Result
    regions: Regions
