"""Mock market-data ingestion.

Sprint 1 does NOT connect to any external data vendor or broker. This module
generates deterministic, reproducible synthetic OHLCV bars (a seeded random
walk) for the MVP universe so the rest of the pipeline — features, memos,
signals, risk — can be exercised end to end offline.

All price feeds (mock or real) implement :class:`PriceFeed`, so a real vendor
adapter can be dropped in later without changing callers.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone
from typing import Protocol

from data.market_schema import MarketBar
from data.storage.base import TimeSeriesRepository
from data.universe import SYMBOLS


class PriceFeed(Protocol):
    """Interface every price source must satisfy."""

    def fetch_bars(self, symbol: str, *, days: int) -> list[MarketBar]: ...


# Deterministic per-symbol starting prices so runs are reproducible.
_BASE_PRICES: dict[str, float] = {
    "SPY": 500.0, "QQQ": 430.0, "IWM": 200.0, "DIA": 380.0,
    "XLK": 200.0, "XLF": 40.0, "XLE": 90.0, "XLI": 120.0,
    "XLV": 145.0, "XLY": 180.0, "XLP": 75.0,
    "AAPL": 190.0, "MSFT": 410.0, "NVDA": 120.0, "AMZN": 180.0,
    "META": 480.0, "GOOGL": 165.0, "TSLA": 250.0, "JPM": 200.0,
    "V": 275.0, "MA": 460.0,
}


class MockPriceFeed:
    """A deterministic synthetic OHLCV generator.

    The same ``seed`` always yields the same bars, which keeps ingestion,
    features, and tests reproducible.
    """

    def __init__(self, *, seed: int = 42, daily_vol: float = 0.012) -> None:
        self._seed = seed
        self._daily_vol = daily_vol

    def fetch_bars(self, symbol: str, *, days: int = 120) -> list[MarketBar]:
        base = _BASE_PRICES.get(symbol, 100.0)
        # Symbol-scoped RNG so each symbol is independent yet reproducible.
        rng = random.Random(f"{self._seed}:{symbol}")
        start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        ) - timedelta(days=days)

        bars: list[MarketBar] = []
        prev_close = base
        for i in range(days):
            ts = start + timedelta(days=i)
            drift = rng.gauss(0.0, self._daily_vol)
            open_ = prev_close
            close = max(0.01, open_ * (1.0 + drift))
            intrabar = abs(rng.gauss(0.0, self._daily_vol)) * open_
            high = max(open_, close) + intrabar
            low = max(0.01, min(open_, close) - intrabar)
            volume = int(rng.uniform(1_000_000, 8_000_000))
            bars.append(
                MarketBar(
                    symbol=symbol,
                    timestamp=ts,
                    open=round(open_, 2),
                    high=round(high, 2),
                    low=round(low, 2),
                    close=round(close, 2),
                    volume=volume,
                )
            )
            prev_close = close
        return bars


def ingest_universe(
    repo: TimeSeriesRepository[MarketBar],
    *,
    feed: PriceFeed | None = None,
    symbols: list[str] | None = None,
    days: int = 120,
) -> dict[str, int]:
    """Ingest mock bars for the whole universe into ``repo``.

    Returns a mapping ``symbol -> bars_ingested``.
    """
    feed = feed or MockPriceFeed()
    symbols = symbols or SYMBOLS
    counts: dict[str, int] = {}
    for symbol in symbols:
        bars = feed.fetch_bars(symbol, days=days)
        counts[symbol] = repo.add_bars(symbol, bars)
    return counts
