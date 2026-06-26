"""Pre-submission order validation.

The last deterministic gate before an order reaches a broker. It enforces the
non-negotiables: the order must be risk-approved, long-only (BUY) in the MVP,
positive quantity, and — critically — live orders are refused unless live
trading is explicitly enabled (it never is in the MVP).
"""

from __future__ import annotations

from core.exceptions import LiveTradingDisabledError, ValidationError
from execution.order_schema import ExecutionMode, Order, OrderSide


def validate_order(order: Order, *, live_trading_enabled: bool = False) -> None:
    """Raise if ``order`` must not be submitted."""
    if not order.risk_approved:
        raise ValidationError(
            f"order {order.order_id} is not risk-approved; refusing to submit"
        )
    if order.quantity <= 0:
        raise ValidationError(f"order {order.order_id} has non-positive quantity")
    if order.side is OrderSide.SELL and not order.is_close:
        # MVP is long-only: SELL is permitted only to CLOSE an existing long,
        # never to open or increase a short.
        raise ValidationError(
            f"order {order.order_id} is a SELL that does not close a long "
            "(short selling is not allowed in the MVP)"
        )
    if order.mode is ExecutionMode.LIVE and not live_trading_enabled:
        raise LiveTradingDisabledError(
            f"order {order.order_id} requested LIVE mode while live trading is disabled"
        )
