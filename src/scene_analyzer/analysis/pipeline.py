from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

from scene_analyzer.analysis.metrics import primary_metrics, statistics
from scene_analyzer.analysis.model import Metrics, Options, Result, RoiStatistics
from scene_analyzer.error import SceneAnalyzerError
from scene_analyzer.scene.load import load
from scene_analyzer.scene.model import BoolMask
from scene_analyzer.scene.roi import RoiConfig, masks, overlap_fraction


@dataclass(frozen=True, slots=True)
class Artifacts:
    result: Result
    preview: Image.Image
    masks: Mapping[str, BoolMask]


def analyze_scene(
    *, image_path: Path, roi_config: RoiConfig, options: Options | None = None
) -> Result:
    """Analyze one image against three authored regions."""

    return analyze_with_artifacts(
        image_path=image_path, roi_config=roi_config, options=options
    ).result


def analyze_with_artifacts(
    *, image_path: Path, roi_config: RoiConfig, options: Options | None = None
) -> Artifacts:
    policy = options or Options()
    loaded = load(image_path)
    height, width, channels = loaded.linear_rgb.shape
    if channels != 3:
        raise SceneAnalyzerError(
            f"expected RGB image data, received shape {loaded.linear_rgb.shape}"
        )

    luminance = np.asarray(
        loaded.linear_rgb @ np.asarray([0.2126, 0.7152, 0.0722], dtype=np.float32),
        dtype=np.float32,
    )
    region_masks: dict[str, BoolMask] = {
        str(name): region_mask
        for name, region_mask in masks(roi_config, width=width, height=height).items()
    }
    values = {name: luminance[region_mask] for name, region_mask in region_masks.items()}
    empty = [name for name, region_values in values.items() if region_values.size == 0]
    if empty:
        raise SceneAnalyzerError(f"ROI contains no pixels after rasterization: {', '.join(empty)}")

    roi_statistics: dict[str, RoiStatistics] = {
        str(name): statistics(region_values, epsilon=policy.epsilon)
        for name, region_values in values.items()
    }
    target = roi_statistics["target"]
    local = roi_statistics["local_background"]
    bright = roi_statistics["bright_background"]
    metrics = primary_metrics(
        image_luminance=luminance,
        target_luminance=values["target"],
        local_luminance=values["local_background"],
        bright_luminance=values["bright_background"],
        bright_rgb=loaded.linear_rgb[region_masks["bright_background"]],
        target=target,
        local=local,
        bright=bright,
        options=policy,
    )
    warnings = _warnings(
        image_path=image_path,
        roi_config=roi_config,
        width=width,
        height=height,
        stats=roi_statistics,
        metrics=metrics,
        processing_source=loaded.processing.source,
        metadata=loaded.metadata,
        options=policy,
    )
    result = Result(
        scene_id=roi_config.scene_id,
        image=image_path.name,
        metadata=loaded.metadata,
        processing=loaded.processing,
        roi_statistics=roi_statistics,
        metrics=metrics,
        warnings=warnings,
    )
    return Artifacts(result=result, preview=loaded.preview, masks=region_masks)


def _warnings(
    *,
    image_path: Path,
    roi_config: RoiConfig,
    width: int,
    height: int,
    stats: Mapping[str, RoiStatistics],
    metrics: Metrics,
    processing_source: str,
    metadata: Mapping[str, object],
    options: Options,
) -> list[str]:
    warnings: list[str] = []
    for name, region in stats.items():
        if region.pixel_count < options.minimum_roi_pixels:
            warnings.append(f"{name} ROI contains only {region.pixel_count} pixels")
        coefficient = region.coefficient_of_variation
        if coefficient is not None and coefficient > options.nonuniform_cv_threshold:
            warnings.append(f"{name} ROI is spatially nonuniform")

    if metrics.bright_clipped_99_percent > options.clipping_warning_fraction:
        warnings.append(
            "Bright-background ROI is significantly clipped; dynamic range is unreliable"
        )
    if metrics.target_below_shadow_threshold > options.shadow_warning_fraction:
        warnings.append("Target ROI is close to the image noise floor")
    if metrics.target_clipped_99_percent > options.clipping_warning_fraction:
        warnings.append("Target ROI contains substantial saturated reflections")
    if (
        max(
            metrics.bright_red_clipped_99_percent,
            metrics.bright_green_clipped_99_percent,
            metrics.bright_blue_clipped_99_percent,
        )
        > options.clipping_warning_fraction
    ):
        warnings.append("One or more bright-background color channels are clipped")
    overlap = overlap_fraction(roi_config, width=width, height=height)
    if overlap > options.overlap_warning_fraction:
        warnings.append(
            f"Target overlaps {overlap:.1%} of authored local background; "
            "target pixels were excluded"
        )
    if processing_source != "raw":
        input_type = image_path.suffix.lower().removeprefix(".").upper()
        warnings.append(f"{input_type} is rendered input; RAW is preferred")
    if "exposure_time_s" not in metadata or "iso" not in metadata:
        warnings.append("Exposure metadata is incomplete")
    return warnings
