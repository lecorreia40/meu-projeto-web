"""Profit-and-loss helpers (paper)."""

from __future__ import annotations

from portfolio.positions import Position


def unrealized_pnl(positions: dict[str, Position], marks: dict[str, float]) -> float:
    """Sum of unrealized PnL across positions for which a mark is available."""
    total = 0.0
    for symbol, pos in positions.items():
        mark = marks.get(symbol)
        if mark is not None:
            total += pos.unrealized_pnl(mark)
    return total


def positions_market_value(positions: dict[str, Position], marks: dict[str, float]) -> float:
    total = 0.0
    for symbol, pos in positions.items():
        mark = marks.get(symbol, pos.avg_price)
        total += pos.market_value(mark)
    return total


def realized_pnl_on_close(position: Position, exit_price: float, quantity: int) -> float:
    """Realized PnL from closing ``quantity`` shares of a long position."""
    quantity = min(quantity, position.quantity)
    return (exit_price - position.avg_price) * quantity
