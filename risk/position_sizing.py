"""Deterministic position sizing.

Size is derived from risk, never from conviction alone: the dollar risk per
trade is ``equity * risk_pct`` and the share count is that risk divided by the
per-share stop distance. The resulting notional is then capped by the policy's
maximum position size. All math is deterministic and unit-tested.
"""

from __future__ import annotations

import math

from pydantic import BaseModel, ConfigDict

from risk.policy import RiskPolicy
from signals.signal_schema import TradingSignal


class PositionSizing(BaseModel):
    """Result of sizing a signal against an account and policy."""

    model_config = ConfigDict(frozen=True)

    shares: int
    notional: float
    position_pct: float          # notional / equity * 100
    risk_amount: float           # dollars at risk if stop is hit
    risk_pct_of_equity: float    # risk_amount / equity * 100
    capped_by_position_limit: bool


def compute_position_size(
    signal: TradingSignal,
    account_equity: float,
    policy: RiskPolicy,
) -> PositionSizing:
    """Compute a risk-based, policy-capped position size.

    The effective per-trade risk percentage is the *more conservative* of the
    signal's requested ``max_risk_pct`` and the policy's
    ``max_risk_per_trade_pct``.
    """
    if account_equity <= 0:
        return PositionSizing(
            shares=0, notional=0.0, position_pct=0.0,
            risk_amount=0.0, risk_pct_of_equity=0.0,
            capped_by_position_limit=False,
        )

    effective_risk_pct = min(signal.max_risk_pct, policy.max_risk_per_trade_pct)
    risk_dollars = account_equity * (effective_risk_pct / 100.0)

    per_unit_risk = signal.per_unit_risk
    if per_unit_risk <= 0:
        # No stop distance => cannot size safely.
        return PositionSizing(
            shares=0, notional=0.0, position_pct=0.0,
            risk_amount=0.0, risk_pct_of_equity=0.0,
            capped_by_position_limit=False,
        )

    shares = math.floor(risk_dollars / per_unit_risk)

    # Cap by the maximum position size (notional as a % of equity).
    max_notional = account_equity * (policy.max_position_size_pct / 100.0)
    capped = False
    if shares * signal.entry_price > max_notional:
        shares = math.floor(max_notional / signal.entry_price)
        capped = True

    shares = max(0, shares)
    notional = shares * signal.entry_price
    risk_amount = shares * per_unit_risk
    return PositionSizing(
        shares=shares,
        notional=notional,
        position_pct=(notional / account_equity * 100.0),
        risk_amount=risk_amount,
        risk_pct_of_equity=(risk_amount / account_equity * 100.0),
        capped_by_position_limit=capped,
    )
