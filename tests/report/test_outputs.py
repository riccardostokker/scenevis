from pathlib import Path

import numpy as np
from PIL import Image

from scene_analyzer.analysis.pipeline import analyze_with_artifacts
from scene_analyzer.report import write
from scene_analyzer.scene.roi import RoiConfig


def test_summary_diagnostic_and_records(tmp_path: Path) -> None:
    pixels = np.full((100, 120, 3), 32, dtype=np.uint8)
    pixels[20:50, 20:45] = 48
    pixels[10:90, 75:115] = 220
    image_path = tmp_path / "scene.png"
    Image.fromarray(pixels, mode="RGB").save(image_path)
    config = _config()

    artifacts = analyze_with_artifacts(image_path=image_path, roi_config=config)
    outputs = write(artifacts=artifacts, roi_config=config, output_dir=tmp_path / "results")

    assert outputs.summary.is_file()
    assert outputs.diagnostic.is_file()
    assert outputs.json.is_file()
    assert outputs.csv.is_file()
    with Image.open(outputs.summary) as summary, Image.open(outputs.diagnostic) as diagnostic:
        assert summary.width > pixels.shape[1]
        assert summary.height >= pixels.shape[0]
        assert summary.size == diagnostic.size
        assert summary.tobytes() != diagnostic.tobytes()
    restored = artifacts.result.model_validate_json(outputs.json.read_text(encoding="utf-8"))
    assert restored.metrics == artifacts.result.metrics


def _config() -> RoiConfig:
    return RoiConfig.model_validate(
        {
            "scene_id": "synthetic",
            "regions": {
                "target": {
                    "type": "rectangle",
                    "x": 20 / 120,
                    "y": 0.2,
                    "width": 25 / 120,
                    "height": 0.3,
                },
                "local_background": {
                    "type": "rectangle",
                    "x": 0.1,
                    "y": 0.1,
                    "width": 0.4,
                    "height": 0.5,
                },
                "bright_background": {
                    "type": "rectangle",
                    "x": 75 / 120,
                    "y": 0.1,
                    "width": 40 / 120,
                    "height": 0.8,
                },
            },
        }
    )
