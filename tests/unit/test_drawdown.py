"""Deterministic drawdown evaluation tests."""

from __future__ import annotations

import pytest

from risk.drawdown import evaluate_drawdown
from risk.policy import RiskPolicy

POLICY = RiskPolicy()  # daily 2%, weekly 5%


def test_no_loss_is_not_halted() -> None:
    status = evaluate_drawdown(
        day_open_equity=100_000, week_open_equity=100_000,
        current_equity=100_000, policy=POLICY,
    )
    assert status.halted is False
    assert status.daily_loss_pct == 0.0
    assert status.reasons == []


def test_gains_clamp_loss_to_zero() -> None:
    status = evaluate_drawdown(
        day_open_equity=100_000, week_open_equity=100_000,
        current_equity=103_000, policy=POLICY,
    )
    assert status.daily_loss_pct == 0.0
    assert status.weekly_loss_pct == 0.0
    assert status.halted is False


def test_daily_loss_limit_halts() -> None:
    # 2.5% intraday loss > 2% daily limit.
    status = evaluate_drawdown(
        day_open_equity=100_000, week_open_equity=100_000,
        current_equity=97_500, policy=POLICY,
    )
    assert status.halt_daily is True
    assert status.halted is True
    assert "daily_loss_limit" in status.reasons


def test_weekly_loss_limit_halts() -> None:
    # 1% today (under daily 2%) but 6% on the week (> weekly 5%).
    status = evaluate_drawdown(
        day_open_equity=95_000, week_open_equity=100_000,
        current_equity=94_000, policy=POLICY,
    )
    assert status.halt_daily is False
    assert status.halt_weekly is True
    assert status.halted is True
    assert "weekly_loss_limit" in status.reasons


def test_exactly_at_limit_halts() -> None:
    status = evaluate_drawdown(
        day_open_equity=100_000, week_open_equity=100_000,
        current_equity=98_000, policy=POLICY,  # exactly 2%
    )
    assert status.halt_daily is True


def test_zero_open_equity_is_safe() -> None:
    status = evaluate_drawdown(
        day_open_equity=0.0, week_open_equity=0.0,
        current_equity=0.0, policy=POLICY,
    )
    assert status.halted is False
    assert status.daily_loss_pct == 0.0
