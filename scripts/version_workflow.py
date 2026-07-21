from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RELEASE_FILES = (
    "app/openapi.json",
    "app/package.json",
    "app/pnpm-lock.yaml",
    "app/src/shared/api/schema.ts",
    "pyproject.toml",
    "src/scenevis/__init__.py",
    "uv.lock",
    "CHANGELOG.md",
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["release"])
    args = parser.parse_args()
    if args.command == "release":
        release()


def release() -> None:
    version = next_release_version()
    tag = f"v{version}"
    ensure_clean()
    ensure_tag_absent(tag)

    run(["uv", "run", "--no-sync", "python", "scripts/stamp_version.py", "--version", version])
    run(["git-cliff", "--tag", tag, "--output", "CHANGELOG.md"])
    ensure_trailing_newline(ROOT / "CHANGELOG.md")
    run(["mise", "run", "format"])
    run(["mise", "run", "lint"])
    run(["mise", "run", "typecheck"])
    run(["mise", "run", "check"])
    run(["mise", "run", "test"])
    run(["mise", "run", "test:gui"])
    run(["mise", "run", "test:gui:e2e"])
    run(["mise", "run", "python:release"])

    run(["git", "add", *RELEASE_FILES])
    if staged_diff_exists():
        run(["git", "commit", "-m", f"chore(release): {tag}"])
    run(["git", "tag", "-a", tag, "-m", f"Release {tag}"])


def ensure_clean() -> None:
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    if result.stdout.strip():
        raise RuntimeError("version:release requires a clean working tree")


def ensure_tag_absent(tag: str) -> None:
    result = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", f"refs/tags/{tag}"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        raise RuntimeError(f"tag {tag} already exists")


def next_release_version() -> str:
    result = subprocess.run(
        ["git-cliff", "--bumped-version"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip().removeprefix("v")


def staged_diff_exists() -> bool:
    result = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=ROOT)
    return result.returncode != 0


def run(command: list[str]) -> None:
    subprocess.run(command, cwd=ROOT, check=True)


def ensure_trailing_newline(path: Path) -> None:
    content = path.read_text(encoding="utf-8")
    normalized = f"{content.rstrip()}\n" if content else content
    if normalized != content:
        path.write_text(normalized, encoding="utf-8")


if __name__ == "__main__":
    main()
