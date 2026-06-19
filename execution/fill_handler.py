"""Turn fills into portfolio positions."""

from __future__ import annotations

from execution.order_schema import Fill, OrderSide
from portfolio.positions import Position


def position_from_fill(fill: Fill) -> Position:
    """Build a new long :class:`Position` from a BUY fill."""
    if fill.side is not OrderSide.BUY:
        raise ValueError("MVP fill handler only opens long positions from BUY fills")
    return Position(
        symbol=fill.symbol,
        quantity=fill.quantity,
        avg_price=fill.fill_price,
    )
