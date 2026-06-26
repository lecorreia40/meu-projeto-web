"""Risk-engine endpoints.

The risk engine is the deterministic gatekeeper. These endpoints let a caller
evaluate a signal (with optional runtime context) and receive an auditable
approve/block decision with reasons. No order is placed here.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from fastapi import APIRouter, Depends

from app.dependencies import get_app_logger, get_risk_engine
from core.events import EventType, Severity
from core.logging import StructuredLogger
from risk.policy import RiskPolicy
from risk.risk_engine import RiskDecision, RiskEngine
from risk.rules import RiskContext
from signals.signal_schema import TradingSignal

router = APIRouter(prefix="/risk", tags=["risk"])


class EvaluateRequest(BaseModel):
    signal: TradingSignal
    context: RiskContext = Field(default_factory=RiskContext)


@router.get("/policy", response_model=RiskPolicy)
def get_policy(engine: RiskEngine = Depends(get_risk_engine)) -> RiskPolicy:
    return engine.policy


@router.post("/evaluate", response_model=RiskDecision)
def evaluate(
    request: EvaluateRequest,
    engine: RiskEngine = Depends(get_risk_engine),
    logger: StructuredLogger = Depends(get_app_logger),
) -> RiskDecision:
    decision = engine.evaluate(request.signal, request.context)
    logger.log(
        EventType.RISK_APPROVED if decision.approved else EventType.RISK_BLOCKED,
        entity_id=decision.signal_id,
        severity=Severity.INFO if decision.approved else Severity.WARNING,
        approved=decision.approved,
        reasons=decision.reason_values,
    )
    return decision
