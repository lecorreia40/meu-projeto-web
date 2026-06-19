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
    """Relative Strength Index using Wilder's smoothing.

    Seeds the average gain/loss with a simple mean over the first ``period``
    changes, then applies Wilder's recursive smoothing across the remaining
    series. Returns a value in [0, 100], or ``None`` if there is insufficient
    history.
    """
    if period <= 0 or len(prices) < period + 1:
        return None

    changes = [cur - prev for prev, cur in zip(prices, prices[1:])]
    gains = [max(c, 0.0) for c in changes]
    losses = [max(-c, 0.0) for c in changes]

    # Wilder seed: simple average of the first `period` values.
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    # Recursive smoothing over the rest of the series.
    for g, l in zip(gains[period:], losses[period:]):
        avg_gain = (avg_gain * (period - 1) + g) / period
        avg_loss = (avg_loss * (period - 1) + l) / period

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def atr(bars: list[MarketBar], period: int = 14) -> float | None:
    """Average True Range using Wilder's smoothing.

    Seeds with the simple mean of the first ``period`` true ranges, then applies
    Wilder's recursive smoothing. Returns ``None`` if there is insufficient
    history.
    """
    if period <= 0 or len(bars) < period + 1:
        return None

    true_ranges: list[float] = []
    for prev, cur in zip(bars, bars[1:]):
        true_ranges.append(
            max(
                cur.high - cur.low,
                abs(cur.high - prev.close),
                abs(cur.low - prev.close),
            )
        )

    # Wilder seed then recursive smoothing.
    avg = sum(true_ranges[:period]) / period
    for tr in true_ranges[period:]:
        avg = (avg * (period - 1) + tr) / period
    return avg
