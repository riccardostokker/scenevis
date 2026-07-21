from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from scenevis.scene.model import MetadataValue, Processing


class Options(BaseModel):
    """Numerical policy for a repeatable analysis run."""

    model_config = ConfigDict(frozen=True)

    epsilon: float = Field(default=1e-9, gt=0.0)
    clipping_threshold: float = Field(default=0.99, gt=0.0, le=1.0)
    severe_clipping_threshold: float = Field(default=0.999, gt=0.0, le=1.0)
    shadow_threshold: float = Field(default=0.01, gt=0.0, le=1.0)
    clipping_warning_fraction: float = Field(default=0.01, ge=0.0, le=1.0)
    shadow_warning_fraction: float = Field(default=0.5, ge=0.0, le=1.0)
    minimum_region_pixels: int = Field(default=100, ge=1)
    overlap_warning_fraction: float = Field(default=0.25, ge=0.0, le=1.0)
    nonuniform_cv_threshold: float = Field(default=1.0, gt=0.0)


class RegionStatistics(BaseModel):
    """Robust and conventional statistics for one region."""

    model_config = ConfigDict(frozen=True)

    pixel_count: int
    mean: float
    median: float
    minimum: float
    maximum: float
    standard_deviation: float
    robust_sigma: float
    percentile_1: float
    percentile_5: float
    percentile_25: float
    percentile_75: float
    percentile_95: float
    percentile_99: float
    interquartile_range: float
    percentile_5_to_95_range: float
    coefficient_of_variation: float | None


class Metrics(BaseModel):
    """Primary transparent scene-visibility KPIs."""

    model_config = ConfigDict(frozen=True)

    dr_target_median_stops: float
    dr_local_median_stops: float
    dr_target_p95_to_p50_stops: float
    dr_target_p99_to_p50_stops: float
    weber_contrast_signed: float
    weber_contrast_absolute: float
    michelson_contrast: float
    cnr_robust: float
    cnr_standard: float
    snr_target_robust: float
    snr_target_standard: float
    target_below_0_1_percent: float
    target_below_0_25_percent: float
    target_below_0_5_percent: float
    target_below_1_percent: float
    target_below_2_percent: float
    target_below_shadow_threshold: float
    bright_clipped_99_percent: float
    bright_clipped_99_9_percent: float
    bright_red_clipped_99_percent: float
    bright_green_clipped_99_percent: float
    bright_blue_clipped_99_percent: float
    target_clipped_99_percent: float
    image_clipped_99_percent: float


class Result(BaseModel):
    """Versioned, serializable result for one analyzed scene."""

    model_config = ConfigDict(frozen=True)

    version: int = 1
    scene_id: str
    image: str
    metadata: dict[str, MetadataValue]
    processing: Processing
    region_statistics: dict[str, RegionStatistics]
    metrics: Metrics
    warnings: list[str]
    preview_notice: str = (
        "Preview brightness has been adjusted. Metrics were calculated from linear source data."
    )
