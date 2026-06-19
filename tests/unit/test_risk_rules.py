"""Risk-engine tests.

These are the heart of Sprint 1's safety guarantees: they prove that the
deterministic risk engine APPROVES a well-formed trade and BLOCKS every
disallowed or unsafe condition from the specification's must-block list.
"""

from __future__ import annotations

import pytest

from core.enums import Direction
from risk.risk_engine import RiskEngine
from risk.rules import BlockReason
from signals.signal_schema import RiskStatus
from tests.conftest import make_context, make_signal


@pytest.fixture
def engine() -> RiskEngine:
    return RiskEngine()


# --- Happy path --------------------------------------------------------------

def test_well_formed_signal_is_approved(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(), make_context())
    assert decision.approved is True
    assert decision.reasons == []
    assert decision.sizing is not None
    assert decision.sizing.shares > 0
    # Computed position respects the 2% cap.
    assert decision.sizing.position_pct <= 2.0 + 1e-9


def test_evaluate_and_mark_sets_status(engine: RiskEngine) -> None:
    updated, decision = engine.evaluate_and_mark(make_signal(), make_context())
    assert decision.approved is True
    assert updated.risk_status is RiskStatus.APPROVED


# --- Oversized / over-risk trades -------------------------------------------

def test_oversized_position_request_is_blocked(engine: RiskEngine) -> None:
    # Requesting 5% position when the policy cap is 2%.
    decision = engine.evaluate(make_signal(max_position_pct=5.0), make_context())
    assert decision.blocked
    assert BlockReason.POSITION_SIZE_EXCEEDED in decision.reasons


def test_excessive_risk_per_trade_is_blocked(engine: RiskEngine) -> None:
    # Requesting 3% risk/trade when the policy cap is 1%.
    decision = engine.evaluate(make_signal(max_risk_pct=3.0), make_context())
    assert decision.blocked
    assert BlockReason.RISK_PER_TRADE_EXCEEDED in decision.reasons


# --- Incomplete / invalid signal --------------------------------------------

def test_missing_required_field_is_blocked(engine: RiskEngine) -> None:
    # A signal whose memo_id was blanked out post-construction.
    signal = make_signal().model_copy(update={"memo_id": ""})
    decision = engine.evaluate(signal, make_context())
    assert decision.blocked
    assert BlockReason.MISSING_REQUIRED_FIELDS in decision.reasons


def test_symbol_outside_universe_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(symbol="GME"), make_context())
    assert decision.blocked
    assert BlockReason.NOT_IN_UNIVERSE in decision.reasons


# --- Disallowed capabilities (MVP scope) ------------------------------------

def test_short_direction_is_blocked(engine: RiskEngine) -> None:
    # A short signal (geometry adjusted so it passes schema validation).
    signal = make_signal(
        direction=Direction.SHORT, stop_loss=102.0, take_profit=94.0
    )
    decision = engine.evaluate(signal, make_context())
    assert decision.blocked
    assert BlockReason.SHORT_NOT_ALLOWED in decision.reasons


def test_leverage_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(), make_context(is_leveraged=True))
    assert BlockReason.LEVERAGE_NOT_ALLOWED in decision.reasons


def test_options_and_crypto_are_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(
        make_signal(), make_context(is_option=True, is_crypto=True)
    )
    assert BlockReason.OPTIONS_NOT_ALLOWED in decision.reasons
    assert BlockReason.CRYPTO_NOT_ALLOWED in decision.reasons


# --- Data quality / market microstructure gates -----------------------------

def test_insufficient_history_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(), make_context(price_history_bars=10))
    assert BlockReason.INSUFFICIENT_HISTORY in decision.reasons


def test_low_liquidity_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(), make_context(liquidity_score=0.1))
    assert BlockReason.LOW_LIQUIDITY in decision.reasons


def test_high_spread_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(), make_context(spread_pct=2.0))
    assert BlockReason.HIGH_SPREAD in decision.reasons


def test_data_quality_failure_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(), make_context(data_quality_ok=False))
    assert BlockReason.DATA_QUALITY_FAILURE in decision.reasons


def test_backtest_failure_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(), make_context(backtest_passed=False))
    assert BlockReason.BACKTEST_FAILURE in decision.reasons


# --- Portfolio / drawdown / exposure ----------------------------------------

def test_max_open_positions_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(), make_context(open_positions=3))
    assert BlockReason.MAX_OPEN_POSITIONS in decision.reasons


def test_daily_loss_limit_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(), make_context(daily_loss_pct=2.5))
    assert BlockReason.DAILY_LOSS_LIMIT in decision.reasons


def test_weekly_loss_limit_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(), make_context(weekly_loss_pct=6.0))
    assert BlockReason.WEEKLY_LOSS_LIMIT in decision.reasons


def test_total_exposure_is_blocked(engine: RiskEngine) -> None:
    # Already near the 20% cap; this 2% trade pushes it over.
    decision = engine.evaluate(make_signal(), make_context(current_exposure_pct=19.0))
    assert BlockReason.MAX_TOTAL_EXPOSURE in decision.reasons


# --- Broker / live-trading / LLM / earnings ---------------------------------

def test_broker_disconnected_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(), make_context(broker_connected=False))
    assert BlockReason.BROKER_DISCONNECTED in decision.reasons


def test_unapproved_live_trading_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(
        make_signal(),
        make_context(live_trading_requested=True, live_trading_enabled=False),
    )
    assert BlockReason.LIVE_TRADING_NOT_APPROVED in decision.reasons


def test_llm_uncertainty_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(), make_context(llm_confident=False))
    assert BlockReason.LLM_UNCERTAIN in decision.reasons


def test_earnings_window_is_blocked(engine: RiskEngine) -> None:
    decision = engine.evaluate(make_signal(), make_context(in_earnings_window=True))
    assert BlockReason.EARNINGS_WINDOW in decision.reasons


# --- Multiple simultaneous problems are all reported ------------------------

def test_multiple_block_reasons_are_collected(engine: RiskEngine) -> None:
    decision = engine.evaluate(
        make_signal(max_position_pct=9.0, max_risk_pct=5.0),
        make_context(broker_connected=False, data_quality_ok=False),
    )
    assert decision.blocked
    for reason in (
        BlockReason.POSITION_SIZE_EXCEEDED,
        BlockReason.RISK_PER_TRADE_EXCEEDED,
        BlockReason.BROKER_DISCONNECTED,
        BlockReason.DATA_QUALITY_FAILURE,
    ):
        assert reason in decision.reasons
    # No duplicates in the audit trail.
    assert len(decision.reasons) == len(set(decision.reasons))
