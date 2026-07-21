from scenevis import Regions, __version__


def test_version_exposed() -> None:
    assert __version__ == "0.1.0"
    assert Regions.model_fields.keys() == {"target", "local_background", "bright_background"}
