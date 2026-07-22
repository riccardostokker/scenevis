from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path

import numpy as np

from scenevis.analysis.metrics import primary_metrics, statistics
from scenevis.analysis.model import Metrics, Options, RegionStatistics, Result
from scenevis.analysis.quality import analyze_quality
from scenevis.error import ScenevisError
from scenevis.scene.load import load
from scenevis.scene.model import BoolMask, ImageMetadata, Loaded
from scenevis.scene.regions import Regions, masks, overlap_fraction


def analyze_scene(*, image_path: Path, regions: Regions, options: Options | None = None) -> Result:
    """Analyze one image against three in-memory regions."""

    return analyze_loaded(
        loaded=load(image_path),
        image_name=image_path.name,
        scene_id=image_path.stem,
        regions=regions,
        options=options,
    )


def analyze_loaded(
    *,
    loaded: Loaded,
    image_name: str,
    scene_id: str,
    regions: Regions,
    options: Options | None = None,
) -> Result:
    """Analyze an already decoded image without retaining or writing source state."""

    policy = options or Options()
    height, width, channels = loaded.linear_rgb.shape
    if channels != 3:
        raise ScenevisError(f"expected RGB image data, received shape {loaded.linear_rgb.shape}")

    luminance = np.asarray(
        loaded.linear_rgb @ np.asarray([0.2126, 0.7152, 0.0722], dtype=np.float32),
        dtype=np.float32,
    )
    region_masks: dict[str, BoolMask] = {
        str(name): region_mask
        for name, region_mask in masks(regions, width=width, height=height).items()
    }
    values = {name: luminance[region_mask] for name, region_mask in region_masks.items()}
    empty = [name for name, region_values in values.items() if region_values.size == 0]
    if empty:
        raise ScenevisError(f"region contains no pixels after rasterization: {', '.join(empty)}")

    region_statistics: dict[str, RegionStatistics] = {
        str(name): statistics(region_values, epsilon=policy.epsilon)
        for name, region_values in values.items()
    }
    target = region_statistics["target"]
    local = region_statistics["local_background"]
    bright = region_statistics["bright_background"]
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
    quality = analyze_quality(
        linear_rgb=loaded.linear_rgb,
        source_luminance=luminance,
        regions=regions,
        file_format=loaded.metadata.summary.file_format,
        options=policy,
    )
    warnings = _warnings(
        image_name=image_name,
        regions=regions,
        width=width,
        height=height,
        stats=region_statistics,
        metrics=metrics,
        processing_source=loaded.processing.source,
        metadata=loaded.metadata,
        options=policy,
    )
    result = Result(
        scene_id=scene_id,
        image=image_name,
        metadata=loaded.metadata,
        processing=loaded.processing,
        region_statistics=region_statistics,
        metrics=metrics,
        quality=quality,
        warnings=warnings,
    )
    return result


def _warnings(
    *,
    image_name: str,
    regions: Regions,
    width: int,
    height: int,
    stats: Mapping[str, RegionStatistics],
    metrics: Metrics,
    processing_source: str,
    metadata: ImageMetadata,
    options: Options,
) -> list[str]:
    warnings: list[str] = []
    for name, region in stats.items():
        if region.pixel_count < options.minimum_region_pixels:
            warnings.append(f"{name} region contains only {region.pixel_count} pixels")
        coefficient = region.coefficient_of_variation
        if coefficient is not None and coefficient > options.nonuniform_cv_threshold:
            warnings.append(f"{name} region is spatially nonuniform")

    if metrics.bright_clipped_99_percent > options.clipping_warning_fraction:
        warnings.append(
            "Bright-background region is significantly clipped; dynamic range is unreliable"
        )
    if metrics.target_below_shadow_threshold > options.shadow_warning_fraction:
        warnings.append("Target region is close to the image noise floor")
    if metrics.target_clipped_99_percent > options.clipping_warning_fraction:
        warnings.append("Target region contains substantial saturated reflections")
    if (
        max(
            metrics.bright_red_clipped_99_percent,
            metrics.bright_green_clipped_99_percent,
            metrics.bright_blue_clipped_99_percent,
        )
        > options.clipping_warning_fraction
    ):
        warnings.append("One or more bright-background color channels are clipped")
    overlap = overlap_fraction(regions, width=width, height=height)
    if overlap > options.overlap_warning_fraction:
        warnings.append(
            f"Target overlaps {overlap:.1%} of authored local background; "
            "target pixels were excluded"
        )
    if processing_source != "raw":
        input_type = Path(image_name).suffix.lower().removeprefix(".").upper()
        warnings.append(f"{input_type} is rendered input; RAW is preferred")
    if metadata.summary.exposure_time_seconds is None or metadata.summary.iso is None:
        warnings.append("Exposure metadata is incomplete")
    return warnings
