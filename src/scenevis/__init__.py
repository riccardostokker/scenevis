"""Repeatable scene-visibility analysis from linear image data."""

from scenevis.analysis import Metrics, Options, RegionStatistics, Result, analyze_scene
from scenevis.scene import Polygon, Rectangle, Regions

__version__ = "0.1.0"

__all__ = [
    "Metrics",
    "Options",
    "Polygon",
    "Rectangle",
    "RegionStatistics",
    "Regions",
    "Result",
    "analyze_scene",
]
