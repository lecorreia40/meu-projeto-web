"""Liquidity features.

The liquidity score is a normalized 0..1 proxy based on average daily dollar
volume. The risk engine uses it as a gate (``min_liquidity_score``): illiquid
candidates are blocked.
"""

from __future__ import annotations

from data.market_schema import MarketBar

# Average daily dollar volume (USD) that maps to a "fully liquid" score of 1.0.
# $50M/day is comfortably liquid for the large-cap MVP universe.
_FULL_LIQUIDITY_ADV = 50_000_000.0


def average_dollar_volume(bars: list[MarketBar], window: int = 20) -> float | None:
    """Average of ``close * volume`` over the last ``window`` bars."""
    if not bars or window <= 0:
        return None
    sample = bars[-window:]
    if not sample:
        return None
    return sum(b.close * b.volume for b in sample) / len(sample)


def liquidity_score(bars: list[MarketBar], window: int = 20) -> float | None:
    """Normalized liquidity score in [0, 1].

    Returns ``None`` when there is no data to assess (treated as a block).
    """
    adv = average_dollar_volume(bars, window=window)
    if adv is None:
        return None
    return max(0.0, min(1.0, adv / _FULL_LIQUIDITY_ADV))
