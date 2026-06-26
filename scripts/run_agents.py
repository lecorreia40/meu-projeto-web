"""Run the agent swarm over the universe and print memo outcomes.

Usage:
    python scripts/run_agents.py [--seed 42] [--days 180]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents.orchestrator import OrchestratorAgent
from data.ingestion.prices import MockPriceFeed
from data.universe import SYMBOLS
from features.pipeline import build_feature_set
from memos.memo_schema import MemoStatus


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the agent swarm (mock LLM)")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--days", type=int, default=180)
    args = parser.parse_args()

    feed = MockPriceFeed(seed=args.seed)
    orchestrator = OrchestratorAgent()

    complete = 0
    print(f"{'SYMBOL':<8}{'STATUS':<10}{'NET':>7}{'CONF':>7}  SKEPTIC (truncated)")
    for symbol in SYMBOLS:
        bars = feed.fetch_bars(symbol, days=args.days)
        features = build_feature_set(symbol, bars)
        result = orchestrator.run(features)
        if result.memo.status is MemoStatus.COMPLETE:
            complete += 1
        print(
            f"{symbol:<8}{result.memo.status.value:<10}"
            f"{result.net_score:>7.2f}{result.aggregate_confidence:>7.2f}  "
            f"{result.skeptic_view[:46]}"
        )
    print(f"\nCOMPLETE memos: {complete}/{len(SYMBOLS)} "
          f"(all memos include a mandatory skeptic_view).")


if __name__ == "__main__":
    main()
