"""IBKR paper adapter scaffold — must be disconnected and fail-closed."""

from __future__ import annotations

import pytest

from core.exceptions import BrokerError
from execution.ibkr_client import IBKRPaperBroker
from execution.order_schema import ExecutionMode, Order, OrderSide, OrderType


def _order() -> Order:
    return Order(
        signal_id="s1", symbol="AAPL", side=OrderSide.BUY,
        order_type=OrderType.MARKET, quantity=10, risk_approved=True,
        mode=ExecutionMode.PAPER,
    )


def test_ibkr_is_disconnected_by_default() -> None:
    broker = IBKRPaperBroker()
    assert broker.is_connected() is False
    assert broker.supports_live is False
    assert broker.name == "ibkr-paper"


def test_ibkr_connect_not_implemented_in_mvp() -> None:
    with pytest.raises(NotImplementedError):
        IBKRPaperBroker().connect()


def test_ibkr_submit_refuses_when_disconnected() -> None:
    with pytest.raises(BrokerError):
        IBKRPaperBroker().submit_order(_order(), mark_price=100.0)
