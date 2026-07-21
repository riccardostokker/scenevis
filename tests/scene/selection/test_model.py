from pathlib import Path

import numpy as np

from scene_analyzer.scene.roi import Rectangle, load_roi_config, save_roi_config
from scene_analyzer.scene.selection import Selection, default_output_path, suggest_regions


def test_default_output_is_a_sidecar_yaml() -> None:
    image_path = Path("camera/DCIM/IMG_0152.CR2")

    assert default_output_path(image_path) == Path("camera/DCIM/IMG_0152.rois.yaml")


def test_suggestions_surround_target_and_find_bright_area() -> None:
    image = np.full((100, 120, 3), 0.1, dtype=np.float32)
    image[5:30, 85:115] = 0.95
    target = Rectangle(x=0.2, y=0.4, width=0.1, height=0.15)

    selection = suggest_regions(image, target)

    assert selection.local_background is not None
    assert selection.local_background.x < target.x
    assert selection.local_background.y < target.y
    assert selection.local_background.width > target.width
    assert selection.local_background.height > target.height
    assert selection.bright_background is not None
    assert selection.bright_background.x > 0.65
    assert selection.bright_background.y < 0.3


def test_suggestions_clamp_local_background_to_image() -> None:
    image = np.zeros((50, 50, 3), dtype=np.float32)
    target = Rectangle(x=0.92, y=0.94, width=0.08, height=0.06)

    local = suggest_regions(image, target).local_background

    assert local is not None
    assert local.x + local.width <= 1
    assert local.y + local.height <= 1


def test_selection_round_trips_as_yaml(tmp_path: Path) -> None:
    target = Rectangle(x=0.2, y=0.2, width=0.1, height=0.1)
    selection = Selection(
        target=target,
        local_background=Rectangle(x=0.1, y=0.1, width=0.3, height=0.3),
        bright_background=Rectangle(x=0.7, y=0.1, width=0.2, height=0.3),
    )
    path = tmp_path / "scene.rois.yaml"

    config = selection.config(scene_id="scene")
    save_roi_config(config, path)

    assert load_roi_config(path) == config
