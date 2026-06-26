"""Human-readable backtest reports."""

from __future__ import annotations

from backtest.engine import BacktestResult


def format_result(result: BacktestResult) -> str:
    m = result.metrics
    verdict = "PASS" if result.passed else "BLOCK"
    return (
        f"[{verdict}] {result.symbol} (signal {result.signal_id})\n"
        f"  bars={result.n_bars} reward:risk={result.reward_risk}\n"
        f"  trades={m.n_trades} win_rate={m.win_rate:.0%} "
        f"profit_factor={m.profit_factor} expectancy={m.expectancy_r:.2f}R\n"
        f"  total_return={m.total_return_pct:.2f}% max_drawdown={m.max_drawdown_pct:.2f}%\n"
        f"  reason: {result.reason}"
    )
