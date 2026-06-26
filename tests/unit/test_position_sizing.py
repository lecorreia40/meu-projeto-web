"""Position-sizing tests."""

from __future__ import annotations

import pytest

from risk.policy import MVP_RISK_POLICY
from risk.position_sizing import compute_position_size
from tests.conftest import make_signal


def test_size_is_capped_by_position_limit() -> None:
    # entry=100, stop=98 -> risk/share=2. 1% of 100k = $1,000 risk -> 500 shares
    # = $50,000 notional, but the 2% cap allows only $2,000 -> 20 shares.
    signal = make_signal(entry_price=100.0, stop_loss=98.0, max_risk_pct=1.0)
    sizing = compute_position_size(signal, 100_000.0, MVP_RISK_POLICY)
    assert sizing.capped_by_position_limit is True
    assert sizing.shares == 20
    assert sizing.notional == pytest.approx(2_000.0)
    assert sizing.position_pct == pytest.approx(2.0)


def test_risk_based_size_when_below_position_cap() -> None:
    # Wide stop so the risk-based size stays under the 2% notional cap.
    # entry=100, stop=50 -> risk/share=50. 1% of 100k = $1,000 -> 20 shares
    # = $2,000 notional = exactly the 2% cap (not exceeded).
    signal = make_signal(entry_price=100.0, stop_loss=50.0, take_profit=160.0)
    sizing = compute_position_size(signal, 100_000.0, MVP_RISK_POLICY)
    assert sizing.shares == 20
    assert sizing.risk_pct_of_equity <= MVP_RISK_POLICY.max_risk_per_trade_pct + 1e-9


def test_zero_equity_yields_zero_size() -> None:
    sizing = compute_position_size(make_signal(), 0.0, MVP_RISK_POLICY)
    assert sizing.shares == 0
    assert sizing.notional == 0.0


def test_effective_risk_uses_more_conservative_value() -> None:
    # Signal requests only 0.5% risk; policy allows 1%. Use 0.5%.
    signal = make_signal(entry_price=100.0, stop_loss=90.0, max_risk_pct=0.5)
    sizing = compute_position_size(signal, 100_000.0, MVP_RISK_POLICY)
    # 0.5% of 100k = $500 risk; risk/share = 10 -> 50 shares -> $5,000 notional,
    # capped to 2% ($2,000) -> 20 shares.
    assert sizing.shares == 20
    assert sizing.capped_by_position_limit is True
