"""Data-quality and feature tests."""

from __future__ import annotations

import pytest

from data.ingestion.prices import MockPriceFeed
from features.liquidity import liquidity_score
from features.momentum import momentum
from features.technical_indicators import (
    atr,
    closes,
    moving_average,
    rsi,
    simple_returns,
)
from features.volatility import annualized_volatility, realized_volatility


@pytest.fixture
def bars():
    return MockPriceFeed(seed=7).fetch_bars("AAPL", days=120)


def test_mock_feed_is_deterministic() -> None:
    a = MockPriceFeed(seed=1).fetch_bars("MSFT", days=30)
    b = MockPriceFeed(seed=1).fetch_bars("MSFT", days=30)
    assert [bar.close for bar in a] == [bar.close for bar in b]


def test_returns_length(bars) -> None:
    prices = closes(bars)
    assert len(simple_returns(prices)) == len(prices) - 1


def test_moving_average_insufficient_history_returns_none() -> None:
    assert moving_average([100.0, 101.0], window=20) is None


def test_moving_average_value() -> None:
    assert moving_average([1.0, 2.0, 3.0, 4.0], window=4) == pytest.approx(2.5)


def test_rsi_placeholder_within_bounds(bars) -> None:
    value = rsi(closes(bars), period=14)
    assert value is not None
    assert 0.0 <= value <= 100.0


def test_rsi_insufficient_history_returns_none() -> None:
    assert rsi([100.0, 101.0, 102.0], period=14) is None


def test_atr_placeholder_positive(bars) -> None:
    value = atr(bars, period=14)
    assert value is not None
    assert value > 0


def test_atr_insufficient_history_returns_none() -> None:
    assert atr([], period=14) is None


def test_volatility_needs_two_points() -> None:
    assert realized_volatility([0.01]) is None
    assert realized_volatility([0.01, -0.02, 0.005]) is not None


def test_annualized_volatility_scales(bars) -> None:
    rets = simple_returns(closes(bars))
    daily = realized_volatility(rets)
    annual = annualized_volatility(rets)
    assert daily is not None and annual is not None
    assert annual > daily  # annualization scales up


def test_liquidity_score_in_range(bars) -> None:
    score = liquidity_score(bars)
    assert score is not None
    assert 0.0 <= score <= 1.0


def test_liquidity_score_empty_is_none() -> None:
    assert liquidity_score([]) is None


def test_momentum_basic() -> None:
    prices = [100.0, 101.0, 102.0, 103.0, 110.0]
    assert momentum(prices, lookback=4) == pytest.approx(0.10)
    assert momentum(prices, lookback=10) is None
