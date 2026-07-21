from __future__ import annotations

from pathlib import Path
from typing import Annotated

import typer
from rich.console import Console

from scene_analyzer.analysis.pipeline import analyze_with_artifacts
from scene_analyzer.error import SceneAnalyzerError
from scene_analyzer.report import write
from scene_analyzer.scene import load_roi_config

app = typer.Typer(
    no_args_is_help=True, help="Analyze target visibility in high-dynamic-range scenes."
)
console = Console()


@app.callback()
def main() -> None:
    """Analyze target visibility in high-dynamic-range scenes."""


@app.command()
def analyze(
    image: Annotated[Path, typer.Argument(help="RAW or raster source image.")],
    rois: Annotated[Path, typer.Option("--rois", help="YAML or JSON ROI definition.")],
    output_dir: Annotated[
        Path, typer.Option("--output-dir", help="Directory for PNG, JSON, and CSV outputs.")
    ] = Path("results"),
    overwrite: Annotated[bool, typer.Option(help="Replace existing scene outputs.")] = False,
) -> None:
    """Analyze one scene and render its KPI-overlay image."""

    try:
        config = load_roi_config(rois)
        artifacts = analyze_with_artifacts(image_path=image, roi_config=config)
        outputs = write(
            artifacts=artifacts,
            roi_config=config,
            output_dir=output_dir,
            overwrite=overwrite,
        )
    except SceneAnalyzerError as error:
        console.print(f"[bold red]error:[/bold red] {error}")
        raise typer.Exit(code=1) from error

    console.print(f"[green]overlay[/green] {outputs.overlay}")
    console.print(f"[green]json[/green]    {outputs.json}")
    console.print(f"[green]csv[/green]     {outputs.csv}")
