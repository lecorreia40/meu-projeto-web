"""Skeptic / Red Team Agent (mock, deterministic).

MANDATORY for every memo: it must argue *against* the prevailing thesis. It
enumerates the bear case and the conditions that would invalidate the thesis,
and assigns a skeptic confidence (how strong the bear case is). Its rationale
becomes the memo's required ``skeptic_view``.
"""

from __future__ import annotations

from agents.base_agent import AgentOpinion, BaseAgent, Stance, stable_unit
from features.pipeline import FeatureSet


class SkepticAgent(BaseAgent):
    prompt_name = "skeptic"
    display_name = "Skeptic / Red Team Agent"

    def analyze(self, f: FeatureSet) -> tuple[Stance, float, str, list[str]]:
        risks: list[str] = []
        strength = 0.2  # there is always *some* bear case

        if f.rsi14 is not None and f.rsi14 > 68:
            risks.append(f"overbought (RSI {f.rsi14:.0f}) — vulnerable to mean reversion")
            strength += 0.2
        if f.annualized_vol is not None and f.annualized_vol > 0.35:
            risks.append(f"elevated volatility ({f.annualized_vol:.0%} annualized) widens drawdown risk")
            strength += 0.15
        if not f.above_sma50:
            risks.append("price below SMA50 — primary trend not confirmed")
            strength += 0.15
        if f.momentum20 is not None and f.momentum20 < 0:
            risks.append("negative momentum may continue")
            strength += 0.15

        # An always-present event/valuation caveat (red-team discipline).
        event_risk = stable_unit(f.symbol, "event_risk")
        risks.append(
            f"valuation/event risk: catalyst may already be priced in (event_risk={event_risk:.2f})"
        )
        if event_risk > 0.6:
            strength += 0.1

        strength = min(0.95, strength)
        invalidation = "Thesis invalidated if price closes below the stop or the catalyst fails to materialize."
        rationale = "Bear case: " + "; ".join(risks) + ". " + invalidation
        # The skeptic leans bearish by construction; stance reflects bear strength.
        stance = Stance.BEARISH if strength >= 0.4 else Stance.NEUTRAL
        return (stance, strength, rationale, risks)

    def skeptic_view(self, f: FeatureSet) -> tuple[str, float]:
        """Convenience: return ``(skeptic_view_text, skeptic_strength)``."""
        opinion: AgentOpinion = self.run(f)
        return (opinion.rationale, opinion.confidence)
