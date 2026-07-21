from __future__ import annotations

import argparse
import subprocess
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PYPROJECT_TOML = ROOT / "pyproject.toml"


def manifest_version() -> str:
    data = tomllib.loads(PYPROJECT_TOML.read_text(encoding="utf-8"))
    version = data.get("project", {}).get("version")
    if not isinstance(version, str):
        raise RuntimeError("project.version not found in pyproject.toml")
    return version


def git_exact_tag() -> str | None:
    result = subprocess.run(
        ["git", "describe", "--tags", "--exact-match"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None
    return result.stdout.strip()


def effective_version() -> str:
    version = manifest_version()
    if git_exact_tag() == f"v{version}":
        return version
    return f"{version}.dev0"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--field", choices=["version"], default="version")
    parser.parse_args()
    print(effective_version())


if __name__ == "__main__":
    main()
