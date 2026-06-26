"""Backtest engine: run a signal's strategy replay and apply a pass/fail gate.

The risk engine consults ``BacktestResult.passed`` for any signal whose
``requires_backtest`` is true: a failed backtest blocks the trade.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from backtest.metrics import BacktestMetrics, compute_metrics
from backtest.simulator import SimConfig, replay_bracket
from data.market_schema import MarketBar
from signals.signal_schema import TradingSignal


class BacktestResult(BaseModel):
    model_config = ConfigDict(frozen=True)

    signal_id: str
    symbol: str
    n_bars: int
    reward_risk: float
    metrics: BacktestMetrics
    passed: bool
    reason: str


# Gate thresholds (deliberately modest for the MVP; tightened in Phase 6).
MIN_BARS = 60
MIN_TRADES = 2
MIN_REWARD_RISK = 1.5
MIN_EXPECTANCY_R = 0.0


class BacktestEngine:
    """Runs a single-signal strategy replay and renders a pass/fail verdict."""

    def __init__(self, config: SimConfig | None = None) -> None:
        self.config = config or SimConfig()

    def run(self, signal: TradingSignal, bars: list[MarketBar]) -> BacktestResult:
        entry = signal.entry_price
        stop_frac = abs(entry - signal.stop_loss) / entry if entry else 0.0
        target_frac = abs(signal.take_profit - entry) / entry if entry else 0.0
        reward_risk = (target_frac / stop_frac) if stop_frac > 0 else 0.0

        trades = replay_bracket(
            bars, stop_frac=stop_frac, target_frac=target_frac, config=self.config
        )
        metrics = compute_metrics(trades)

        passed, reason = self._gate(len(bars), reward_risk, metrics)
        return BacktestResult(
            signal_id=signal.signal_id,
            symbol=signal.symbol,
            n_bars=len(bars),
            reward_risk=round(reward_risk, 3),
            metrics=metrics,
            passed=passed,
            reason=reason,
        )

    @staticmethod
    def _gate(
        n_bars: int, reward_risk: float, metrics: BacktestMetrics
    ) -> tuple[bool, str]:
        if n_bars < MIN_BARS:
            return False, f"insufficient history ({n_bars} < {MIN_BARS} bars)"
        if metrics.n_trades < MIN_TRADES:
            return False, f"too few trades ({metrics.n_trades} < {MIN_TRADES})"
        if reward_risk < MIN_REWARD_RISK:
            return False, f"reward:risk {reward_risk:.2f} < {MIN_REWARD_RISK}"
        if metrics.expectancy_r < MIN_EXPECTANCY_R:
            return False, f"negative expectancy ({metrics.expectancy_r:.3f}R)"
        return True, (
            f"passed: {metrics.n_trades} trades, win rate {metrics.win_rate:.0%}, "
            f"PF {metrics.profit_factor}, expectancy {metrics.expectancy_r:.2f}R"
        )
