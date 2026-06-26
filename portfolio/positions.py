"""Position schema and helpers.

A position represents currently held quantity of one symbol. In the MVP all
positions are long (``quantity`` > 0). PnL helpers are intentionally simple and
operate on injected mark prices.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from core.clock import utcnow


class Position(BaseModel):
    """An open long position (paper, in the MVP)."""

    model_config = ConfigDict(use_enum_values=False)

    symbol: str = Field(..., min_length=1, max_length=10)
    quantity: int = Field(..., gt=0)
    avg_price: float = Field(..., gt=0)
    opened_at: datetime = Field(default_factory=utcnow)

    @property
    def cost_basis(self) -> float:
        return self.quantity * self.avg_price

    def market_value(self, mark_price: float) -> float:
        return self.quantity * mark_price

    def unrealized_pnl(self, mark_price: float) -> float:
        return (mark_price - self.avg_price) * self.quantity

    def exposure_pct(self, mark_price: float, account_equity: float) -> float:
        if account_equity <= 0:
            return 0.0
        return self.market_value(mark_price) / account_equity * 100.0
