import asyncio
from collections.abc import Mapping
from io import BytesIO
from typing import IO

import httpx
import numpy as np
from PIL import Image

from scenevis.api import app
from scenevis.scene import Regions


def test_preview_and_analysis() -> None:
    image = _image()

    preview_response = asyncio.run(
        _post("/api/previews", files={"image": ("scene.png", image, "image/png")})
    )
    preview = preview_response.json()

    assert preview_response.status_code == 200
    assert preview["image"] == "scene.png"
    assert preview["preview_data_url"].startswith("data:image/jpeg;base64,")
    assert preview["width_px"] == 120
    assert preview["height_px"] == 100
    assert preview["version"] == 2
    assert preview["metadata"]["summary"]["file_format"] == "png"
    assert preview["metadata"]["summary"]["width_px"] == 120
    assert preview["metadata"]["entries"] == []

    analysis_response = asyncio.run(
        _post(
            "/api/analyses",
            files={"image": ("scene.png", image, "image/png")},
            data={"regions": _regions().model_dump_json()},
        )
    )
    analysis = analysis_response.json()

    assert analysis_response.status_code == 200
    assert analysis["result"]["scene_id"] == "scene"
    assert analysis["result"]["image"] == "scene.png"
    assert analysis["result"]["version"] == 3
    assert analysis["result"]["metadata"]["summary"]["file_format"] == "png"
    assert analysis["result"]["metrics"]["cnr_robust"] > 0
    assert analysis["result"]["quality"]["metrics"]["target_sharpness"] >= 0
    assert analysis["result"]["quality"]["analysis_width_px"] == 120
    assert analysis["result"]["quality"]["focus_map"]
    assert analysis["regions"] == _regions().model_dump(mode="json")


def test_rejects_unrecognized_images() -> None:
    response = asyncio.run(
        _post(
            "/api/previews",
            files={"image": ("scene.txt", b"not an image", "text/plain")},
        )
    )

    assert response.status_code == 422
    assert response.json()["code"] == "invalid_scene"


def _image() -> bytes:
    pixels = np.full((100, 120, 3), 32, dtype=np.uint8)
    pixels[20:50, 20:45] = 48
    pixels[10:90, 75:115] = 220
    buffer = BytesIO()
    Image.fromarray(pixels, mode="RGB").save(buffer, format="PNG")
    return buffer.getvalue()


def _regions() -> Regions:
    return Regions.model_validate(
        {
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
        }
    )


async def _post(
    path: str,
    *,
    files: Mapping[str, tuple[str, IO[bytes] | bytes, str]],
    data: dict[str, str] | None = None,
) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, files=files, data=data)
