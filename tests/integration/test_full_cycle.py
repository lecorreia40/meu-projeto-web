"""End-to-end: data -> agents -> memo -> signal -> backtest -> risk -> paper order."""

from __future__ import annotations

import pytest

from app.pipeline import TradingDeskPipeline
from data.universe import SYMBOLS
from execution.order_schema import ExecutionMode, OrderSide
from memos.memo_generator import is_memo_complete
from memos.memo_schema import MemoStatus


@pytest.fixture(scope="module")
def summary():
    pipeline = TradingDeskPipeline(seed=42, days=180)
    return pipeline.run(SYMBOLS)


def test_cycle_processes_every_symbol(summary) -> None:
    assert len(summary.records) == len(SYMBOLS)


def test_every_memo_includes_skeptic_view(summary) -> None:
    for r in summary.records:
        assert r.memo.skeptic_view.strip() != ""


def test_some_memos_complete_and_become_signals(summary) -> None:
    completed = [r for r in summary.records if r.memo.status is MemoStatus.COMPLETE]
    assert completed, "expected at least one COMPLETE memo"
    for r in completed:
        assert r.signal is not None  # COMPLETE memos always produce a signal


def test_all_signals_carry_required_risk_fields(summary) -> None:
    for r in summary.records:
        if r.signal is None:
            continue
        assert r.signal.stop_loss > 0
        assert r.signal.take_profit > 0
        assert r.signal.max_position_pct > 0
        assert r.signal.max_risk_pct > 0
        assert r.signal.time_horizon is not None


def test_paper_orders_are_risk_approved_and_paper_only(summary) -> None:
    for r in summary.paper_orders:
        assert r.decision is not None and r.decision.approved
        assert r.execution is not None
        assert r.execution.order.risk_approved is True
        assert r.execution.order.side is OrderSide.BUY            # long-only
        assert r.execution.fill.mode is ExecutionMode.PAPER       # never live
        assert r.execution.position.quantity == r.execution.fill.quantity
        assert r.signal is not None and r.signal.risk_status.value == "approved"


def test_blocked_paths_have_no_execution(summary) -> None:
    for r in summary.records:
        if r.stage in {"memo_rejected", "backtest_blocked", "risk_blocked"}:
            assert r.execution is None


def test_backtest_failure_blocks_signal(summary) -> None:
    # Any signal whose backtest failed must NOT be approved (requires_backtest=True).
    for r in summary.records:
        if r.backtest is not None and not r.backtest.passed:
            assert r.decision is None or not r.decision.approved


def test_complete_memos_pass_completeness_check(summary) -> None:
    for r in summary.records:
        if r.memo.status is MemoStatus.COMPLETE:
            assert is_memo_complete(r.memo)
