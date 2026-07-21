from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

from scene_analyzer.analysis.pipeline import Artifacts
from scene_analyzer.error import SceneAnalyzerError
from scene_analyzer.report.overlay import save as save_overlay
from scene_analyzer.scene.roi import RoiConfig


@dataclass(frozen=True, slots=True)
class Outputs:
    """Paths written for one analyzed scene."""

    overlay: Path
    json: Path
    csv: Path


def write(
    *,
    artifacts: Artifacts,
    roi_config: RoiConfig,
    output_dir: Path,
    overwrite: bool = False,
) -> Outputs:
    """Write an overlay PNG and consistent JSON/CSV result records."""

    output_dir.mkdir(parents=True, exist_ok=True)
    stem = artifacts.result.scene_id
    outputs = Outputs(
        overlay=output_dir / f"{stem}.overlay.png",
        json=output_dir / f"{stem}.analysis.json",
        csv=output_dir / f"{stem}.analysis.csv",
    )
    existing = [path for path in (outputs.overlay, outputs.json, outputs.csv) if path.exists()]
    if existing and not overwrite:
        names = ", ".join(str(path) for path in existing)
        raise SceneAnalyzerError(f"output already exists: {names}; pass --overwrite to replace")

    outputs.json.write_text(artifacts.result.model_dump_json(indent=2) + "\n", encoding="utf-8")
    _write_csv(artifacts, outputs.csv)
    save_overlay(
        preview=artifacts.preview,
        config=roi_config,
        result=artifacts.result,
        path=outputs.overlay,
    )
    return outputs


def _write_csv(artifacts: Artifacts, path: Path) -> None:
    result = artifacts.result
    row: dict[str, str | int | float | bool | None] = {
        "scene_id": result.scene_id,
        "image": result.image,
        "processing_source": result.processing.source,
        "warnings": " | ".join(result.warnings),
    }
    for name, value in result.metadata.items():
        row[f"metadata_{name}"] = value
    for name, value in result.metrics.model_dump().items():
        row[name] = value
    for region_name, region in result.roi_statistics.items():
        for name, value in region.model_dump().items():
            row[f"{region_name}_{name}"] = value

    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(row))
        writer.writeheader()
        writer.writerow(row)
