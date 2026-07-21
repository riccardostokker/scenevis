from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError

from scenevis import __version__
from scenevis.analysis import analyze_loaded
from scenevis.api.model import Analysis, Health, Preview, Problem
from scenevis.api.upload import temporary_image
from scenevis.error import ScenevisError
from scenevis.scene import Regions
from scenevis.scene.load import load
from scenevis.scene.suggest import bright_background

app = FastAPI(title="Scenevis API", version=__version__)


@app.exception_handler(ScenevisError)
async def scenevis_error(_request: Request, error: ScenevisError) -> JSONResponse:
    problem = Problem(code="invalid_scene", message=str(error))
    return JSONResponse(status_code=422, content=problem.model_dump(mode="json"))


@app.exception_handler(RequestValidationError)
async def validation_error(_request: Request, _error: RequestValidationError) -> JSONResponse:
    problem = Problem(code="invalid_request", message="The request is incomplete or malformed.")
    return JSONResponse(status_code=422, content=problem.model_dump(mode="json"))


@app.get("/api/health", response_model=Health, operation_id="getHealth")
def health() -> Health:
    """Report local service readiness."""

    return Health()


@app.post(
    "/api/previews",
    response_model=Preview,
    responses={422: {"model": Problem}},
    operation_id="createPreview",
)
def create_preview(
    image: Annotated[UploadFile, File(description="RAW or raster image")],
) -> Preview:
    """Decode one image and return a compressed, display-only preview."""

    with temporary_image(image) as (path, image_name):
        loaded = load(path)
    preview = loaded.preview.convert("RGB").copy()
    preview.thumbnail((2000, 1400))
    buffer = BytesIO()
    preview.save(buffer, format="JPEG", quality=82, optimize=True)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    height, width, _ = loaded.linear_rgb.shape
    return Preview(
        image=image_name,
        width_px=width,
        height_px=height,
        preview_data_url=f"data:image/jpeg;base64,{encoded}",
        bright_background_suggestion=bright_background(loaded.preview),
        metadata=loaded.metadata,
        processing=loaded.processing,
    )


@app.post(
    "/api/analyses",
    response_model=Analysis,
    responses={422: {"model": Problem}},
    operation_id="createAnalysis",
)
def create_analysis(
    image: Annotated[UploadFile, File(description="RAW or raster image")],
    regions: Annotated[str, Form(description="Normalized region JSON")],
) -> Analysis:
    """Analyze one image with browser-authored regions without persisting either."""

    try:
        parsed_regions = Regions.model_validate_json(regions)
    except ValidationError as error:
        raise ScenevisError("regions are invalid") from error
    with temporary_image(image) as (path, image_name):
        loaded = load(path)
    return Analysis(
        result=analyze_loaded(
            loaded=loaded,
            image_name=image_name,
            scene_id=Path(image_name).stem or "scene",
            regions=parsed_regions,
        ),
        regions=parsed_regions,
    )


_static = Path(__file__).with_name("static")
if (_static / "index.html").is_file():
    app.mount("/", StaticFiles(directory=_static, html=True), name="app")
