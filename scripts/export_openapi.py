from __future__ import annotations

import json
from pathlib import Path

from scenevis.api import app

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    output = ROOT / "app" / "openapi.json"
    output.write_text(json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
