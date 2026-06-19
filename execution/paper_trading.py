"""Paper-trading broker.

A simulated broker that fills orders against a provided mark price plus modeled
slippage and commission. It is **structurally incapable of live trading**:
``supports_live`` is ``False`` and it refuses any order whose mode is LIVE. No
network, no real money, no external broker.
"""

from __future__ import annotations

from backtest.slippage import apply_slippage, commission
from core.enums import Direction
from core.exceptions import BrokerError
from execution.broker_interface import BrokerInterface
from execution.order_schema import ExecutionMode, Fill, Order, OrderSide


class PaperBroker(BrokerInterface):
    """In-process paper broker for the MVP."""

    def __init__(self, *, slippage_bps: float = 5.0, commission_bps: float = 1.0) -> None:
        self._slippage_bps = slippage_bps
        self._commission_bps = commission_bps
        self._fills: list[Fill] = []

    @property
    def name(self) -> str:
        return "paper"

    @property
    def supports_live(self) -> bool:
        return False

    def is_connected(self) -> bool:
        return True

    def submit_order(self, order: Order, *, mark_price: float) -> Fill:
        if order.mode is ExecutionMode.LIVE:
            raise BrokerError("PaperBroker cannot execute LIVE orders")
        if not order.risk_approved:
            raise BrokerError(f"order {order.order_id} is not risk-approved")

        direction = Direction.LONG if order.side is OrderSide.BUY else Direction.SHORT
        fill_price = apply_slippage(mark_price, direction, "entry", self._slippage_bps)
        comm = commission(order.quantity * fill_price, self._commission_bps)

        fill = Fill(
            order_id=order.order_id,
            signal_id=order.signal_id,
            symbol=order.symbol,
            side=order.side,
            quantity=order.quantity,
            fill_price=round(fill_price, 4),
            commission=round(comm, 4),
            mode=ExecutionMode.PAPER,
        )
        self._fills.append(fill)
        return fill

    @property
    def fills(self) -> list[Fill]:
        return list(self._fills)
