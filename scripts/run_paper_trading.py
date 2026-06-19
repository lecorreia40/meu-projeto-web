"""Run the FULL mock trading cycle (paper/dry-run only):

    data -> agents -> memo -> signal -> backtest -> risk review -> paper order

Usage:
    python scripts/run_paper_trading.py [--seed 42] [--days 180] [--equity 100000]

No network, no broker, no live trading.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.pipeline import TradingDeskPipeline
from data.universe import SYMBOLS


def main() -> None:
    parser = argparse.ArgumentParser(description="Full mock trading cycle (paper only)")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--days", type=int, default=180)
    parser.add_argument("--equity", type=float, default=100_000.0)
    args = parser.parse_args()

    pipeline = TradingDeskPipeline(seed=args.seed, days=args.days, account_equity=args.equity)
    summary = pipeline.run(SYMBOLS)
    artifacts = pipeline.persist_artifacts()

    print("=" * 72)
    print("MESA PROPRIETÁRIA COM IA — full mock cycle (PAPER ONLY)")
    print("=" * 72)
    print(f"Symbols processed: {len(summary.records)}")
    print(f"Stage counts: {summary.counts}\n")

    print(f"{'SYMBOL':<8}{'STAGE':<18}{'CONF':>6}{'BT':>5}{'RISK':>8}  NOTES")
    for r in summary.records:
        conf = f"{r.memo.confidence_score:.2f}"
        bt = "-" if r.backtest is None else ("pass" if r.backtest.passed else "fail")
        risk = "-" if r.decision is None else ("ok" if r.decision.approved else "block")
        print(f"{r.symbol:<8}{r.stage:<18}{conf:>6}{bt:>5}{risk:>8}  {r.notes[:34]}")

    print("\nPAPER ORDERS FILLED:")
    if not summary.paper_orders:
        print("  (none this run — every candidate was filtered, blocked, or rejected)")
    for r in summary.paper_orders:
        ex = r.execution
        assert ex is not None
        print(
            f"  {r.symbol}: BUY {ex.fill.quantity} @ {ex.fill.fill_price} "
            f"(notional ${ex.fill.notional:,.0f}, mode={ex.fill.mode.value}, "
            f"commission ${ex.fill.commission:.2f})"
        )

    snap = pipeline.portfolio_snapshot()
    print("\nPAPER PORTFOLIO:")
    print(
        f"  equity ${snap.equity:,.0f} | cash ${snap.cash:,.0f} | "
        f"positions {snap.open_positions} | exposure {snap.gross_exposure_pct:.1f}% | "
        f"unrealized PnL ${snap.unrealized_pnl:,.2f} | commissions ${snap.commissions_paid:.2f}"
    )

    print(f"\nArtifacts written: {artifacts}")
    print("LIVE TRADING: disabled (paper simulation only).")


if __name__ == "__main__":
    main()
