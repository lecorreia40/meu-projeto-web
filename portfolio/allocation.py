"""Allocation / exposure helpers (paper)."""

from __future__ import annotations

from portfolio.positions import Position


def position_weights(
    positions: dict[str, Position], marks: dict[str, float], equity: float
) -> dict[str, float]:
    """Per-symbol weight (% of equity) using mark prices."""
    if equity <= 0:
        return {s: 0.0 for s in positions}
    out: dict[str, float] = {}
    for symbol, pos in positions.items():
        mark = marks.get(symbol, pos.avg_price)
        out[symbol] = pos.market_value(mark) / equity * 100.0
    return out


def gross_exposure_pct(
    positions: dict[str, Position], marks: dict[str, float], equity: float
) -> float:
    """Total invested exposure as a percentage of equity."""
    return sum(position_weights(positions, marks, equity).values())
