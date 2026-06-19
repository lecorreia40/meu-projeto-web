"""Investment memo schema.

A memo is the AI plane's *advisory* output: a structured thesis produced by the
agent swarm and the orchestrator. It carries explainability metadata
(``model_version``, ``prompt_version``, ``data_sources``) so every decision is
auditable. A memo never executes anything.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from core.clock import utcnow
from core.enums import AssetType, Direction, TimeHorizon


class MemoStatus(str, Enum):
    DRAFT = "draft"
    COMPLETE = "complete"
    REJECTED = "rejected"


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


class InvestmentMemo(BaseModel):
    """Structured investment memo. All listed fields are required for a memo to
    be considered COMPLETE and eligible for signal generation."""

    model_config = ConfigDict(use_enum_values=False)

    memo_id: str = Field(default_factory=lambda: _new_id("memo"))
    symbol: str = Field(..., min_length=1, max_length=10)
    asset_type: AssetType
    direction: Direction
    thesis: str = Field(..., min_length=1)
    catalyst: str = Field(..., min_length=1)
    time_horizon: TimeHorizon
    entry_logic: str = Field(..., min_length=1)
    risk_summary: str = Field(..., min_length=1)
    skeptic_view: str = Field(..., min_length=1)
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    data_sources: list[str] = Field(..., min_length=1)
    created_at: datetime = Field(default_factory=utcnow)
    model_version: str = Field(..., min_length=1)
    prompt_version: str = Field(..., min_length=1)
    status: MemoStatus = MemoStatus.DRAFT
