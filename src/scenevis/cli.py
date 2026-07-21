from __future__ import annotations

import argparse
import threading
import webbrowser

import uvicorn


def main() -> None:
    """Start the local Scenevis application."""

    arguments = _arguments()
    url = f"http://{arguments.host}:{arguments.port}"
    if not arguments.no_browser:
        threading.Timer(0.8, webbrowser.open, args=(url,)).start()
    uvicorn.run("scenevis.api:app", host=arguments.host, port=arguments.port)


def _arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Open the Scenevis image-analysis application.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8765, type=int)
    parser.add_argument("--no-browser", action="store_true")
    return parser.parse_args()
