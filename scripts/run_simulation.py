"""Run the MULTI-DAY paper simulation with drawdown halting (paper only).

Usage:
    python scripts/run_simulation.py [--seed 42] [--days 180] [--warmup 60]

Walks day-by-day: manages open positions, halts new entries when the daily/weekly
loss limit is breached, and enters approved signals otherwise. No network, no
broker, no live trading.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.multi_day import MultiDaySimulation
from data.universe import SYMBOLS


def main() -> None:
    parser = argparse.ArgumentParser(description="Multi-day paper simulation")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--days", type=int, default=180)
    parser.add_argument("--warmup", type=int, default=60)
    args = parser.parse_args()

    sim = MultiDaySimulation(seed=args.seed, days=args.days, warmup=args.warmup)
    result = sim.run(SYMBOLS)

    print("=" * 72)
    print("MESA PROPRIETÁRIA COM IA — multi-day simulation (PAPER ONLY)")
    print("=" * 72)
    print(f"Days traded: {result.days_traded} | halt days (drawdown): {result.halt_days}")
    print(f"Entries: {result.n_entries} | exits: {result.n_exits} | open remaining: {result.open_remaining}")
    print(f"Journal: {result.journal_stats}")
    print(f"Total return: {result.total_return_pct:.2f}% | "
          f"max drawdown: {result.max_drawdown_pct:.2f}% | "
          f"final equity: ${result.final_equity:,.0f}")
    if sim.kill_switch.engaged:
        print(f"Kill switch: ENGAGED ({sim.kill_switch.reason})")
    print("\nLAST 8 ROUND TRIPS:")
    print(f"  {'SYMBOL':<8}{'QTY':>5}{'ENTRY':>10}{'EXIT':>10}{'REASON':>9}{'PNL':>10}{'R':>7}")
    for t in result.trips[-8:]:
        print(f"  {t.symbol:<8}{t.quantity:>5}{t.entry_price:>10.2f}{t.exit_price:>10.2f}"
              f"{t.exit_reason:>9}{t.pnl:>10.2f}{t.r_multiple:>7.2f}")
    print("\nLIVE TRADING: disabled (paper simulation only).")


if __name__ == "__main__":
    main()
