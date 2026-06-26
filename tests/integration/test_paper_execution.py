"""Paper execution safety tests (no live trading, ever)."""

from __future__ import annotations

import pytest

from core.exceptions import BrokerError, LiveTradingDisabledError, RiskBlockedError, ValidationError
from execution.order_manager import OrderManager
from execution.order_schema import ExecutionMode, Order, OrderSide, OrderType
from execution.order_validator import validate_order
from execution.paper_trading import PaperBroker
from risk.risk_engine import RiskEngine
from tests.conftest import make_context, make_signal


def _approved_decision(signal):
    return RiskEngine().evaluate(signal, make_context())


def test_paper_broker_cannot_go_live() -> None:
    assert PaperBroker().supports_live is False
    assert PaperBroker().is_connected() is True


def test_paper_broker_refuses_live_order() -> None:
    broker = PaperBroker()
    order = Order(
        signal_id="s1", symbol="AAPL", side=OrderSide.BUY,
        order_type=OrderType.MARKET, quantity=10, risk_approved=True,
        mode=ExecutionMode.LIVE,
    )
    with pytest.raises(BrokerError):
        broker.submit_order(order, mark_price=100.0)


def test_validator_rejects_unapproved_order() -> None:
    order = Order(
        signal_id="s1", symbol="AAPL", side=OrderSide.BUY,
        order_type=OrderType.MARKET, quantity=10, risk_approved=False,
    )
    with pytest.raises(ValidationError):
        validate_order(order)


def test_validator_rejects_live_when_disabled() -> None:
    order = Order(
        signal_id="s1", symbol="AAPL", side=OrderSide.BUY,
        order_type=OrderType.MARKET, quantity=10, risk_approved=True,
        mode=ExecutionMode.LIVE,
    )
    with pytest.raises(LiveTradingDisabledError):
        validate_order(order, live_trading_enabled=False)


def test_validator_rejects_sell_side_long_only() -> None:
    order = Order(
        signal_id="s1", symbol="AAPL", side=OrderSide.SELL,
        order_type=OrderType.MARKET, quantity=10, risk_approved=True,
    )
    with pytest.raises(ValidationError):
        validate_order(order)


def test_order_manager_refuses_blocked_signal() -> None:
    signal = make_signal(max_position_pct=9.0)  # oversized -> blocked
    decision = _approved_decision(signal)
    assert not decision.approved
    with pytest.raises(RiskBlockedError):
        OrderManager(PaperBroker()).build_order(signal, decision)


def test_order_manager_executes_approved_signal_as_paper() -> None:
    signal = make_signal()
    decision = _approved_decision(signal)
    assert decision.approved
    result = OrderManager(PaperBroker()).execute(signal, decision)
    assert result.order.risk_approved is True
    assert result.fill.mode is ExecutionMode.PAPER
    assert result.fill.quantity == result.position.quantity
    assert result.fill.quantity > 0
