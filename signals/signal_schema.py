"""Trading signal schema.

A signal is the structured, machine-checkable conversion of a memo's thesis into
explicit entry/stop/target levels and sizing constraints. Every field below is
required; a signal missing any required field must be rejected (the risk engine
treats incompleteness as a hard block).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, model_validator

from core.clock import utcnow
from core.enums import Direction, TimeHorizon


class EntryType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"


class RiskStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    BLOCKED = "blocked"


class ExecutionStatus(str, Enum):
    NOT_SUBMITTED = "not_submitted"
    PAPER_SUBMITTED = "paper_submitted"
    PAPER_FILLED = "paper_filled"
    REJECTED = "rejected"


def _new_id() -> str:
    return f"sig_{uuid.uuid4().hex[:12]}"


class TradingSignal(BaseModel):
    """A validated, risk-checkable trading signal."""

    model_config = ConfigDict(use_enum_values=False)

    signal_id: str = Field(default_factory=_new_id)
    memo_id: str = Field(..., min_length=1)
    symbol: str = Field(..., min_length=1, max_length=10)
    direction: Direction
    entry_type: EntryType
    entry_price: float = Field(..., gt=0)
    stop_loss: float = Field(..., gt=0)
    take_profit: float = Field(..., gt=0)
    max_position_pct: float = Field(..., gt=0, le=100)
    max_risk_pct: float = Field(..., gt=0, le=100)
    time_horizon: TimeHorizon
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    requires_backtest: bool = True
    risk_status: RiskStatus = RiskStatus.PENDING
    execution_status: ExecutionStatus = ExecutionStatus.NOT_SUBMITTED
    created_at: datetime = Field(default_factory=utcnow)

    @model_validator(mode="after")
    def _check_long_geometry(self) -> "TradingSignal":
        """For a LONG signal the stop must sit below entry and the target above.

        This catches obviously malformed signals at the schema boundary, before
        they ever reach the risk engine.
        """
        if self.direction is Direction.LONG:
            if self.stop_loss >= self.entry_price:
                raise ValueError("long signal: stop_loss must be below entry_price")
            if self.take_profit <= self.entry_price:
                raise ValueError("long signal: take_profit must be above entry_price")
        return self

    @property
    def per_unit_risk(self) -> float:
        """Absolute price distance between entry and stop (risk per share)."""
        return abs(self.entry_price - self.stop_loss)
