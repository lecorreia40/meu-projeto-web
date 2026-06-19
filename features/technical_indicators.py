"""Basic technical indicators (pure Python, no numpy dependency).

Sprint 1 scope: simple returns, moving averages, and *placeholder* ATR and RSI
implementations. They are deliberately simple and clearly marked as placeholders
to be hardened (Wilder smoothing, vectorization) in Phase 2.

All functions return ``None`` when there is insufficient history, which the data
-quality / risk layers treat as a blocking condition rather than guessing.
"""

from __future__ import annotations

from data.market_schema import MarketBar


def closes(bars: list[MarketBar]) -> list[float]:
    return [b.close for b in bars]


def simple_returns(prices: list[float]) -> list[float]:
    """Period-over-period simple returns. Length is ``len(prices) - 1``."""
    if len(prices) < 2:
        return []
    out: list[float] = []
    for prev, cur in zip(prices, prices[1:]):
        if prev == 0:
            out.append(0.0)
        else:
            out.append((cur - prev) / prev)
    return out


def moving_average(prices: list[float], window: int) -> float | None:
    """Simple moving average over the last ``window`` prices."""
    if window <= 0 or len(prices) < window:
        return None
    return sum(prices[-window:]) / window


def sma_series(prices: list[float], window: int) -> list[float]:
    """Rolling SMA series (one value per fully-formed window)."""
    if window <= 0 or len(prices) < window:
        return []
    return [
        sum(prices[i : i + window]) / window
        for i in range(len(prices) - window + 1)
    ]


def rsi(prices: list[float], period: int = 14) -> float | None:
    """Relative Strength Index — PLACEHOLDER.

    Uses a simple average of gains/losses (not Wilder's smoothing). Returns a
    value in [0, 100], or ``None`` if there is insufficient history. To be
    replaced with a proper implementation in Phase 2.
    """
    if period <= 0 or len(prices) < period + 1:
        return None
    gains = 0.0
    losses = 0.0
    for prev, cur in zip(prices[-period - 1 : -1], prices[-period:]):
        change = cur - prev
        if change >= 0:
            gains += change
        else:
            losses -= change
    avg_gain = gains / period
    avg_loss = losses / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def atr(bars: list[MarketBar], period: int = 14) -> float | None:
    """Average True Range — PLACEHOLDER.

    Simple mean of the true range over the last ``period`` bars (no Wilder
    smoothing). Returns ``None`` if there is insufficient history.
    """
    if period <= 0 or len(bars) < period + 1:
        return None
    true_ranges: list[float] = []
    for prev, cur in zip(bars[-period - 1 : -1], bars[-period:]):
        tr = max(
            cur.high - cur.low,
            abs(cur.high - prev.close),
            abs(cur.low - prev.close),
        )
        true_ranges.append(tr)
    return sum(true_ranges) / len(true_ranges)
