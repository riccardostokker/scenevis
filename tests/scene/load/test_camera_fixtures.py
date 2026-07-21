from __future__ import annotations

import hashlib
from pathlib import Path
from typing import TypedDict, cast

import numpy as np
import pytest
import yaml

from scene_analyzer.scene.load import load

FIXTURE_DIR = Path(__file__).parents[2] / "fixtures" / "canon_eos_200d"


class Fixture(TypedDict):
    name: str
    kind: str
    bytes: int
    sha256: str
    width_px: int
    height_px: int


class Manifest(TypedDict):
    version: int
    camera_model: str
    source: str
    files: list[Fixture]


def fixtures() -> list[Fixture]:
    with (FIXTURE_DIR / "manifest.yaml").open(encoding="utf-8") as stream:
        return cast(Manifest, yaml.safe_load(stream))["files"]


@pytest.mark.camera_fixture
@pytest.mark.parametrize("fixture", fixtures(), ids=lambda fixture: fixture["name"])
def test_loads(fixture: Fixture) -> None:
    path = FIXTURE_DIR / fixture["name"]
    assert path.stat().st_size == fixture["bytes"]
    assert hashlib.file_digest(path.open("rb"), "sha256").hexdigest() == fixture["sha256"]

    loaded = load(path)

    assert loaded.processing.source == fixture["kind"]
    assert loaded.linear_rgb.shape == (fixture["height_px"], fixture["width_px"], 3)
    assert loaded.linear_rgb.dtype == np.float32
    assert bool(np.all(np.isfinite(loaded.linear_rgb)))
    assert float(np.min(loaded.linear_rgb)) >= 0.0
    assert float(np.max(loaded.linear_rgb)) <= 1.0
