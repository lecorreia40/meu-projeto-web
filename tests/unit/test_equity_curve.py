"""Equity curve / drawdown tests."""

from __future__ import annotations

import pytest

from portfolio.equity_curve import EquityCurve


def test_total_return_and_last_equity() -> None:
    ec = EquityCurve(100_000.0)
    ec.record(101_000.0)
    ec.record(102_000.0)
    assert ec.last_equity == 102_000.0
    assert ec.total_return_pct() == pytest.approx(2.0)


def test_max_drawdown() -> None:
    ec = EquityCurve(100_000.0)
    for equity in (110_000.0, 105_000.0, 99_000.0, 108_000.0):
        ec.record(equity)
    # Peak 110k, trough 99k -> drawdown = 10%.
    assert ec.max_drawdown_pct() == pytest.approx(10.0, abs=1e-6)


def test_no_drawdown_when_monotonic() -> None:
    ec = EquityCurve(100_000.0)
    for equity in (101_000.0, 102_000.0, 103_000.0):
        ec.record(equity)
    assert ec.max_drawdown_pct() == 0.0


def test_daily_returns_length() -> None:
    ec = EquityCurve(100_000.0)
    ec.record(101_000.0)
    ec.record(100_000.0)
    rets = ec.daily_returns_pct()
    assert len(rets) == 2
    assert rets[0] == pytest.approx(1.0)
