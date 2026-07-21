from __future__ import annotations

import signal
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    processes = [
        subprocess.Popen(
            ["uv", "run", "--no-sync", "uvicorn", "scenevis.api:app", "--reload", "--port", "8765"],
            cwd=ROOT,
        ),
        subprocess.Popen(["pnpm", "--dir", "app", "dev"], cwd=ROOT),
    ]

    def stop(_signum: int, _frame: object) -> None:
        for process in processes:
            process.terminate()

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    try:
        while all(process.poll() is None for process in processes):
            time.sleep(0.2)
        exit_code = next(
            process.returncode for process in processes if process.returncode is not None
        )
    finally:
        for process in processes:
            if process.poll() is None:
                process.terminate()
        for process in processes:
            process.wait()
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
