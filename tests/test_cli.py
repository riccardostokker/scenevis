from pathlib import Path

import pytest
from typer.testing import CliRunner

from scene_analyzer import cli


def test_select_rois_passes_paths_to_desktop_selector(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    image = tmp_path / "scene.jpg"
    output = tmp_path / "authored.yaml"
    received: list[object] = []

    def fake_select(image_path: Path, *, output_path: Path | None, overwrite: bool) -> Path:
        received.extend((image_path, output_path, overwrite))
        return output

    monkeypatch.setattr(cli, "select_rois", fake_select)

    result = CliRunner().invoke(
        cli.app,
        ["select-rois", str(image), "--output", str(output), "--overwrite"],
    )

    assert result.exit_code == 0
    assert received == [image, output, True]
    assert str(output) in result.stdout
