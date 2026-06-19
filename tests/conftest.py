"""Shared test fixtures."""

from __future__ import annotations

import pytest

from core.enums import Direction, TimeHorizon
from risk.policy import MVP_RISK_POLICY, RiskPolicy
from risk.rules import RiskContext
from signals.signal_schema import EntryType, TradingSignal


def make_signal(**overrides: object) -> TradingSignal:
    """Build a well-formed LONG signal on an in-universe symbol.

    Defaults are chosen so that, paired with :func:`make_context`, the risk
    engine APPROVES the trade. Individual tests override one field to exercise a
    specific block.
    """
    params: dict[str, object] = dict(
        memo_id="memo_test_0001",
        symbol="AAPL",
        direction=Direction.LONG,
        entry_type=EntryType.LIMIT,
        entry_price=100.0,
        stop_loss=98.0,
        take_profit=106.0,
        max_position_pct=2.0,
        max_risk_pct=1.0,
        time_horizon=TimeHorizon.SWING,
        confidence_score=0.7,
        requires_backtest=True,
    )
    params.update(overrides)
    return TradingSignal(**params)  # type: ignore[arg-type]


def make_context(**overrides: object) -> RiskContext:
    """A healthy runtime context (everything passes by default)."""
    return RiskContext(**overrides)  # type: ignore[arg-type]


@pytest.fixture
def valid_signal() -> TradingSignal:
    return make_signal()


@pytest.fixture
def healthy_context() -> RiskContext:
    return make_context()


@pytest.fixture
def policy() -> RiskPolicy:
    return MVP_RISK_POLICY
