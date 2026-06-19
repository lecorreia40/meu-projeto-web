"""The deterministic risk engine.

Authority: **higher than any AI agent**. The engine takes a signal plus runtime
context and a policy, runs every deterministic rule, and returns a
:class:`RiskDecision`. It approves only when *zero* rules block. It is pure and
deterministic — no LLM calls, no randomness — so its verdicts are reproducible
and auditable.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from core.clock import utcnow
from risk import rules as R
from risk.policy import MVP_RISK_POLICY, RiskPolicy
from risk.position_sizing import PositionSizing, compute_position_size
from risk.rules import BlockReason, RiskContext
from signals.signal_schema import RiskStatus, TradingSignal


class RiskDecision(BaseModel):
    """Outcome of evaluating one signal."""

    model_config = ConfigDict(frozen=True)

    signal_id: str
    approved: bool
    reasons: list[BlockReason] = Field(default_factory=list)
    sizing: PositionSizing | None = None
    evaluated_at: datetime = Field(default_factory=utcnow)

    @property
    def blocked(self) -> bool:
        return not self.approved

    @property
    def reason_values(self) -> list[str]:
        return [r.value for r in self.reasons]


class RiskEngine:
    """Runs the deterministic rule set and renders a verdict."""

    def __init__(self, policy: RiskPolicy | None = None) -> None:
        self.policy = policy or MVP_RISK_POLICY

    def evaluate(
        self, signal: TradingSignal, context: RiskContext | None = None
    ) -> RiskDecision:
        ctx = context or RiskContext()
        policy = self.policy
        reasons: list[BlockReason] = []

        # Size first; several rules depend on the computed sizing.
        sizing = compute_position_size(signal, ctx.account_equity, policy)

        # --- Run every rule; collect ALL reasons for a complete audit trail ---
        single_checks = [
            R.check_required_fields(signal),
            R.check_universe(signal),
            R.check_direction(signal, policy),
            R.check_liquidity(ctx, policy),
            R.check_spread(ctx, policy),
            R.check_history(ctx, policy),
            R.check_data_quality(ctx),
            R.check_backtest(signal, ctx),
            R.check_risk_per_trade(signal, policy),
            R.check_open_positions(ctx, policy),
            R.check_exposure(ctx, sizing, policy),
            R.check_broker(ctx),
            R.check_live_trading(ctx),
            R.check_llm_confidence(ctx),
            R.check_earnings(ctx, policy),
        ]
        reasons.extend(r for r in single_checks if r is not None)
        reasons.extend(R.check_instrument_flags(ctx, policy))
        reasons.extend(R.check_position_size(signal, sizing, policy))
        reasons.extend(R.check_drawdown(ctx, policy))

        # De-duplicate while preserving order.
        seen: set[BlockReason] = set()
        unique_reasons: list[BlockReason] = []
        for reason in reasons:
            if reason not in seen:
                seen.add(reason)
                unique_reasons.append(reason)

        approved = len(unique_reasons) == 0
        return RiskDecision(
            signal_id=signal.signal_id,
            approved=approved,
            reasons=unique_reasons,
            sizing=sizing,
        )

    def evaluate_and_mark(
        self, signal: TradingSignal, context: RiskContext | None = None
    ) -> tuple[TradingSignal, RiskDecision]:
        """Evaluate and return a copy of the signal with ``risk_status`` updated."""
        decision = self.evaluate(signal, context)
        new_status = RiskStatus.APPROVED if decision.approved else RiskStatus.BLOCKED
        updated = signal.model_copy(update={"risk_status": new_status})
        return updated, decision
