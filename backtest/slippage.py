"""Slippage and commission models for the backtest/paper simulator."""

from __future__ import annotations

from core.enums import Direction


def apply_slippage(price: float, direction: Direction, side: str, slippage_bps: float) -> float:
    """Adjust a fill price adversely by ``slippage_bps`` basis points.

    Buys fill slightly higher, sells slightly lower (you pay the spread).
    """
    factor = slippage_bps / 10_000.0
    if side == "entry":
        return price * (1 + factor) if direction is Direction.LONG else price * (1 - factor)
    # exit
    return price * (1 - factor) if direction is Direction.LONG else price * (1 + factor)


def commission(notional: float, commission_bps: float) -> float:
    """Flat per-fill commission as basis points of notional."""
    return abs(notional) * (commission_bps / 10_000.0)
