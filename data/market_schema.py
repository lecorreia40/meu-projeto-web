"""Market-data schemas: tradable assets and OHLCV bars.

These are the canonical Pydantic models for the data plane. Prices are modeled
as floats for the MVP; a production system would use ``Decimal`` for money.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from core.enums import AssetType


class Asset(BaseModel):
    """A tradable instrument in the MVP universe (US stock or ETF, long-only)."""

    model_config = ConfigDict(frozen=True)

    symbol: str = Field(..., min_length=1, max_length=10, pattern=r"^[A-Z.]+$")
    name: str
    asset_type: AssetType
    exchange: str = "SMART"
    currency: str = "USD"
    tradable: bool = True


class MarketBar(BaseModel):
    """A single OHLCV bar for one symbol at one timestamp."""

    model_config = ConfigDict(frozen=True)

    symbol: str = Field(..., min_length=1, max_length=10)
    timestamp: datetime
    open: float = Field(..., gt=0)
    high: float = Field(..., gt=0)
    low: float = Field(..., gt=0)
    close: float = Field(..., gt=0)
    volume: int = Field(..., ge=0)

    @model_validator(mode="after")
    def _check_ohlc_consistency(self) -> "MarketBar":
        if self.high < self.low:
            raise ValueError("high cannot be below low")
        if not (self.low <= self.open <= self.high):
            raise ValueError("open must be within [low, high]")
        if not (self.low <= self.close <= self.high):
            raise ValueError("close must be within [low, high]")
        return self
