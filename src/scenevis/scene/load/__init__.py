"""Sealed source-loader catalog."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from types import MappingProxyType

from scenevis.error import ScenevisError
from scenevis.scene.load.raster import load as load_raster
from scenevis.scene.load.raw import load as load_raw
from scenevis.scene.model import Loaded

Loader = Callable[[Path], Loaded]

_LOADERS: MappingProxyType[str, Loader] = MappingProxyType(
    {
        ".cr2": load_raw,
        ".dng": load_raw,
        ".tif": load_raster,
        ".tiff": load_raster,
        ".png": load_raster,
        ".jpg": load_raster,
        ".jpeg": load_raster,
    }
)


def load(path: Path) -> Loaded:
    """Load a supported image through its format owner."""

    loader = _LOADERS.get(path.suffix.lower())
    if loader is None:
        supported = ", ".join(sorted(_LOADERS))
        raise ScenevisError(
            f"unsupported image format {path.suffix!r}; expected one of {supported}"
        )
    if not path.is_file():
        raise ScenevisError(f"image does not exist: {path}")
    try:
        return loader(path)
    except ScenevisError:
        raise
    except Exception as error:
        raise ScenevisError(f"could not load {path}: {error}") from error
