"""Momentum features (pure Python)."""

from __future__ import annotations


def momentum(prices: list[float], lookback: int) -> float | None:
    """Total return over ``lookback`` periods, i.e. P_t / P_{t-lookback} - 1."""
    if lookback <= 0 or len(prices) <= lookback:
        return None
    past = prices[-lookback - 1]
    if past == 0:
        return None
    return prices[-1] / past - 1.0


def rate_of_change_pct(prices: list[float], lookback: int) -> float | None:
    """Momentum expressed as a percentage."""
    m = momentum(prices, lookback)
    return None if m is None else m * 100.0
