"""Risk policy: the deterministic parameters that govern every trade.

These values are the MVP defaults from the project specification. The risk
engine reads this policy; AI agents may *suggest* parameters but can never
change or override it.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class RiskPolicy(BaseModel):
    """Immutable risk policy. Construct once and pass to the risk engine."""

    model_config = ConfigDict(frozen=True)

    # Per-trade and sizing limits
    max_risk_per_trade_pct: float = Field(default=1.0, gt=0)
    max_position_size_pct: float = Field(default=2.0, gt=0)

    # Drawdown limits
    max_daily_loss_pct: float = Field(default=2.0, gt=0)
    max_weekly_loss_pct: float = Field(default=5.0, gt=0)

    # Portfolio limits
    max_open_positions: int = Field(default=3, gt=0)
    max_total_exposure_pct: float = Field(default=20.0, gt=0)

    # Capability flags — all dangerous capabilities OFF for the MVP.
    allow_short: bool = False
    allow_options: bool = False
    allow_crypto: bool = False
    allow_leverage: bool = False
    allow_earnings_trades: bool = False

    # Execution-mode defaults
    paper_trading_default: bool = True
    live_trading_default: bool = False

    # Data-quality gates
    min_price_history_bars: int = Field(default=60, gt=0)
    min_liquidity_score: float = Field(default=0.3, ge=0.0, le=1.0)
    max_spread_pct: float = Field(default=0.5, gt=0)


#: The canonical MVP policy instance.
MVP_RISK_POLICY = RiskPolicy()
