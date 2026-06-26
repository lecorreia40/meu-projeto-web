"""Deterministic drawdown evaluation.

Compares current equity against the equity at the open of the day and the open
of the week, and reports whether the daily or weekly loss limits have been
breached. When breached, the trading desk must HALT new entries (the kill switch
is engaged); open positions are still managed to their exits.

Pure and deterministic — no AI, no randomness — so it is fully unit-testable.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from risk.policy import RiskPolicy


class DrawdownStatus(BaseModel):
    model_config = ConfigDict(frozen=True)

    daily_loss_pct: float
    weekly_loss_pct: float
    halt_daily: bool
    halt_weekly: bool
    halted: bool
    reasons: list[str]


def _loss_pct(open_equity: float, current_equity: float) -> float:
    """Percentage decline from ``open_equity`` to ``current_equity`` (0 if up)."""
    if open_equity <= 0:
        return 0.0
    return max(0.0, (open_equity - current_equity) / open_equity * 100.0)


def evaluate_drawdown(
    *,
    day_open_equity: float,
    week_open_equity: float,
    current_equity: float,
    policy: RiskPolicy,
) -> DrawdownStatus:
    """Return the drawdown status against the policy's daily/weekly loss limits."""
    daily = _loss_pct(day_open_equity, current_equity)
    weekly = _loss_pct(week_open_equity, current_equity)
    halt_daily = daily >= policy.max_daily_loss_pct
    halt_weekly = weekly >= policy.max_weekly_loss_pct

    reasons: list[str] = []
    if halt_daily:
        reasons.append("daily_loss_limit")
    if halt_weekly:
        reasons.append("weekly_loss_limit")

    return DrawdownStatus(
        daily_loss_pct=round(daily, 4),
        weekly_loss_pct=round(weekly, 4),
        halt_daily=halt_daily,
        halt_weekly=halt_weekly,
        halted=halt_daily or halt_weekly,
        reasons=reasons,
    )
