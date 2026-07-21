from __future__ import annotations

import json
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory

from scenevis.api import app

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    committed_openapi = ROOT / "app" / "openapi.json"
    committed = json.loads(committed_openapi.read_text(encoding="utf-8"))
    if committed != app.openapi():
        raise RuntimeError("app/openapi.json is stale; run mise run contract:sync")

    with TemporaryDirectory(prefix="scenevis-contract-") as directory:
        generated = Path(directory) / "schema.ts"
        subprocess.run(
            [
                "pnpm",
                "--dir",
                "app",
                "exec",
                "openapi-typescript",
                "openapi.json",
                "-o",
                str(generated),
            ],
            cwd=ROOT,
            check=True,
        )
        committed_schema = ROOT / "app" / "src" / "shared" / "api" / "schema.ts"
        if committed_schema.read_text(encoding="utf-8") != generated.read_text(encoding="utf-8"):
            raise RuntimeError("generated API types are stale; run mise run contract:sync")


if __name__ == "__main__":
    main()
