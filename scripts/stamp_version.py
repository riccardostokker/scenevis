from __future__ import annotations

import argparse
import re
import subprocess
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PYPROJECT_TOML = ROOT / "pyproject.toml"
INIT_PY = ROOT / "src" / "scene_analyzer" / "__init__.py"
SEMVER = re.compile(r"^\d+\.\d+\.\d+$")


def main() -> None:
    args = parse_args()
    version = args.version or current_project_version()
    if SEMVER.fullmatch(version) is None:
        raise RuntimeError(f"unsupported version: {version!r}")

    replace_line(PYPROJECT_TOML, r'^version = "[^"]+"$', f'version = "{version}"')
    replace_line(INIT_PY, r'^__version__ = "[^"]+"$', f'__version__ = "{version}"')
    subprocess.run(["uv", "lock"], cwd=ROOT, check=True)
    print(version)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", help="Version to stamp, in X.Y.Z form.")
    return parser.parse_args()


def current_project_version() -> str:
    data = tomllib.loads(PYPROJECT_TOML.read_text(encoding="utf-8"))
    version = data.get("project", {}).get("version")
    if not isinstance(version, str):
        raise RuntimeError("project.version not found in pyproject.toml")
    return version


def replace_line(path: Path, pattern: str, replacement: str) -> None:
    content = path.read_text(encoding="utf-8")
    updated = re.sub(pattern, replacement, content, count=1, flags=re.MULTILINE)
    if updated == content and replacement not in content:
        raise RuntimeError(f"{path.relative_to(ROOT)} was not updated")
    path.write_text(updated, encoding="utf-8")


if __name__ == "__main__":
    main()
