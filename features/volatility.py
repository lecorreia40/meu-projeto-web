"""Volatility features (pure Python)."""

from __future__ import annotations

import math

_TRADING_DAYS = 252


def stdev(values: list[float]) -> float | None:
    """Sample standard deviation; ``None`` if fewer than 2 values."""
    n = len(values)
    if n < 2:
        return None
    mean = sum(values) / n
    var = sum((v - mean) ** 2 for v in values) / (n - 1)
    return math.sqrt(var)


def realized_volatility(returns: list[float]) -> float | None:
    """Standard deviation of period returns (per-period volatility)."""
    return stdev(returns)


def annualized_volatility(returns: list[float], periods_per_year: int = _TRADING_DAYS) -> float | None:
    """Annualized volatility from daily returns."""
    vol = stdev(returns)
    if vol is None:
        return None
    return vol * math.sqrt(periods_per_year)
