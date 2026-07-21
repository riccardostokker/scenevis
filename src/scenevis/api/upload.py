from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi import UploadFile

from scenevis.error import ScenevisError

MAXIMUM_UPLOAD_BYTES = 100 * 1024 * 1024
CHUNK_BYTES = 1024 * 1024
SUPPORTED_SUFFIXES = frozenset({".cr2", ".dng", ".jpeg", ".jpg", ".png", ".tif", ".tiff"})


@contextmanager
def temporary_image(upload: UploadFile) -> Iterator[tuple[Path, str]]:
    """Materialize one bounded upload for decoders that require a filesystem path."""

    image_name = Path(upload.filename or "").name
    suffix = Path(image_name).suffix.lower()
    if not image_name or suffix not in SUPPORTED_SUFFIXES:
        supported = ", ".join(sorted(SUPPORTED_SUFFIXES))
        raise ScenevisError(f"unsupported image; expected one of {supported}")

    with TemporaryDirectory(prefix="scenevis-") as directory:
        path = Path(directory) / f"source{suffix}"
        size = 0
        upload.file.seek(0)
        with path.open("wb") as destination:
            while chunk := upload.file.read(CHUNK_BYTES):
                size += len(chunk)
                if size > MAXIMUM_UPLOAD_BYTES:
                    raise ScenevisError("image exceeds the 100 MiB upload limit")
                destination.write(chunk)
        if size == 0:
            raise ScenevisError("image is empty")
        yield path, image_name
