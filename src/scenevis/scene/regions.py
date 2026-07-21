from __future__ import annotations

import math
from typing import Annotated, Literal

import numpy as np
from PIL import Image, ImageDraw
from pydantic import BaseModel, ConfigDict, Field, model_validator

from scenevis.scene.model import BoolMask

UnitCoordinate = Annotated[float, Field(ge=0.0, le=1.0)]
type Point = tuple[UnitCoordinate, UnitCoordinate]
type RegionName = Literal["target", "local_background", "bright_background"]


class Rectangle(BaseModel):
    """A normalized rectangular region."""

    model_config = ConfigDict(frozen=True)

    type: Literal["rectangle"] = "rectangle"
    x: UnitCoordinate
    y: UnitCoordinate
    width: UnitCoordinate
    height: UnitCoordinate

    @model_validator(mode="after")
    def fits_image(self) -> Rectangle:
        if self.width <= 0 or self.height <= 0:
            raise ValueError("rectangle width and height must be positive")
        if self.x + self.width > 1 or self.y + self.height > 1:
            raise ValueError("rectangle must fit inside normalized image bounds")
        return self


class Polygon(BaseModel):
    """A normalized polygonal region."""

    model_config = ConfigDict(frozen=True)

    type: Literal["polygon"] = "polygon"
    points: list[Point]

    @model_validator(mode="after")
    def has_area(self) -> Polygon:
        if len(self.points) < 3:
            raise ValueError("polygon requires at least three points")
        return self


type Region = Annotated[Rectangle | Polygon, Field(discriminator="type")]


class Regions(BaseModel):
    """The three regions required for primary visibility analysis."""

    model_config = ConfigDict(frozen=True)

    target: Region
    local_background: Region
    bright_background: Region


def masks(regions: Regions, *, width: int, height: int) -> dict[RegionName, BoolMask]:
    """Rasterize configured regions and exclude target pixels from local background."""

    target = mask(regions.target, width=width, height=height)
    local = mask(regions.local_background, width=width, height=height)
    bright = mask(regions.bright_background, width=width, height=height)
    return {
        "target": target,
        "local_background": np.logical_and(local, np.logical_not(target)),
        "bright_background": bright,
    }


def overlap_fraction(regions: Regions, *, width: int, height: int) -> float:
    """Return the authored target overlap as a fraction of local-background pixels."""

    target = mask(regions.target, width=width, height=height)
    local = mask(regions.local_background, width=width, height=height)
    local_pixels = int(np.count_nonzero(local))
    if local_pixels == 0:
        return 0.0
    return float(np.count_nonzero(np.logical_and(target, local)) / local_pixels)


def vertices(region: Region, *, width: int, height: int) -> list[tuple[int, int]]:
    """Map a normalized region to display pixel vertices."""

    if isinstance(region, Rectangle):
        x0 = round(region.x * width)
        y0 = round(region.y * height)
        x1 = round((region.x + region.width) * width)
        y1 = round((region.y + region.height) * height)
        return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    return [(round(x * width), round(y * height)) for x, y in region.points]


def mask(region: Region, *, width: int, height: int) -> BoolMask:
    if isinstance(region, Rectangle):
        result = np.zeros((height, width), dtype=np.bool_)
        x0 = max(0, math.floor(region.x * width))
        y0 = max(0, math.floor(region.y * height))
        x1 = min(width, math.ceil((region.x + region.width) * width))
        y1 = min(height, math.ceil((region.y + region.height) * height))
        result[y0:y1, x0:x1] = True
        return result

    image = Image.new("1", (width, height), 0)
    draw = ImageDraw.Draw(image)
    draw.polygon(vertices(region, width=width - 1, height=height - 1), fill=1)
    return np.asarray(image, dtype=np.bool_)
