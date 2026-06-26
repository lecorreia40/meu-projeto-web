"""Run mock market-data ingestion for the MVP universe.

Usage:
    python scripts/run_ingestion.py [--days 120] [--seed 42]

Sprint 1: this uses the deterministic mock feed only. No external data vendor or
broker is contacted.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Allow running directly (`python scripts/run_ingestion.py`) by ensuring the
# repository root is importable.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from data.ingestion.prices import MockPriceFeed, ingest_universe
from data.market_schema import MarketBar
from data.storage.memory import InMemoryTimeSeriesRepository
from features.liquidity import liquidity_score
from features.technical_indicators import atr, closes, moving_average, rsi


def main() -> None:
    parser = argparse.ArgumentParser(description="Mock market-data ingestion")
    parser.add_argument("--days", type=int, default=120)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    repo: InMemoryTimeSeriesRepository[MarketBar] = InMemoryTimeSeriesRepository()
    counts = ingest_universe(repo, feed=MockPriceFeed(seed=args.seed), days=args.days)

    total = sum(counts.values())
    print(f"Ingested {total} bars across {len(counts)} symbols (mock feed).\n")
    print(f"{'SYMBOL':<8}{'BARS':>6}{'CLOSE':>12}{'SMA20':>12}{'RSI14':>10}{'ATR14':>10}{'LIQ':>8}")
    for symbol in counts:
        bars = repo.get_bars(symbol)
        prices = closes(bars)
        sma = moving_average(prices, 20)
        r = rsi(prices, 14)
        a = atr(bars, 14)
        liq = liquidity_score(bars)
        print(
            f"{symbol:<8}{len(bars):>6}{prices[-1]:>12.2f}"
            f"{(sma if sma is not None else float('nan')):>12.2f}"
            f"{(r if r is not None else float('nan')):>10.1f}"
            f"{(a if a is not None else float('nan')):>10.2f}"
            f"{(liq if liq is not None else float('nan')):>8.2f}"
        )


if __name__ == "__main__":
    main()
