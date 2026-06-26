"""Wilder RSI / ATR tests."""

from __future__ import annotations

import pytest

from data.ingestion.prices import MockPriceFeed
from data.market_schema import MarketBar
from features.technical_indicators import atr, closes, rsi


def _bars(seed: int = 42, days: int = 120) -> list[MarketBar]:
    return MockPriceFeed(seed=seed).fetch_bars("AAPL", days=days)


def test_rsi_all_gains_is_100() -> None:
    prices = [float(p) for p in range(1, 40)]  # strictly increasing
    assert rsi(prices, period=14) == 100.0


def test_rsi_all_losses_near_zero() -> None:
    prices = [float(p) for p in range(40, 1, -1)]  # strictly decreasing
    value = rsi(prices, period=14)
    assert value is not None
    assert value < 1.0  # essentially 0 with all losses


def test_rsi_within_bounds_on_mock_data() -> None:
    value = rsi(closes(_bars()), period=14)
    assert value is not None
    assert 0.0 <= value <= 100.0


def test_rsi_insufficient_history() -> None:
    assert rsi([1.0, 2.0, 3.0], period=14) is None


def test_atr_positive_and_smoothed() -> None:
    bars = _bars()
    value = atr(bars, period=14)
    assert value is not None
    assert value > 0


def test_atr_insufficient_history() -> None:
    assert atr(_bars(days=5), period=14) is None


def test_rsi_wilder_known_value() -> None:
    # Classic worked example (Wilder): a specific 15-price series ~ RSI 70.46.
    prices = [
        44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42,
        45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28,
    ]
    value = rsi(prices, period=14)
    assert value is not None
    assert value == pytest.approx(70.46, abs=0.5)
