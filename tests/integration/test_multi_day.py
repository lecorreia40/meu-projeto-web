"""Multi-day simulation tests, including drawdown halting."""

from __future__ import annotations

import pytest

from app.multi_day import MultiDaySimulation
from risk.policy import RiskPolicy

SYMBOLS = ["SPY", "QQQ", "IWM", "DIA", "XLK", "XLF"]


@pytest.fixture(scope="module")
def result():
    return MultiDaySimulation(seed=42, days=120, warmup=60).run(SYMBOLS)


def test_simulation_walks_days_and_trades(result) -> None:
    assert result.days_traded == 60  # days(120) - warmup(60)
    assert result.n_entries > 0


def test_every_entry_eventually_exits(result) -> None:
    # Each entry produces exactly one round trip; nothing left open.
    assert result.open_remaining == 0
    assert result.n_exits == result.n_entries
    assert result.journal_stats["n_trades"] == result.n_entries


def test_metrics_are_reported(result) -> None:
    assert result.final_equity > 0
    assert result.max_drawdown_pct >= 0.0
    assert isinstance(result.total_return_pct, float)


def test_no_halt_under_normal_policy(result) -> None:
    # With the 2% daily / 5% weekly limits and normal mock data, the desk
    # should not breach the drawdown limits.
    assert result.halt_days == 0


def test_tight_policy_triggers_drawdown_halt() -> None:
    tight = RiskPolicy(max_daily_loss_pct=0.01, max_weekly_loss_pct=0.01)
    sim = MultiDaySimulation(seed=42, days=120, warmup=60, policy=tight)
    r = sim.run(SYMBOLS)
    # Any tiny loss now halts the desk and engages the kill switch.
    assert r.halt_days > 0
    assert sim.kill_switch.engaged is True


def test_halting_reduces_entries() -> None:
    normal = MultiDaySimulation(seed=42, days=120, warmup=60).run(SYMBOLS)
    tight = MultiDaySimulation(
        seed=42, days=120, warmup=60,
        policy=RiskPolicy(max_daily_loss_pct=0.01, max_weekly_loss_pct=0.01),
    ).run(SYMBOLS)
    # Halting on drawdown means fewer (or equal) new entries than the unhalted run.
    assert tight.n_entries <= normal.n_entries


def test_no_live_trading() -> None:
    sim = MultiDaySimulation(seed=3, days=100, warmup=60)
    sim.run(SYMBOLS)
    assert sim.broker.supports_live is False
    for fill in sim.broker.fills:
        assert fill.mode.value == "paper"
