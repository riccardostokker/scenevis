from __future__ import annotations

import math
import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path

import exifread

from scenevis.scene.model import CaptureMetadata, ImageMetadata, MetadataEntry, MetadataGroup

MAXIMUM_ENTRIES = 512
MAXIMUM_VALUE_CHARACTERS = 512

_SENSITIVE_MARKERS = (
    "artist",
    "author",
    "copyright",
    "creator",
    "datetime",
    "date time",
    "gps",
    "location",
    "owner",
    "serial",
    "timezone",
    "time zone",
)

_CAMERA_MAKE = ("Image Make",)
_CAMERA_MODEL = ("Image Model",)
_LENS = (
    "EXIF LensModel",
    "Image LensModel",
    "EXIF LensInfo",
    "Image LensInfo",
    "MakerNote LensModel",
    "MakerNote LensType",
)
_APERTURE = ("EXIF FNumber", "Image FNumber")
_EXPOSURE_TIME = ("EXIF ExposureTime", "Image ExposureTime")
_ISO = (
    "EXIF PhotographicSensitivity",
    "Image PhotographicSensitivity",
    "EXIF ISOSpeedRatings",
    "Image ISOSpeedRatings",
    "MakerNote ISO",
)
_FOCAL_LENGTH = ("EXIF FocalLength", "Image FocalLength")
_FOCAL_LENGTH_35MM = (
    "EXIF FocalLengthIn35mmFilm",
    "Image FocalLengthIn35mmFilm",
)
_EXPOSURE_COMPENSATION = ("EXIF ExposureBiasValue", "Image ExposureBiasValue")
_METERING_MODE = ("EXIF MeteringMode", "Image MeteringMode")
_WHITE_BALANCE = ("EXIF WhiteBalance", "Image WhiteBalance", "MakerNote WhiteBalance")
_CAPTURED_AT = (
    "EXIF DateTimeOriginal",
    "Image DateTimeOriginal",
    "EXIF DateTimeDigitized",
    "Image DateTimeDigitized",
    "Image DateTime",
)
_ORIENTATION = ("Image Orientation",)
_COLOR_SPACE = ("EXIF ColorSpace", "Image ColorSpace")


@dataclass(frozen=True, slots=True)
class MetadataFallback:
    """Decoder-owned values used only when the source tags omit a field."""

    camera_make: str | None = None
    camera_model: str | None = None
    lens: str | None = None
    aperture_f_number: float | None = None
    exposure_time_seconds: float | None = None
    iso: int | None = None
    focal_length_mm: float | None = None
    captured_at: str | None = None


def read(
    path: Path,
    *,
    width_px: int,
    height_px: int,
    fallback: MetadataFallback | None = None,
) -> ImageMetadata:
    """Read bounded source metadata and normalize the fields used for comparison."""

    with path.open("rb") as stream:
        tags = exifread.process_file(
            stream,
            details=True,
            strict=False,
            truncate_tags=False,
            extract_thumbnail=False,
            builtin_types=True,
        )

    values: Mapping[str, object] = tags
    normalized_fallback = fallback or MetadataFallback()
    aperture = _number(values, _APERTURE) or normalized_fallback.aperture_f_number
    exposure_time = _number(values, _EXPOSURE_TIME) or normalized_fallback.exposure_time_seconds
    iso = _integer(values, _ISO) or normalized_fallback.iso
    entries = _entries(values)
    summary = CaptureMetadata(
        file_format=path.suffix.lower().removeprefix("."),
        file_size_bytes=path.stat().st_size,
        width_px=width_px,
        height_px=height_px,
        camera_make=_text(values, _CAMERA_MAKE) or normalized_fallback.camera_make,
        camera_model=_text(values, _CAMERA_MODEL) or normalized_fallback.camera_model,
        lens=_text(values, _LENS) or normalized_fallback.lens,
        aperture_f_number=aperture,
        exposure_time_seconds=exposure_time,
        iso=iso,
        focal_length_mm=_number(values, _FOCAL_LENGTH) or normalized_fallback.focal_length_mm,
        focal_length_35mm_mm=_number(values, _FOCAL_LENGTH_35MM),
        exposure_compensation_ev=_number(values, _EXPOSURE_COMPENSATION),
        exposure_value_ev100=_exposure_value(aperture, exposure_time),
        metering_mode=_text(values, _METERING_MODE),
        white_balance=_text(values, _WHITE_BALANCE),
        captured_at=_text(values, _CAPTURED_AT) or normalized_fallback.captured_at,
        orientation=_text(values, _ORIENTATION),
        color_space=_text(values, _COLOR_SPACE),
    )
    return ImageMetadata(
        summary=summary,
        entries=entries[:MAXIMUM_ENTRIES],
        entries_truncated=len(entries) > MAXIMUM_ENTRIES,
    )


def _entries(tags: Mapping[str, object]) -> list[MetadataEntry]:
    entries = [
        _entry(key, value)
        for key, value in sorted(tags.items(), key=lambda item: item[0].casefold())
    ]
    return entries


def _entry(key: str, raw_value: object) -> MetadataEntry:
    value = _display_value(raw_value)
    truncated = len(value) > MAXIMUM_VALUE_CHARACTERS
    if truncated:
        value = f"{value[: MAXIMUM_VALUE_CHARACTERS - 1]}…"
    return MetadataEntry(
        key=key,
        label=_label(key),
        group=_group(key),
        value=value,
        sensitive=_sensitive(key),
        truncated=truncated,
    )


def _display_value(value: object) -> str:
    if isinstance(value, bytes):
        return f"Binary data ({len(value):,} bytes)"
    if isinstance(value, str):
        return value.replace("\x00", "").strip() or "Empty"
    if value is None:
        return "Not Set"
    if isinstance(value, Sequence) and not isinstance(value, str | bytes):
        return ", ".join(_display_value(item) for item in value)
    return str(value)


def _text(tags: Mapping[str, object], aliases: Sequence[str]) -> str | None:
    value = _first(tags, aliases)
    if value is None or isinstance(value, bytes):
        return None
    text = _display_value(value)
    return None if text in {"", "Empty", "Not Set"} else text


def _integer(tags: Mapping[str, object], aliases: Sequence[str]) -> int | None:
    value = _number(tags, aliases)
    return round(value) if value is not None else None


def _number(tags: Mapping[str, object], aliases: Sequence[str]) -> float | None:
    value = _first(tags, aliases)
    if isinstance(value, Sequence) and not isinstance(value, str | bytes):
        value = value[0] if value else None
    if isinstance(value, bool) or not isinstance(value, int | float):
        return None
    number = float(value)
    return number if math.isfinite(number) else None


def _first(tags: Mapping[str, object], aliases: Sequence[str]) -> object | None:
    for alias in aliases:
        value = tags.get(alias)
        if value is not None:
            return value
    return None


def _exposure_value(aperture: float | None, exposure_time: float | None) -> float | None:
    if aperture is None or aperture <= 0 or exposure_time is None or exposure_time <= 0:
        return None
    return math.log2(aperture**2 / exposure_time)


def _group(key: str) -> MetadataGroup:
    prefix = key.partition(" ")[0].casefold()
    match prefix:
        case "file":
            return "file"
        case "image":
            return "image"
        case "exif":
            return "exif"
        case "gps":
            return "gps"
        case "makernote":
            return "camera"
        case "thumbnail":
            return "thumbnail"
        case "xmp":
            return "xmp"
        case _:
            return "other"


def _label(key: str) -> str:
    name = key.partition(" ")[2] or key
    words = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", name).replace("_", " ")
    return words.strip()


def _sensitive(key: str) -> bool:
    normalized = key.casefold().replace("_", " ")
    return any(marker in normalized for marker in _SENSITIVE_MARKERS)
