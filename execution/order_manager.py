"""Order manager: turn a risk-APPROVED signal into a (paper) fill and position.

This is the only place an order is built from a signal, and it refuses to do so
unless the deterministic risk engine approved it. ``risk_approved`` is set here
solely from :class:`RiskDecision.approved` — never by an agent, never by hand.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from core.exceptions import RiskBlockedError
from execution.broker_interface import BrokerInterface
from execution.fill_handler import position_from_fill
from execution.order_schema import ExecutionMode, Fill, Order, OrderSide, OrderStatus, OrderType
from execution.order_validator import validate_order
from portfolio.positions import Position
from risk.risk_engine import RiskDecision
from signals.signal_schema import TradingSignal


class ExecutionResult(BaseModel):
    model_config = ConfigDict(frozen=True)

    order: Order
    fill: Fill
    position: Position


class OrderManager:
    """Builds, validates, submits (paper), and books an approved signal."""

    def __init__(self, broker: BrokerInterface, *, live_trading_enabled: bool = False) -> None:
        self._broker = broker
        self._live_trading_enabled = live_trading_enabled

    def build_order(self, signal: TradingSignal, decision: RiskDecision) -> Order:
        if not decision.approved:
            raise RiskBlockedError(
                f"cannot build order: signal {signal.signal_id} was blocked",
                reasons=decision.reason_values,
            )
        if decision.sizing is None or decision.sizing.shares <= 0:
            raise RiskBlockedError(
                f"cannot build order: zero approved size for {signal.signal_id}",
                reasons=["computed_position_size_zero"],
            )
        return Order(
            signal_id=signal.signal_id,
            symbol=signal.symbol,
            side=OrderSide.BUY,                 # long-only MVP
            order_type=OrderType.MARKET,
            quantity=decision.sizing.shares,
            limit_price=signal.entry_price,
            risk_approved=True,                 # set ONLY from the risk decision
            mode=ExecutionMode.PAPER,           # paper-only
        )

    def execute(self, signal: TradingSignal, decision: RiskDecision) -> ExecutionResult:
        """Full paper path: build -> validate -> submit -> book position."""
        order = self.build_order(signal, decision)
        validate_order(order, live_trading_enabled=self._live_trading_enabled)

        fill = self._broker.submit_order(order, mark_price=signal.entry_price)
        booked = order.model_copy(update={"status": OrderStatus.FILLED})
        position = position_from_fill(fill)
        return ExecutionResult(order=booked, fill=fill, position=position)
