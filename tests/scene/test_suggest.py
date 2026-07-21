import numpy as np
from PIL import Image

from scenevis.scene.suggest import bright_background


def test_bright_area() -> None:
    pixels = np.full((100, 120, 3), 20, dtype=np.uint8)
    pixels[5:35, 85:118] = 240

    region = bright_background(Image.fromarray(pixels, mode="RGB"))

    assert region.x > 0.65
    assert region.y < 0.2
