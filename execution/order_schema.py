"""Order schema.

Orders are only ever *built* from a risk-approved signal. The ``risk_approved``
flag can only be set by the deterministic risk engine; the execution layer
refuses to submit an order where it is false. ``mode`` defaults to PAPER.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from core.clock import utcnow


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"


class OrderStatus(str, Enum):
    NEW = "new"
    VALIDATED = "validated"
    SUBMITTED = "submitted"
    FILLED = "filled"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ExecutionMode(str, Enum):
    PAPER = "paper"
    LIVE = "live"


def _new_id() -> str:
    return f"ord_{uuid.uuid4().hex[:12]}"


class Order(BaseModel):
    """A single order. Long-only (BUY to open) in the MVP."""

    model_config = ConfigDict(use_enum_values=False)

    order_id: str = Field(default_factory=_new_id)
    signal_id: str = Field(..., min_length=1)
    symbol: str = Field(..., min_length=1, max_length=10)
    side: OrderSide
    order_type: OrderType
    quantity: int = Field(..., gt=0)
    limit_price: float | None = Field(default=None, gt=0)

    # Set ONLY by the risk engine. Execution refuses to submit without it.
    risk_approved: bool = False
    # True for a reduce-only SELL that closes (part of) an existing long.
    # The MVP never opens shorts; SELL is allowed only when is_close is True.
    is_close: bool = False
    mode: ExecutionMode = ExecutionMode.PAPER
    status: OrderStatus = OrderStatus.NEW
    created_at: datetime = Field(default_factory=utcnow)


class Fill(BaseModel):
    """The result of a (paper) execution."""

    model_config = ConfigDict(use_enum_values=False)

    order_id: str = Field(..., min_length=1)
    signal_id: str = Field(..., min_length=1)
    symbol: str = Field(..., min_length=1, max_length=10)
    side: OrderSide
    quantity: int = Field(..., gt=0)
    fill_price: float = Field(..., gt=0)
    commission: float = Field(default=0.0, ge=0)
    mode: ExecutionMode = ExecutionMode.PAPER
    filled_at: datetime = Field(default_factory=utcnow)

    @property
    def notional(self) -> float:
        return self.quantity * self.fill_price
