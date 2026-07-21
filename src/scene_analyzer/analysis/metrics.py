from __future__ import annotations

import math

import numpy as np
from numpy.typing import NDArray

from scene_analyzer.analysis.model import Metrics, Options, RoiStatistics


def statistics(values: NDArray[np.float32], *, epsilon: float) -> RoiStatistics:
    """Calculate robust and conventional statistics for a non-empty region."""

    flattened = np.asarray(values, dtype=np.float64).reshape(-1)
    if flattened.size == 0:
        raise ValueError("cannot calculate statistics for an empty region")
    percentiles = np.percentile(flattened, [1, 5, 25, 50, 75, 95, 99])
    mean = float(np.mean(flattened))
    median = float(percentiles[3])
    standard_deviation = float(np.std(flattened))
    robust_sigma = float(1.4826 * np.median(np.abs(flattened - median)))
    coefficient = float(standard_deviation / mean) if abs(mean) > epsilon else None
    return RoiStatistics(
        pixel_count=int(flattened.size),
        mean=mean,
        median=median,
        minimum=float(np.min(flattened)),
        maximum=float(np.max(flattened)),
        standard_deviation=standard_deviation,
        robust_sigma=robust_sigma,
        percentile_1=float(percentiles[0]),
        percentile_5=float(percentiles[1]),
        percentile_25=float(percentiles[2]),
        percentile_75=float(percentiles[4]),
        percentile_95=float(percentiles[5]),
        percentile_99=float(percentiles[6]),
        interquartile_range=float(percentiles[4] - percentiles[2]),
        percentile_5_to_95_range=float(percentiles[5] - percentiles[1]),
        coefficient_of_variation=coefficient,
    )


def stops(bright: float, dark: float, *, epsilon: float) -> float:
    """Return the base-two brightness ratio in photographic stops."""

    return math.log2(max(bright, epsilon) / max(dark, epsilon))


def weber(target: float, local: float, *, epsilon: float) -> float:
    """Return signed Weber contrast."""

    return (target - local) / max(abs(local), epsilon)


def michelson(target: float, local: float, *, epsilon: float) -> float:
    """Return signed Michelson contrast."""

    return (target - local) / max(abs(target + local), epsilon)


def contrast_to_noise(
    target: RoiStatistics, local: RoiStatistics, *, robust: bool, epsilon: float
) -> float:
    """Return target separation normalized by combined region noise."""

    target_sigma = target.robust_sigma if robust else target.standard_deviation
    local_sigma = local.robust_sigma if robust else local.standard_deviation
    denominator = math.sqrt(target_sigma**2 + local_sigma**2)
    return abs(target.median - local.median) / max(denominator, epsilon)


def signal_to_noise(stats: RoiStatistics, *, robust: bool, epsilon: float) -> float:
    """Return median region signal normalized by its noise estimate."""

    sigma = stats.robust_sigma if robust else stats.standard_deviation
    return stats.median / max(sigma, epsilon)


def fraction_below(values: NDArray[np.float32], threshold: float) -> float:
    """Return the fraction of values strictly below a normalized threshold."""

    return float(np.mean(values < threshold))


def fraction_clipped(values: NDArray[np.float32], threshold: float) -> float:
    """Return the fraction of values at or above a normalized threshold."""

    return float(np.mean(values >= threshold))


def primary_metrics(
    *,
    image_luminance: NDArray[np.float32],
    target_luminance: NDArray[np.float32],
    local_luminance: NDArray[np.float32],
    bright_luminance: NDArray[np.float32],
    bright_rgb: NDArray[np.float32],
    target: RoiStatistics,
    local: RoiStatistics,
    bright: RoiStatistics,
    options: Options,
) -> Metrics:
    """Calculate the documented primary KPI set from linear region values."""

    weber_signed = weber(target.median, local.median, epsilon=options.epsilon)
    return Metrics(
        dr_target_median_stops=stops(bright.median, target.median, epsilon=options.epsilon),
        dr_local_median_stops=stops(bright.median, local.median, epsilon=options.epsilon),
        dr_target_p95_to_p50_stops=stops(
            bright.percentile_95, target.median, epsilon=options.epsilon
        ),
        dr_target_p99_to_p50_stops=stops(
            bright.percentile_99, target.median, epsilon=options.epsilon
        ),
        weber_contrast_signed=weber_signed,
        weber_contrast_absolute=abs(weber_signed),
        michelson_contrast=michelson(target.median, local.median, epsilon=options.epsilon),
        cnr_robust=contrast_to_noise(target, local, robust=True, epsilon=options.epsilon),
        cnr_standard=contrast_to_noise(target, local, robust=False, epsilon=options.epsilon),
        snr_target_robust=signal_to_noise(target, robust=True, epsilon=options.epsilon),
        snr_target_standard=signal_to_noise(target, robust=False, epsilon=options.epsilon),
        target_below_0_1_percent=fraction_below(target_luminance, 0.001),
        target_below_0_25_percent=fraction_below(target_luminance, 0.0025),
        target_below_0_5_percent=fraction_below(target_luminance, 0.005),
        target_below_1_percent=fraction_below(target_luminance, 0.01),
        target_below_2_percent=fraction_below(target_luminance, 0.02),
        target_below_shadow_threshold=fraction_below(target_luminance, options.shadow_threshold),
        bright_clipped_99_percent=fraction_clipped(bright_luminance, options.clipping_threshold),
        bright_clipped_99_9_percent=fraction_clipped(
            bright_luminance, options.severe_clipping_threshold
        ),
        bright_red_clipped_99_percent=fraction_clipped(
            bright_rgb[:, 0], options.clipping_threshold
        ),
        bright_green_clipped_99_percent=fraction_clipped(
            bright_rgb[:, 1], options.clipping_threshold
        ),
        bright_blue_clipped_99_percent=fraction_clipped(
            bright_rgb[:, 2], options.clipping_threshold
        ),
        target_clipped_99_percent=fraction_clipped(target_luminance, options.clipping_threshold),
        image_clipped_99_percent=fraction_clipped(image_luminance, options.clipping_threshold),
    )
