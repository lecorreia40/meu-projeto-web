"""Run the MANAGED paper cycle: entry -> manage -> exit (paper only).

Usage:
    python scripts/run_managed_cycle.py [--seed 42] [--days 180] [--holdout 30]

Enters positions on a warmup window, then manages them to stop/target/time exits
over a held-out window. No network, no broker, no live trading.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.managed_cycle import ManagedCycle
from data.universe import SYMBOLS


def main() -> None:
    parser = argparse.ArgumentParser(description="Managed paper cycle (entry/manage/exit)")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--days", type=int, default=180)
    parser.add_argument("--holdout", type=int, default=30)
    args = parser.parse_args()

    cycle = ManagedCycle(seed=args.seed, days=args.days, holdout=args.holdout)
    result = cycle.run(SYMBOLS)
    artifacts = cycle.persist()

    print("=" * 72)
    print("MESA PROPRIETÁRIA COM IA — managed paper cycle (entry -> manage -> exit)")
    print("=" * 72)
    print(f"Entries: {result.n_entries} | open remaining: {result.open_remaining}")
    print(f"Journal: {result.journal_stats}")
    print(f"Total return: {result.total_return_pct:.2f}% | "
          f"max drawdown: {result.max_drawdown_pct:.2f}% | "
          f"final equity: ${result.final_equity:,.0f}")
    print("\nROUND TRIPS:")
    print(f"  {'SYMBOL':<8}{'QTY':>5}{'ENTRY':>10}{'EXIT':>10}{'REASON':>9}{'PNL':>10}{'R':>7}{'BARS':>6}")
    for t in result.trips:
        print(f"  {t.symbol:<8}{t.quantity:>5}{t.entry_price:>10.2f}{t.exit_price:>10.2f}"
              f"{t.exit_reason:>9}{t.pnl:>10.2f}{t.r_multiple:>7.2f}{t.bars_held:>6}")
    print(f"\nArtifacts: {artifacts}")
    print("LIVE TRADING: disabled (paper simulation only).")


if __name__ == "__main__":
    main()
