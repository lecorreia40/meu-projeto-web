"""Bracket-trade replay simulator (long-only).

Replays a signal's risk *geometry* (stop and target distances) across a window
of historical/mock OHLCV bars, behind a simple trend filter (close > SMA). Each
time it is flat and the filter passes, it enters long, then exits at the stop,
the target, or a time stop — producing a series of trades the metrics module
scores. Deterministic; paper/dry-run only.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from backtest.metrics import SimulatedTrade
from backtest.slippage import apply_slippage
from core.enums import Direction
from data.market_schema import MarketBar
from features.technical_indicators import closes, sma_series


class SimConfig(BaseModel):
    model_config = ConfigDict(frozen=True)

    sma_window: int = 20
    max_holding_bars: int = 20
    slippage_bps: float = 5.0
    commission_bps: float = 1.0


def _sma_at(prices: list[float], window: int) -> list[float | None]:
    """SMA aligned to each index (None until the window fills)."""
    series = sma_series(prices, window)
    pad = [None] * (window - 1)
    return pad + series  # type: ignore[return-value]


def replay_bracket(
    bars: list[MarketBar],
    *,
    stop_frac: float,
    target_frac: float,
    config: SimConfig | None = None,
) -> list[SimulatedTrade]:
    """Replay a long bracket strategy and return the trades it produced."""
    cfg = config or SimConfig()
    if stop_frac <= 0 or target_frac <= 0:
        return []
    prices = closes(bars)
    n = len(bars)
    if n <= cfg.sma_window + 1:
        return []

    sma = _sma_at(prices, cfg.sma_window)
    commission_pct_per_fill = cfg.commission_bps / 10_000.0 * 100.0
    trades: list[SimulatedTrade] = []

    i = cfg.sma_window
    while i < n - 1:
        ma = sma[i]
        # Entry filter: trend up (close above SMA).
        if ma is None or prices[i] <= ma:
            i += 1
            continue

        entry_fill = apply_slippage(prices[i], Direction.LONG, "entry", cfg.slippage_bps)
        risk_per_share = entry_fill * stop_frac
        stop_price = entry_fill * (1 - stop_frac)
        target_price = entry_fill * (1 + target_frac)

        exit_index = min(i + cfg.max_holding_bars, n - 1)
        exit_reason = "time"
        exit_ref = prices[exit_index]
        for j in range(i + 1, min(i + cfg.max_holding_bars, n - 1) + 1):
            bar = bars[j]
            if bar.low <= stop_price:          # stop checked first (conservative)
                exit_index, exit_reason, exit_ref = j, "stop", stop_price
                break
            if bar.high >= target_price:
                exit_index, exit_reason, exit_ref = j, "target", target_price
                break

        exit_fill = apply_slippage(exit_ref, Direction.LONG, "exit", cfg.slippage_bps)
        gross_return_pct = (exit_fill - entry_fill) / entry_fill * 100.0
        net_return_pct = gross_return_pct - 2 * commission_pct_per_fill
        r_multiple = (exit_fill - entry_fill) / risk_per_share if risk_per_share > 0 else 0.0

        trades.append(
            SimulatedTrade(
                entry_index=i,
                exit_index=exit_index,
                entry_price=round(entry_fill, 4),
                exit_price=round(exit_fill, 4),
                exit_reason=exit_reason,
                return_pct=round(net_return_pct, 4),
                r_multiple=round(r_multiple, 4),
                bars_held=exit_index - i,
            )
        )
        i = exit_index + 1  # re-arm after the trade closes

    return trades
