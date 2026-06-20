"""Plot the multi-day paper simulation: equity curve + drawdown halting.

Usage:
    python scripts/plot_simulation.py [--seed 42] [--days 180] [--warmup 60]

Renders two panels to artifacts/simulation.png:
  1. MVP policy (2% daily / 5% weekly) — the desk trades freely.
  2. A deliberately tight policy — the desk HALTS (shaded red) when drawdown
     limits are breached, proving the fail-safe.

Paper only; no network beyond plotting.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import matplotlib

matplotlib.use("Agg")  # headless
import matplotlib.pyplot as plt  # noqa: E402

from app.multi_day import MultiDaySimulation  # noqa: E402
from risk.policy import RiskPolicy  # noqa: E402

SYMBOLS = ["SPY", "QQQ", "IWM", "DIA", "XLK", "XLF", "XLV", "XLY"]


def main() -> None:
    parser = argparse.ArgumentParser(description="Plot the multi-day simulation")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--days", type=int, default=180)
    parser.add_argument("--warmup", type=int, default=60)
    parser.add_argument("--out", default="artifacts/simulation.png")
    args = parser.parse_args()

    # 1) Normal MVP policy.
    normal = MultiDaySimulation(seed=args.seed, days=args.days, warmup=args.warmup)
    nres = normal.run(SYMBOLS)
    n_days = [d[0] for d in normal.daily_log]
    n_eq = [d[1] for d in normal.daily_log]

    # 2) Deliberately tight policy -> frequent drawdown halts.
    tight = MultiDaySimulation(
        seed=args.seed, days=args.days, warmup=args.warmup,
        policy=RiskPolicy(max_daily_loss_pct=0.05, max_weekly_loss_pct=0.05),
    )
    tres = tight.run(SYMBOLS)
    t_days = [d[0] for d in tight.daily_log]
    t_eq = [d[1] for d in tight.daily_log]
    t_halt = [d[0] for d in tight.daily_log if d[2]]

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(11, 8), sharex=True)
    fig.suptitle("Mesa Proprietária com IA — Multi-Day Paper Simulation (no live trading)",
                 fontsize=13, fontweight="bold")

    ax1.plot(n_days, n_eq, color="#1f77b4", lw=1.6)
    ax1.axhline(normal.account_equity, color="grey", ls="--", lw=0.8, label="starting equity")
    ax1.set_title(
        f"MVP policy (2% daily / 5% weekly)  ·  entries={nres.n_entries} "
        f"exits={nres.n_exits}  ·  return={nres.total_return_pct:.2f}%  "
        f"·  maxDD={nres.max_drawdown_pct:.2f}%  ·  halt days={nres.halt_days}",
        fontsize=10)
    ax1.set_ylabel("Equity ($)")
    ax1.legend(loc="upper left", fontsize=8)
    ax1.grid(alpha=0.3)

    ax2.plot(t_days, t_eq, color="#2ca02c", lw=1.6)
    ax2.axhline(tight.account_equity, color="grey", ls="--", lw=0.8)
    for d in t_halt:  # shade halted days red
        ax2.axvspan(d - 0.5, d + 0.5, color="red", alpha=0.12)
    ax2.set_title(
        f"Tight policy (0.05%)  ·  HALT DAYS (red) = {tres.halt_days}  "
        f"·  entries={tres.n_entries}  ·  kill switch engages on breach",
        fontsize=10)
    ax2.set_xlabel("Trading day")
    ax2.set_ylabel("Equity ($)")
    ax2.grid(alpha=0.3)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout(rect=(0, 0, 1, 0.97))
    fig.savefig(out, dpi=120)
    print(f"Saved {out}")
    print(f"Normal: entries={nres.n_entries} return={nres.total_return_pct:.2f}% "
          f"maxDD={nres.max_drawdown_pct:.2f}% halt_days={nres.halt_days}")
    print(f"Tight:  entries={tres.n_entries} halt_days={tres.halt_days} "
          f"kill_switch={tight.kill_switch.engaged}")


if __name__ == "__main__":
    main()
