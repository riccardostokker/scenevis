"""Repeatable scene-visibility analysis from linear image data."""

from scene_analyzer.analysis import Metrics, Options, Result, RoiStatistics, analyze_scene
from scene_analyzer.scene import RoiConfig, load_roi_config

__version__ = "0.1.0"

__all__ = [
    "Metrics",
    "Options",
    "Result",
    "RoiConfig",
    "RoiStatistics",
    "analyze_scene",
    "load_roi_config",
]
