"""Backtest metrics computed from a list of simulated trades."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class SimulatedTrade(BaseModel):
    model_config = ConfigDict(frozen=True)

    entry_index: int
    exit_index: int
    entry_price: float
    exit_price: float
    exit_reason: str        # "target" | "stop" | "time"
    return_pct: float       # net of slippage/commission
    r_multiple: float       # P&L in units of initial risk
    bars_held: int


class BacktestMetrics(BaseModel):
    model_config = ConfigDict(frozen=True)

    n_trades: int
    wins: int
    losses: int
    win_rate: float
    profit_factor: float
    expectancy_r: float
    avg_return_pct: float
    total_return_pct: float
    max_drawdown_pct: float


def compute_metrics(trades: list[SimulatedTrade]) -> BacktestMetrics:
    n = len(trades)
    if n == 0:
        return BacktestMetrics(
            n_trades=0, wins=0, losses=0, win_rate=0.0, profit_factor=0.0,
            expectancy_r=0.0, avg_return_pct=0.0, total_return_pct=0.0,
            max_drawdown_pct=0.0,
        )

    wins = sum(1 for t in trades if t.r_multiple > 0)
    losses = sum(1 for t in trades if t.r_multiple <= 0)
    gross_win = sum(t.return_pct for t in trades if t.return_pct > 0)
    gross_loss = -sum(t.return_pct for t in trades if t.return_pct < 0)
    profit_factor = (gross_win / gross_loss) if gross_loss > 0 else (
        float("inf") if gross_win > 0 else 0.0
    )
    expectancy_r = sum(t.r_multiple for t in trades) / n
    avg_return = sum(t.return_pct for t in trades) / n

    # Compound equity curve to get total return and max drawdown.
    equity = 1.0
    peak = 1.0
    max_dd = 0.0
    for t in trades:
        equity *= (1 + t.return_pct / 100.0)
        peak = max(peak, equity)
        dd = (peak - equity) / peak * 100.0
        max_dd = max(max_dd, dd)
    total_return = (equity - 1.0) * 100.0

    return BacktestMetrics(
        n_trades=n,
        wins=wins,
        losses=losses,
        win_rate=round(wins / n, 4),
        profit_factor=round(profit_factor, 4) if profit_factor != float("inf") else profit_factor,
        expectancy_r=round(expectancy_r, 4),
        avg_return_pct=round(avg_return, 4),
        total_return_pct=round(total_return, 4),
        max_drawdown_pct=round(max_dd, 4),
    )
