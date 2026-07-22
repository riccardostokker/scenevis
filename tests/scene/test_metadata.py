from __future__ import annotations

import math
from pathlib import Path

from PIL import Image
from PIL.TiffImagePlugin import IFDRational

from scenevis.scene.metadata import MetadataFallback, read


def test_normalizes_capture_context(tmp_path: Path) -> None:
    path = tmp_path / "capture.jpg"
    exif = Image.Exif()
    exif[271] = "Canon"
    exif[272] = "EOS 200D"
    exif[274] = 1
    exif[33434] = IFDRational(1, 125)
    exif[33437] = IFDRational(28, 10)
    exif[34855] = 400
    exif[36867] = "2026:07:21 18:42:00"
    exif[37380] = IFDRational(-1, 3)
    exif[37383] = 2
    exif[37386] = IFDRational(50, 1)
    exif[40961] = 1
    exif[41987] = 1
    exif[41989] = 80
    exif[42033] = "CAMERA-123"
    exif[42036] = "EF 50mm f/1.8 STM"
    Image.new("RGB", (120, 80), color=(40, 50, 60)).save(path, exif=exif)

    metadata = read(path, width_px=120, height_px=80)

    assert metadata.summary.camera_make == "Canon"
    assert metadata.summary.camera_model == "EOS 200D"
    assert metadata.summary.lens == "EF 50mm f/1.8 STM"
    assert metadata.summary.aperture_f_number == 2.8
    assert metadata.summary.exposure_time_seconds == 1 / 125
    assert metadata.summary.iso == 400
    assert metadata.summary.focal_length_mm == 50
    assert metadata.summary.focal_length_35mm_mm == 80
    assert metadata.summary.exposure_compensation_ev == -1 / 3
    assert metadata.summary.captured_at == "2026-07-21 18:42:00"
    assert metadata.summary.file_size_bytes == path.stat().st_size
    assert math.isclose(metadata.summary.exposure_value_ev100 or 0, 9.9366, rel_tol=1e-4)
    assert any(
        entry.key.endswith(" BodySerialNumber") and entry.sensitive for entry in metadata.entries
    )
    assert any(
        entry.key.endswith(" DateTimeOriginal") and entry.sensitive for entry in metadata.entries
    )


def test_uses_decoder_fallbacks(tmp_path: Path) -> None:
    path = tmp_path / "capture.png"
    Image.new("RGB", (32, 24)).save(path)

    metadata = read(
        path,
        width_px=32,
        height_px=24,
        fallback=MetadataFallback(
            lens="Fallback Lens",
            aperture_f_number=4,
            exposure_time_seconds=0.01,
            iso=100,
            focal_length_mm=35,
        ),
    )

    assert metadata.summary.lens == "Fallback Lens"
    assert metadata.summary.aperture_f_number == 4
    assert metadata.summary.exposure_time_seconds == 0.01
    assert metadata.summary.iso == 100
    assert metadata.summary.exposure_value_ev100 is not None
