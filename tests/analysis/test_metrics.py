import math

import numpy as np
import pytest

from scenevis.analysis.metrics import (
    fraction_below,
    fraction_clipped,
    michelson,
    statistics,
    stops,
    weber,
)


def test_dynamic_range() -> None:
    assert stops(0.64, 0.01, epsilon=1e-9) == pytest.approx(6.0)


def test_contrast() -> None:
    assert weber(0.03, 0.02, epsilon=1e-9) == pytest.approx(0.5)
    assert michelson(0.03, 0.02, epsilon=1e-9) == pytest.approx(0.2)


def test_threshold_fractions() -> None:
    values = np.asarray([0.0, 0.005, 0.01, 0.99, 1.0], dtype=np.float32)
    assert fraction_below(values, 0.01) == pytest.approx(0.4)
    assert fraction_clipped(values, 0.99) == pytest.approx(0.4)


def test_robust_noise() -> None:
    values = np.asarray([1.0, 2.0, 3.0, 4.0, 100.0], dtype=np.float32)
    result = statistics(values, epsilon=1e-9)
    assert result.median == pytest.approx(3.0)
    assert result.robust_sigma == pytest.approx(1.4826)
    assert math.isfinite(result.standard_deviation)
