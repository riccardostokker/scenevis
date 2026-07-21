from __future__ import annotations

import asyncio
import math
from collections.abc import Mapping
from pathlib import Path
from typing import IO

import httpx
import pytest

from scenevis.api import app

FIXTURE_DIR = Path(__file__).parents[1] / "fixtures" / "canon_eos_200d"

CAMERA_REGIONS = {
    "IMG_0152": {
        "target": {"type": "rectangle", "x": 0.48, "y": 0.34, "width": 0.28, "height": 0.42},
        "local_background": {
            "type": "polygon",
            "points": [[0.37, 0.18], [0.82, 0.18], [0.82, 0.82], [0.37, 0.82]],
        },
        "bright_background": {
            "type": "rectangle",
            "x": 0.13,
            "y": 0.48,
            "width": 0.30,
            "height": 0.14,
        },
    },
}


@pytest.mark.camera_fixture
@pytest.mark.parametrize("name", ["IMG_0152"])
def test_analysis(name: str) -> None:
    image = FIXTURE_DIR / f"{name}.CR2"
    with image.open("rb") as stream:
        response = asyncio.run(
            _post(
                files={"image": (image.name, stream, "image/x-canon-cr2")},
                data={"regions": _regions_json(name)},
            )
        )

    assert response.status_code == 200
    result = response.json()
    assert result["result"]["processing"]["source"] == "raw"
    assert result["result"]["processing"]["black_level_per_channel"] is not None
    assert math.isfinite(result["result"]["metrics"]["dr_target_median_stops"])


def _regions_json(name: str) -> str:
    import json

    return json.dumps(CAMERA_REGIONS[name])


async def _post(
    *, files: Mapping[str, tuple[str, IO[bytes] | bytes, str]], data: dict[str, str]
) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post("/api/analyses", files=files, data=data)
