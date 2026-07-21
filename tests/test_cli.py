import sys

import pytest

from scenevis import cli


def test_starts_local_app(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[object] = []
    monkeypatch.setattr(sys, "argv", ["scenevis", "--port", "9001", "--no-browser"])
    monkeypatch.setattr(cli.uvicorn, "run", lambda *args, **kwargs: calls.append((args, kwargs)))

    cli.main()

    assert calls == [(("scenevis.api:app",), {"host": "127.0.0.1", "port": 9001})]
