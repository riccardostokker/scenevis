import numpy as np

from scenevis.analysis import Options
from scenevis.analysis.quality import analyze_quality
from scenevis.scene import Regions


def test_sharpness_and_edge_width() -> None:
    sharp = np.zeros((160, 192, 3), dtype=np.float32)
    sharp[:, 96:] = 0.8
    blurred = _blur(sharp, passes=8)

    sharp_result = _analyze(sharp)
    blurred_result = _analyze(blurred)

    assert sharp_result.metrics.target_sharpness > blurred_result.metrics.target_sharpness
    assert sharp_result.metrics.target_edge_width_px is not None
    assert blurred_result.metrics.target_edge_width_px is not None
    assert sharp_result.metrics.target_edge_width_px < blurred_result.metrics.target_edge_width_px
    assert sharp_result.metrics.ringing_halo_strength is not None


def test_focus_map_localizes_soft_detail() -> None:
    y, x = np.indices((160, 192))
    pattern = ((x // 3 + y // 3) % 2).astype(np.float32) * 0.7
    sharp = np.repeat(pattern[:, :, None], 3, axis=2)
    mixed = sharp.copy()
    mixed[:, 96:] = _blur(sharp[:, 96:], passes=5)

    result = _analyze(mixed)

    left = [tile.relative_sharpness for tile in result.focus_map if tile.x < 0.5]
    right = [tile.relative_sharpness for tile in result.focus_map if tile.x >= 0.5]
    assert left and right
    assert np.median(left) > np.median(right)
    assert result.metrics.target_in_focus_coverage is not None
    assert 0.0 < result.metrics.target_in_focus_coverage < 1.0
    assert result.metrics.target_sharpness_consistency is not None


def test_noise_and_detail_separation() -> None:
    clean = np.full((160, 192, 3), 0.3, dtype=np.float32)
    random = np.random.default_rng(42)
    noisy = np.clip(clean + random.normal(0.0, 0.025, clean.shape), 0.0, 1.0).astype(np.float32)

    clean_result = _analyze(clean)
    noisy_result = _analyze(noisy)

    assert clean_result.metrics.luminance_noise == 0.0
    assert noisy_result.metrics.luminance_noise is not None
    assert noisy_result.metrics.luminance_noise > 0.0
    assert noisy_result.metrics.chroma_noise is not None
    assert noisy_result.metrics.chroma_noise > 0.0


def test_artifact_and_tonal_metrics() -> None:
    image = np.full((160, 192, 3), 0.4, dtype=np.float32)
    for x in range(0, image.shape[1], 8):
        image[:, x : x + 8] += 0.04 if (x // 8) % 2 else 0.0
    image[:20, :20, 0] = 1.0
    image[:20, :20, 1:] = 0.2

    result = _analyze(image, file_format="jpg")

    assert result.metrics.jpeg_blockiness is not None
    assert result.metrics.jpeg_blockiness > 0.0
    assert result.metrics.channel_saturation_clipping > 0.0
    assert result.metrics.center_to_corner_falloff is not None


def _analyze(image: np.ndarray, *, file_format: str = "png"):
    luminance = np.asarray(
        image @ np.asarray([0.2126, 0.7152, 0.0722], dtype=np.float32), dtype=np.float32
    )
    return analyze_quality(
        linear_rgb=image,
        source_luminance=luminance,
        regions=Regions.model_validate(
            {
                "target": {"type": "rectangle", "x": 0.05, "y": 0.05, "width": 0.9, "height": 0.9},
                "local_background": {
                    "type": "rectangle",
                    "x": 0.0,
                    "y": 0.0,
                    "width": 1.0,
                    "height": 1.0,
                },
                "bright_background": {
                    "type": "rectangle",
                    "x": 0.0,
                    "y": 0.0,
                    "width": 0.1,
                    "height": 0.1,
                },
            }
        ),
        file_format=file_format,
        options=Options(quality_max_dimension=512),
    )


def _blur(image: np.ndarray, *, passes: int) -> np.ndarray:
    result = image.copy()
    for _ in range(passes):
        padded = np.pad(result, ((1, 1), (1, 1), (0, 0)), mode="edge")
        result = (
            sum(
                padded[y : y + image.shape[0], x : x + image.shape[1]]
                for y in range(3)
                for x in range(3)
            )
            / 9.0
        )
    return np.asarray(result, dtype=np.float32)
