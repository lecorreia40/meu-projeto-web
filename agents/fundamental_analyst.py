"""Fundamental Analyst Agent (mock, deterministic)."""

from __future__ import annotations

from agents.base_agent import BaseAgent, Stance, stable_unit
from core.enums import AssetType
from data.universe import UNIVERSE
from features.pipeline import FeatureSet


class FundamentalAnalystAgent(BaseAgent):
    prompt_name = "fundamental_analyst"
    display_name = "Fundamental Analyst Agent"

    def analyze(self, f: FeatureSet) -> tuple[Stance, float, str, list[str]]:
        asset = UNIVERSE.get(f.symbol)
        # ETFs are baskets: stay closer to neutral with modest confidence.
        if asset is not None and asset.asset_type is AssetType.ETF:
            score = 0.5 + (stable_unit(f.symbol, "etf") - 0.5) * 0.3
            stance = Stance.NEUTRAL if abs(score - 0.5) < 0.08 else (
                Stance.BULLISH if score > 0.5 else Stance.BEARISH
            )
            return (
                stance,
                0.4,
                f"{f.symbol} is an ETF basket; fundamentals assessed at index level "
                f"(quality score {score:.2f}).",
                ["etf_basket", f"quality_score={score:.2f}"],
            )

        # Single names: deterministic pseudo-fundamental quality score.
        quality = stable_unit(f.symbol, "fundamental")
        growth = stable_unit(f.symbol, "growth")
        leverage = stable_unit(f.symbol, "leverage")  # higher = more debt = worse
        composite = (quality * 0.5) + (growth * 0.35) + ((1 - leverage) * 0.15)

        if composite > 0.58:
            stance = Stance.BULLISH
        elif composite < 0.42:
            stance = Stance.BEARISH
        else:
            stance = Stance.NEUTRAL
        confidence = min(0.85, 0.4 + abs(composite - 0.5) * 0.8)
        points = [
            f"quality={quality:.2f}",
            f"growth={growth:.2f}",
            f"leverage={leverage:.2f}",
        ]
        rationale = (
            f"Business-quality composite {composite:.2f} from quality/growth/debt; "
            f"{'attractive' if composite > 0.58 else 'weak' if composite < 0.42 else 'mixed'} profile."
        )
        return (stance, confidence, rationale, points)
