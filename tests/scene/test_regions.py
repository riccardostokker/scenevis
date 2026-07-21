import numpy as np

from scenevis.scene.regions import Regions, masks, overlap_fraction


def test_target_excluded_from_local() -> None:
    regions = _regions()
    result = masks(regions, width=100, height=100)

    assert int(np.count_nonzero(result["target"])) == 400
    assert not np.any(np.logical_and(result["target"], result["local_background"]))
    assert overlap_fraction(regions, width=100, height=100) == 0.25


def _regions() -> Regions:
    return Regions.model_validate(
        {
            "target": {"type": "rectangle", "x": 0.2, "y": 0.2, "width": 0.2, "height": 0.2},
            "local_background": {
                "type": "rectangle",
                "x": 0.1,
                "y": 0.1,
                "width": 0.4,
                "height": 0.4,
            },
            "bright_background": {
                "type": "polygon",
                "points": [[0.6, 0.1], [0.9, 0.1], [0.9, 0.9], [0.6, 0.9]],
            },
        }
    )
