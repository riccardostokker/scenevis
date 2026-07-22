from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from scenevis.scene.model import ImageMetadata, Processing


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
    quality_max_dimension: int = Field(default=1600, ge=256)
    focus_map_columns: int = Field(default=12, ge=2, le=32)
    focus_map_rows: int = Field(default=8, ge=2, le=32)
    focus_relative_threshold: float = Field(default=0.5, gt=0.0, le=1.0)


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


class QualityMetrics(BaseModel):
    """Transparent capture-quality measurements derived from linear source samples."""

    model_config = ConfigDict(frozen=True)

    target_sharpness: float
    target_edge_acutance: float | None
    target_edge_width_px: float | None
    target_in_focus_coverage: float | None
    target_sharpness_consistency: float | None
    directional_blur_anisotropy: float | None
    directional_blur_angle_degrees: float | None
    luminance_noise: float | None
    chroma_noise: float | None
    detail_to_noise_ratio: float | None
    jpeg_blockiness: float | None
    ringing_halo_strength: float | None
    banding_fraction: float | None
    channel_saturation_clipping: float
    center_to_corner_falloff: float | None


class FocusTile(BaseModel):
    """One normalized target tile in the local sharpness map."""

    model_config = ConfigDict(frozen=True)

    x: float = Field(ge=0.0, le=1.0)
    y: float = Field(ge=0.0, le=1.0)
    width: float = Field(gt=0.0, le=1.0)
    height: float = Field(gt=0.0, le=1.0)
    sharpness: float = Field(ge=0.0)
    relative_sharpness: float = Field(ge=0.0, le=1.0)
    in_focus: bool


class QualityAnalysis(BaseModel):
    """Quality KPIs and bounded diagnostics calculated at a reproducible scale."""

    model_config = ConfigDict(frozen=True)

    analysis_width_px: int = Field(ge=1)
    analysis_height_px: int = Field(ge=1)
    focus_relative_threshold: float = Field(gt=0.0, le=1.0)
    metrics: QualityMetrics
    focus_map: list[FocusTile]
    warnings: list[str]


class Result(BaseModel):
    """Versioned, serializable result for one analyzed scene."""

    model_config = ConfigDict(frozen=True)

    version: int = 3
    scene_id: str
    image: str
    metadata: ImageMetadata
    processing: Processing
    region_statistics: dict[str, RegionStatistics]
    metrics: Metrics
    quality: QualityAnalysis
    warnings: list[str]
    preview_notice: str = (
        "Preview brightness has been adjusted. Metrics were calculated from linear source data."
    )
