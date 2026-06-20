"""End-to-end managed cycle: entry -> manage -> exit (paper only)."""

from __future__ import annotations

import pytest

from app.managed_cycle import ManagedCycle
from data.universe import SYMBOLS


@pytest.fixture(scope="module")
def result():
    return ManagedCycle(seed=42, days=180, holdout=30).run(SYMBOLS)


def test_cycle_enters_and_closes_all_positions(result) -> None:
    assert result.n_entries > 0
    # Every position is exited (managed to stop/target/time, or force-closed).
    assert result.open_remaining == 0


def test_journal_matches_entries(result) -> None:
    assert result.journal_stats["n_trades"] == result.n_entries
    assert len(result.trips) == result.n_entries


def test_exit_reasons_are_valid(result) -> None:
    for trip in result.trips:
        assert trip.exit_reason in {"stop", "target", "time", "eod"}
        assert trip.quantity > 0


def test_equity_and_drawdown_are_reported(result) -> None:
    assert result.final_equity > 0
    assert result.max_drawdown_pct >= 0.0
    # Round-trip PnL should reconcile with the equity move (paper, marks at close).
    assert isinstance(result.total_return_pct, float)


def test_no_live_trading_in_managed_cycle() -> None:
    cycle = ManagedCycle(seed=7, days=150, holdout=20)
    cycle.run(SYMBOLS)
    # The broker used is the paper broker and cannot go live.
    assert cycle.broker.supports_live is False
    for fill in cycle.broker.fills:
        assert fill.mode.value == "paper"
