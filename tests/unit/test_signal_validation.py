"""Tests for memo->signal conversion gates and risk-review readiness."""

from __future__ import annotations

import pytest

from agents.risk_analyst import RiskProposal
from core.enums import AssetType, Direction, TimeHorizon
from core.exceptions import MemoIncompleteError, SignalIncompleteError
from memos.memo_schema import InvestmentMemo, MemoStatus
from signals.signal_engine import SignalEngine, validate_ready_for_risk


def _risk_proposal() -> RiskProposal:
    return RiskProposal(
        entry_price=100.0, stop_loss=96.0, take_profit=110.0,
        max_position_pct=2.0, max_risk_pct=1.0, time_horizon=TimeHorizon.SWING,
        atr_used=2.0, reward_risk=2.5, rationale="test",
    )


def _memo(status: MemoStatus) -> InvestmentMemo:
    return InvestmentMemo(
        symbol="AAPL", asset_type=AssetType.STOCK, direction=Direction.LONG,
        thesis="t", catalyst="c", time_horizon=TimeHorizon.SWING,
        entry_logic="e", risk_summary="r", skeptic_view="bear case present",
        confidence_score=0.6, data_sources=["mock"], model_version="mock-llm-v1",
        prompt_version="1.0.0", status=status,
    )


# --- Task 6: incomplete memos cannot become signals -------------------------

def test_complete_memo_produces_signal_with_all_risk_fields() -> None:
    signal = SignalEngine().from_memo(_memo(MemoStatus.COMPLETE), _risk_proposal())
    # Hard constraint: signals must carry these five fields.
    assert signal.stop_loss > 0
    assert signal.take_profit > 0
    assert signal.max_position_pct > 0
    assert signal.max_risk_pct > 0
    assert signal.time_horizon is TimeHorizon.SWING


def test_draft_memo_cannot_become_signal() -> None:
    with pytest.raises(MemoIncompleteError):
        SignalEngine().from_memo(_memo(MemoStatus.DRAFT), _risk_proposal())


def test_rejected_memo_cannot_become_signal() -> None:
    with pytest.raises(MemoIncompleteError):
        SignalEngine().from_memo(_memo(MemoStatus.REJECTED), _risk_proposal())


def test_memo_blanked_field_cannot_become_signal() -> None:
    # A memo marked COMPLETE but with an empty skeptic_view must still be rejected.
    memo = _memo(MemoStatus.COMPLETE).model_copy(update={"skeptic_view": "   "})
    with pytest.raises(MemoIncompleteError):
        SignalEngine().from_memo(memo, _risk_proposal())


# --- Task 7: incomplete signals cannot go to risk review --------------------

def test_valid_signal_is_risk_ready() -> None:
    signal = SignalEngine().from_memo(_memo(MemoStatus.COMPLETE), _risk_proposal())
    validate_ready_for_risk(signal)  # should not raise


def test_signal_with_zeroed_risk_field_is_blocked_from_risk_review() -> None:
    signal = SignalEngine().from_memo(_memo(MemoStatus.COMPLETE), _risk_proposal())
    # Tamper post-construction (model_copy does not re-validate).
    tampered = signal.model_copy(update={"max_risk_pct": 0.0})
    with pytest.raises(SignalIncompleteError) as exc:
        validate_ready_for_risk(tampered)
    assert "max_risk_pct" in exc.value.missing
