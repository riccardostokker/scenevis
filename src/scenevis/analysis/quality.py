from __future__ import annotations

import math

import numpy as np
from numpy.typing import NDArray
from PIL import Image

from scenevis.analysis.model import FocusTile, Options, QualityAnalysis, QualityMetrics
from scenevis.scene.model import BoolMask, FloatImage
from scenevis.scene.regions import Regions, masks

_LUMINANCE_WEIGHTS = np.asarray([0.2126, 0.7152, 0.0722], dtype=np.float32)


def analyze_quality(
    *,
    linear_rgb: FloatImage,
    source_luminance: NDArray[np.float32],
    regions: Regions,
    file_format: str,
    options: Options,
) -> QualityAnalysis:
    """Derive bounded, no-reference quality evidence from linear source samples."""

    quality_rgb = _reduced(linear_rgb, maximum=options.quality_max_dimension)
    height, width, _ = quality_rgb.shape
    quality_masks = masks(regions, width=width, height=height)
    target_mask = quality_masks["target"]
    local_mask = quality_masks["local_background"]
    luminance = np.asarray(quality_rgb @ _LUMINANCE_WEIGHTS, dtype=np.float32)
    gradient_x, gradient_y, gradient = _gradients(luminance)

    focus_map, focus_threshold = _focus_map(
        gradient=gradient,
        target_mask=target_mask,
        columns=options.focus_map_columns,
        rows=options.focus_map_rows,
        relative_threshold=options.focus_relative_threshold,
    )
    focus_scores = np.asarray([tile.sharpness for tile in focus_map], dtype=np.float64)
    target_gradient = gradient[target_mask]
    target_sharpness = _root_mean_square(target_gradient)
    edge_acutance = _percentile_or_none(target_gradient, 90.0, minimum=24)
    profiles = _edge_profiles(
        luminance=luminance,
        mask=target_mask,
        gradient_x=gradient_x,
        gradient_y=gradient_y,
        gradient=gradient,
    )
    edge_width, ringing = _profile_metrics(profiles)
    luminance_noise, chroma_noise = _noise(
        rgb=quality_rgb,
        luminance=luminance,
        gradient=gradient,
        mask=np.logical_or(target_mask, local_mask),
    )
    detail_to_noise = (
        edge_acutance / luminance_noise
        if edge_acutance is not None and luminance_noise is not None and luminance_noise > 1e-9
        else None
    )
    anisotropy, blur_angle = _directional_blur(
        gradient_x=gradient_x,
        gradient_y=gradient_y,
        gradient=gradient,
        mask=target_mask,
    )
    in_focus_coverage = (
        float(np.mean([tile.in_focus for tile in focus_map])) if len(focus_map) >= 4 else None
    )
    sharpness_consistency = _robust_coefficient(focus_scores) if focus_scores.size >= 4 else None
    jpeg_blockiness = (
        _jpeg_blockiness(source_luminance)
        if file_format.lower() in {"jpg", "jpeg", "jpe"}
        else None
    )
    banding = _banding(luminance, gradient)
    saturation = _channel_clipping(linear_rgb, threshold=options.clipping_threshold)
    falloff = _center_to_corner_falloff(luminance)

    metrics = QualityMetrics(
        target_sharpness=target_sharpness,
        target_edge_acutance=edge_acutance,
        target_edge_width_px=edge_width,
        target_in_focus_coverage=in_focus_coverage,
        target_sharpness_consistency=sharpness_consistency,
        directional_blur_anisotropy=anisotropy,
        directional_blur_angle_degrees=blur_angle,
        luminance_noise=luminance_noise,
        chroma_noise=chroma_noise,
        detail_to_noise_ratio=detail_to_noise,
        jpeg_blockiness=jpeg_blockiness,
        ringing_halo_strength=ringing,
        banding_fraction=banding,
        channel_saturation_clipping=saturation,
        center_to_corner_falloff=falloff,
    )
    return QualityAnalysis(
        analysis_width_px=width,
        analysis_height_px=height,
        focus_relative_threshold=focus_threshold,
        metrics=metrics,
        focus_map=focus_map,
        warnings=_warnings(metrics=metrics, focus_tiles=len(focus_map), profiles=len(profiles)),
    )


def _reduced(image: FloatImage, *, maximum: int) -> FloatImage:
    height, width, _ = image.shape
    scale = min(1.0, maximum / max(width, height))
    if scale >= 1.0:
        return image
    size = (max(1, round(width * scale)), max(1, round(height * scale)))
    channels = [
        np.asarray(Image.fromarray(image[:, :, index]).resize(size, Image.Resampling.BOX))
        for index in range(3)
    ]
    return np.asarray(np.stack(channels, axis=2), dtype=np.float32)


def _gradients(
    values: NDArray[np.float32],
) -> tuple[NDArray[np.float32], NDArray[np.float32], NDArray[np.float32]]:
    padded = np.pad(values, 1, mode="reflect")
    gradient_x = (
        -padded[:-2, :-2]
        + padded[:-2, 2:]
        - 2.0 * padded[1:-1, :-2]
        + 2.0 * padded[1:-1, 2:]
        - padded[2:, :-2]
        + padded[2:, 2:]
    ) / 8.0
    gradient_y = (
        -padded[:-2, :-2]
        - 2.0 * padded[:-2, 1:-1]
        - padded[:-2, 2:]
        + padded[2:, :-2]
        + 2.0 * padded[2:, 1:-1]
        + padded[2:, 2:]
    ) / 8.0
    magnitude = np.hypot(gradient_x, gradient_y)
    return (
        np.asarray(gradient_x, dtype=np.float32),
        np.asarray(gradient_y, dtype=np.float32),
        np.asarray(magnitude, dtype=np.float32),
    )


def _focus_map(
    *,
    gradient: NDArray[np.float32],
    target_mask: BoolMask,
    columns: int,
    rows: int,
    relative_threshold: float,
) -> tuple[list[FocusTile], float]:
    height, width = gradient.shape
    raw: list[tuple[int, int, int, int, float]] = []
    for row in range(rows):
        y0, y1 = round(row * height / rows), round((row + 1) * height / rows)
        for column in range(columns):
            x0, x1 = round(column * width / columns), round((column + 1) * width / columns)
            tile_mask = target_mask[y0:y1, x0:x1]
            if np.count_nonzero(tile_mask) < 16:
                continue
            score = _root_mean_square(gradient[y0:y1, x0:x1][tile_mask])
            raw.append((x0, y0, x1, y1, score))
    if not raw:
        return [], relative_threshold

    reference = max(float(np.percentile([item[4] for item in raw], 90.0)), 1e-12)
    return (
        [
            FocusTile(
                x=x0 / width,
                y=y0 / height,
                width=(x1 - x0) / width,
                height=(y1 - y0) / height,
                sharpness=score,
                relative_sharpness=min(1.0, score / reference),
                in_focus=score / reference >= relative_threshold,
            )
            for x0, y0, x1, y1, score in raw
        ],
        relative_threshold,
    )


def _edge_profiles(
    *,
    luminance: NDArray[np.float32],
    mask: BoolMask,
    gradient_x: NDArray[np.float32],
    gradient_y: NDArray[np.float32],
    gradient: NDArray[np.float32],
) -> list[NDArray[np.float64]]:
    edge_values = gradient[mask]
    if edge_values.size < 24:
        return []
    threshold = float(np.percentile(edge_values, 90.0))
    candidates = np.argwhere(np.logical_and(mask, gradient >= threshold))
    height, width = luminance.shape
    candidates = candidates[
        (candidates[:, 0] >= 5)
        & (candidates[:, 0] < height - 5)
        & (candidates[:, 1] >= 5)
        & (candidates[:, 1] < width - 5)
    ]
    if candidates.size == 0:
        return []
    if len(candidates) > 96:
        candidates = candidates[np.linspace(0, len(candidates) - 1, 96, dtype=int)]

    offsets = np.linspace(-4.0, 4.0, 17)
    profiles: list[NDArray[np.float64]] = []
    for y, x in candidates:
        magnitude = float(gradient[y, x])
        if magnitude <= 1e-12:
            continue
        normal_x = float(gradient_x[y, x]) / magnitude
        normal_y = float(gradient_y[y, x]) / magnitude
        profile = _bilinear(
            luminance,
            x=np.asarray(x + normal_x * offsets),
            y=np.asarray(y + normal_y * offsets),
        )
        start, end = float(np.median(profile[:3])), float(np.median(profile[-3:]))
        contrast = abs(end - start)
        if contrast < 0.005:
            continue
        if end < start:
            profile = profile[::-1]
            start, end = end, start
        tolerance = contrast * 0.12
        if float(np.mean(np.diff(profile) >= -tolerance)) < 0.7:
            continue
        profiles.append(profile)
    return profiles


def _profile_metrics(profiles: list[NDArray[np.float64]]) -> tuple[float | None, float | None]:
    widths: list[float] = []
    ringing: list[float] = []
    offsets = np.linspace(-4.0, 4.0, 17)
    for profile in profiles:
        low, high = float(np.median(profile[:3])), float(np.median(profile[-3:]))
        contrast = high - low
        if contrast <= 1e-12:
            continue
        low_crossing = _crossing(offsets, profile, low + 0.1 * contrast)
        high_crossing = _crossing(offsets, profile, low + 0.9 * contrast)
        if low_crossing is not None and high_crossing is not None and high_crossing > low_crossing:
            widths.append(high_crossing - low_crossing)
        overshoot = max(0.0, float(np.max(profile) - high), float(low - np.min(profile)))
        ringing.append(overshoot / contrast)
    return (
        float(np.median(widths)) if widths else None,
        float(np.median(ringing)) if ringing else None,
    )


def _noise(
    *,
    rgb: FloatImage,
    luminance: NDArray[np.float32],
    gradient: NDArray[np.float32],
    mask: BoolMask,
) -> tuple[float | None, float | None]:
    candidates = gradient[mask]
    if candidates.size < 64:
        return None, None
    smooth = np.logical_and(mask, gradient <= np.percentile(candidates, 35.0))
    if np.count_nonzero(smooth) < 64:
        return None, None

    luminance_residual = luminance - _box_blur(luminance)
    red_green = rgb[:, :, 0] - rgb[:, :, 1]
    blue_green = rgb[:, :, 2] - rgb[:, :, 1]
    chroma_residual = np.hypot(
        red_green - _box_blur(red_green),
        blue_green - _box_blur(blue_green),
    ) / math.sqrt(2.0)
    return _robust_sigma(luminance_residual[smooth]), _robust_sigma(chroma_residual[smooth])


def _directional_blur(
    *,
    gradient_x: NDArray[np.float32],
    gradient_y: NDArray[np.float32],
    gradient: NDArray[np.float32],
    mask: BoolMask,
) -> tuple[float | None, float | None]:
    values = gradient[mask]
    if values.size < 64:
        return None, None
    threshold = float(np.percentile(values, 70.0))
    edges = np.logical_and(mask, gradient >= threshold)
    if np.count_nonzero(edges) < 32:
        return None, None
    angles = np.mod(np.arctan2(gradient_y[edges], gradient_x[edges]), math.pi)
    weights = gradient[edges]
    histogram, boundaries = np.histogram(angles, bins=18, range=(0.0, math.pi), weights=weights)
    total = float(np.sum(histogram))
    if total <= 1e-12:
        return None, None
    probabilities = histogram / total
    nonzero = probabilities[probabilities > 0]
    entropy = -float(np.sum(nonzero * np.log(nonzero))) / math.log(len(histogram))
    anisotropy = min(1.0, max(0.0, 1.0 - entropy))
    weakest = int(np.argmin(histogram))
    angle = math.degrees((boundaries[weakest] + boundaries[weakest + 1]) / 2.0)
    return anisotropy, angle


def _jpeg_blockiness(luminance: NDArray[np.float32]) -> float | None:
    height, width = luminance.shape
    if height < 24 or width < 24:
        return None
    row_step = max(1, height // 1024)
    column_step = max(1, width // 1024)
    vertical = luminance[::row_step]
    horizontal = luminance[:, ::column_step]
    vertical_boundaries = np.arange(8, width, 8)
    horizontal_boundaries = np.arange(8, height, 8)
    if vertical_boundaries.size == 0 or horizontal_boundaries.size == 0:
        return None
    boundary = np.concatenate(
        [
            np.abs(vertical[:, vertical_boundaries] - vertical[:, vertical_boundaries - 1]).ravel(),
            np.abs(
                horizontal[horizontal_boundaries, :] - horizontal[horizontal_boundaries - 1, :]
            ).ravel(),
        ]
    )
    nearby = np.concatenate(
        [
            np.abs(
                vertical[:, vertical_boundaries - 1] - vertical[:, vertical_boundaries - 2]
            ).ravel(),
            np.abs(
                horizontal[horizontal_boundaries - 1, :] - horizontal[horizontal_boundaries - 2, :]
            ).ravel(),
        ]
    )
    baseline = float(np.mean(nearby))
    return max(0.0, (float(np.mean(boundary)) - baseline) / max(baseline, 1e-9))


def _banding(luminance: NDArray[np.float32], gradient: NDArray[np.float32]) -> float | None:
    height, width = luminance.shape
    scores: list[float] = []
    for row in range(6):
        y0, y1 = round(row * height / 6), round((row + 1) * height / 6)
        for column in range(8):
            x0, x1 = round(column * width / 8), round((column + 1) * width / 8)
            tile = luminance[y0:y1, x0:x1]
            tile_gradient = gradient[y0:y1, x0:x1]
            if tile.size < 64:
                continue
            tonal_range = float(np.percentile(tile, 95.0) - np.percentile(tile, 5.0))
            if tonal_range < 0.01 or float(np.percentile(tile_gradient, 75.0)) > 0.02:
                continue
            quantized = np.rint(np.clip(tile, 0.0, 1.0) * 4095.0).astype(np.int16)
            expected_levels = min(tile.size, max(2.0, tonal_range * 4095.0))
            level_sparsity = max(0.0, 1.0 - np.unique(quantized).size / expected_levels)
            plateaus = np.concatenate(
                [
                    (quantized[:, 1:] == quantized[:, :-1]).ravel(),
                    (quantized[1:] == quantized[:-1]).ravel(),
                ]
            )
            scores.append(level_sparsity * float(np.mean(plateaus)))
    return float(np.percentile(scores, 75.0)) if scores else None


def _channel_clipping(image: FloatImage, *, threshold: float) -> float:
    clipped = 0
    pixels = image.shape[0] * image.shape[1]
    for start in range(0, image.shape[0], 256):
        chunk = image[start : start + 256]
        clipped += int(np.count_nonzero(np.any(chunk >= threshold, axis=2)))
    return clipped / pixels


def _center_to_corner_falloff(luminance: NDArray[np.float32]) -> float | None:
    height, width = luminance.shape
    y, x = np.ogrid[-1.0 : 1.0 : complex(height), -1.0 : 1.0 : complex(width)]
    radius = np.sqrt(x * x + y * y) / math.sqrt(2.0)
    center = luminance[radius <= 0.25]
    corners = luminance[radius >= 0.75]
    if center.size < 64 or corners.size < 64:
        return None
    center_median, corner_median = float(np.median(center)), float(np.median(corners))
    return (center_median - corner_median) / max(center_median, 1e-9)


def _box_blur(values: NDArray[np.float32]) -> NDArray[np.float32]:
    padded = np.pad(values, 1, mode="reflect")
    result = (
        sum(
            padded[y : y + values.shape[0], x : x + values.shape[1]]
            for y in range(3)
            for x in range(3)
        )
        / 9.0
    )
    return np.asarray(result, dtype=np.float32)


def _bilinear(
    values: NDArray[np.float32], *, x: NDArray[np.float64], y: NDArray[np.float64]
) -> NDArray[np.float64]:
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    x1, y1 = x0 + 1, y0 + 1
    x_fraction, y_fraction = x - x0, y - y0
    return (
        values[y0, x0] * (1.0 - x_fraction) * (1.0 - y_fraction)
        + values[y0, x1] * x_fraction * (1.0 - y_fraction)
        + values[y1, x0] * (1.0 - x_fraction) * y_fraction
        + values[y1, x1] * x_fraction * y_fraction
    )


def _crossing(
    offsets: NDArray[np.float64], profile: NDArray[np.float64], level: float
) -> float | None:
    indices = np.flatnonzero(profile >= level)
    if indices.size == 0:
        return None
    index = int(indices[0])
    if index == 0:
        return float(offsets[0])
    before, after = float(profile[index - 1]), float(profile[index])
    if abs(after - before) <= 1e-12:
        return float(offsets[index])
    fraction = (level - before) / (after - before)
    return float(offsets[index - 1] + fraction * (offsets[index] - offsets[index - 1]))


def _root_mean_square(values: NDArray[np.float32]) -> float:
    return float(np.sqrt(np.mean(np.square(np.asarray(values, dtype=np.float64)))))


def _percentile_or_none(
    values: NDArray[np.float32], percentile: float, *, minimum: int
) -> float | None:
    return float(np.percentile(values, percentile)) if values.size >= minimum else None


def _robust_sigma(values: NDArray[np.floating]) -> float:
    median = float(np.median(values))
    return float(1.4826 * np.median(np.abs(values - median)))


def _robust_coefficient(values: NDArray[np.float64]) -> float | None:
    median = float(np.median(values))
    return _robust_sigma(values) / median if median > 1e-12 else None


def _warnings(*, metrics: QualityMetrics, focus_tiles: int, profiles: int) -> list[str]:
    warnings = [
        "Sharpness and focus scores depend on target texture; compare similarly framed scenes",
        "Directional blur and center-to-corner falloff can reflect scene structure",
    ]
    if focus_tiles < 4:
        warnings.append("Target is too small for a reliable focus-coverage map")
    if profiles == 0:
        warnings.append("Target contains too few suitable edges for edge width and ringing")
    if metrics.banding_fraction is None:
        warnings.append("Image contains too few smooth gradients for banding analysis")
    return warnings
