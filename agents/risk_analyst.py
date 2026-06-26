"""Risk Analyst Agent (mock, deterministic).

SUGGESTS risk parameters derived from ATR/volatility. It CANNOT approve trades —
the deterministic risk engine has final authority. The orchestrator/signal
engine consume :meth:`propose` to fill a signal's risk fields.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from agents.base_agent import BaseAgent, Stance
from core.enums import Direction, TimeHorizon
from features.pipeline import FeatureSet


class RiskProposal(BaseModel):
    """Suggested (not approved) risk parameters for a candidate trade."""

    model_config = ConfigDict(frozen=True)

    entry_price: float
    stop_loss: float
    take_profit: float
    max_position_pct: float
    max_risk_pct: float
    time_horizon: TimeHorizon
    atr_used: float
    reward_risk: float
    rationale: str


class RiskAnalystAgent(BaseAgent):
    prompt_name = "risk_analyst"
    display_name = "Risk Analyst Agent"

    #: Suggestions are intentionally bounded by the MVP policy caps.
    DEFAULT_MAX_POSITION_PCT = 2.0
    DEFAULT_MAX_RISK_PCT = 1.0
    STOP_ATR_MULT = 2.0
    REWARD_RISK = 2.5

    def analyze(self, f: FeatureSet) -> tuple[Stance, float, str, list[str]]:
        # The risk analyst takes no directional view; it assesses data adequacy.
        confidence = 0.6 if f.is_complete else 0.2
        rationale = "Risk analyst proposes parameters only; it cannot approve trades."
        return (Stance.NEUTRAL, confidence, rationale, ["advisory_only"])

    def propose(
        self, f: FeatureSet, *, direction: Direction = Direction.LONG
    ) -> RiskProposal:
        """Propose stop/target/sizing for a (long) candidate from ATR."""
        entry = f.last_price
        # Fall back to a 2% notional stop if ATR is unavailable.
        atr_used = f.atr14 if f.atr14 is not None else entry * 0.02
        stop_distance = self.STOP_ATR_MULT * atr_used

        if direction is Direction.LONG:
            stop_loss = max(0.01, entry - stop_distance)
            take_profit = entry + self.REWARD_RISK * stop_distance
        else:  # not used in the MVP (long-only) but kept symmetric
            stop_loss = entry + stop_distance
            take_profit = max(0.01, entry - self.REWARD_RISK * stop_distance)

        # Scale position down when volatility is high.
        max_position_pct = self.DEFAULT_MAX_POSITION_PCT
        if f.annualized_vol is not None and f.annualized_vol > 0.40:
            max_position_pct = 1.5

        # Horizon from trend strength.
        if f.above_sma50 and (f.momentum20 or 0) > 0.05:
            horizon = TimeHorizon.POSITION
        else:
            horizon = TimeHorizon.SWING

        reward_risk = (
            abs(take_profit - entry) / abs(entry - stop_loss)
            if entry != stop_loss
            else 0.0
        )
        rationale = (
            f"Stop at {self.STOP_ATR_MULT}x ATR ({atr_used:.2f}); "
            f"reward:risk {reward_risk:.1f}; position cap {max_position_pct:.1f}% "
            f"(vol-adjusted), risk/trade {self.DEFAULT_MAX_RISK_PCT:.1f}%."
        )
        return RiskProposal(
            entry_price=round(entry, 2),
            stop_loss=round(stop_loss, 2),
            take_profit=round(take_profit, 2),
            max_position_pct=max_position_pct,
            max_risk_pct=self.DEFAULT_MAX_RISK_PCT,
            time_horizon=horizon,
            atr_used=round(atr_used, 4),
            reward_risk=round(reward_risk, 2),
            rationale=rationale,
        )
