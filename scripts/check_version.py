from __future__ import annotations

import re
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PYPROJECT_TOML = ROOT / "pyproject.toml"
SEMVER = re.compile(r"^\d+\.\d+\.\d+$")


def main() -> None:
    version = project_version()
    if SEMVER.fullmatch(version) is None:
        raise RuntimeError(f"project.version is not a supported SemVer value: {version!r}")

    assert_contains(ROOT / "src" / "scene_analyzer" / "__init__.py", f'__version__ = "{version}"')
    assert_contains(ROOT / "cliff.toml", 'initial_tag = "v0.1.0"')
    assert_contains(ROOT / "cliff.toml", "features_always_bump_minor = false")
    assert_contains(ROOT / "cliff.toml", "breaking_always_bump_major = false")
    if not (ROOT / "uv.lock").exists():
        raise RuntimeError("uv.lock is missing; run mise run version:sync")


def project_version() -> str:
    data = tomllib.loads(PYPROJECT_TOML.read_text(encoding="utf-8"))
    version = data.get("project", {}).get("version")
    if not isinstance(version, str):
        raise RuntimeError("project.version not found in pyproject.toml")
    return version


def assert_contains(path: Path, expected: str) -> None:
    if expected not in path.read_text(encoding="utf-8"):
        raise RuntimeError(f"{path.relative_to(ROOT)} does not contain {expected!r}")


if __name__ == "__main__":
    main()
