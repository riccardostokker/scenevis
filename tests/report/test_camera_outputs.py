from __future__ import annotations

import math
from pathlib import Path

import pytest
from PIL import Image

from scene_analyzer.analysis.pipeline import analyze_with_artifacts
from scene_analyzer.report import write
from scene_analyzer.scene import load_roi_config

FIXTURE_DIR = Path(__file__).parents[1] / "fixtures" / "canon_eos_200d"


@pytest.mark.camera_fixture
@pytest.mark.parametrize("name", ["IMG_0152", "IMG_0158"])
def test_outputs(name: str, tmp_path: Path) -> None:
    config = load_roi_config(FIXTURE_DIR / "rois" / f"{name}.yaml")
    artifacts = analyze_with_artifacts(
        image_path=FIXTURE_DIR / f"{name}.CR2",
        roi_config=config,
    )
    outputs = write(
        artifacts=artifacts,
        roi_config=config,
        output_dir=tmp_path,
    )

    assert artifacts.result.processing.source == "raw"
    assert artifacts.result.processing.black_level_per_channel is not None
    assert math.isfinite(artifacts.result.metrics.dr_target_median_stops)
    assert outputs.json.is_file()
    assert outputs.csv.is_file()
    with Image.open(outputs.summary) as summary, Image.open(outputs.diagnostic) as diagnostic:
        assert summary.width > 1600
        assert summary.height >= 1000
        assert summary.size == diagnostic.size
