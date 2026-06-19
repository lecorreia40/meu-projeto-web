"""Simple walk-forward evaluation.

Splits the bar history into sequential windows and runs the strategy replay on
each, so performance isn't judged on a single in-sample period. This is a
lightweight Sprint 2 version; Phase 6 adds parameter re-fitting per window.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from backtest.metrics import BacktestMetrics, compute_metrics
from backtest.simulator import SimConfig, replay_bracket
from data.market_schema import MarketBar


class WalkForwardWindow(BaseModel):
    model_config = ConfigDict(frozen=True)

    start_index: int
    end_index: int
    metrics: BacktestMetrics


class WalkForwardResult(BaseModel):
    model_config = ConfigDict(frozen=True)

    n_windows: int
    windows: list[WalkForwardWindow]
    aggregate: BacktestMetrics


def walk_forward(
    bars: list[MarketBar],
    *,
    stop_frac: float,
    target_frac: float,
    n_windows: int = 3,
    config: SimConfig | None = None,
) -> WalkForwardResult:
    cfg = config or SimConfig()
    windows: list[WalkForwardWindow] = []
    size = len(bars) // n_windows if n_windows > 0 else len(bars)

    all_trades = []
    for w in range(n_windows):
        start = w * size
        end = len(bars) if w == n_windows - 1 else (w + 1) * size
        segment = bars[start:end]
        trades = replay_bracket(
            segment, stop_frac=stop_frac, target_frac=target_frac, config=cfg
        )
        all_trades.extend(trades)
        windows.append(
            WalkForwardWindow(
                start_index=start, end_index=end, metrics=compute_metrics(trades)
            )
        )

    return WalkForwardResult(
        n_windows=len(windows),
        windows=windows,
        aggregate=compute_metrics(all_trades),
    )
