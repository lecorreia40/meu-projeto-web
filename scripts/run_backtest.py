"""Generate signals from COMPLETE memos and backtest them.

Usage:
    python scripts/run_backtest.py [--seed 42] [--days 180]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents.orchestrator import OrchestratorAgent
from backtest.engine import BacktestEngine
from backtest.reports import format_result
from data.ingestion.prices import MockPriceFeed
from data.universe import SYMBOLS
from features.pipeline import build_feature_set
from memos.memo_schema import MemoStatus
from signals.signal_engine import SignalEngine


def main() -> None:
    parser = argparse.ArgumentParser(description="Backtest signals from memos")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--days", type=int, default=180)
    args = parser.parse_args()

    feed = MockPriceFeed(seed=args.seed)
    orchestrator = OrchestratorAgent()
    engine = SignalEngine()
    backtester = BacktestEngine()

    passed = 0
    total = 0
    for symbol in SYMBOLS:
        bars = feed.fetch_bars(symbol, days=args.days)
        features = build_feature_set(symbol, bars)
        result = orchestrator.run(features)
        if result.memo.status is not MemoStatus.COMPLETE:
            continue
        signal = engine.from_memo(result.memo, result.risk_proposal)
        bt = backtester.run(signal, bars)
        total += 1
        passed += int(bt.passed)
        print(format_result(bt))
        print("-" * 60)

    print(f"\nBacktests: {passed}/{total} passed the gate.")


if __name__ == "__main__":
    main()
