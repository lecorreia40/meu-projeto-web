"""Technical Quant Agent (mock, deterministic, feature-driven)."""

from __future__ import annotations

from agents.base_agent import BaseAgent, Stance
from features.pipeline import FeatureSet


class TechnicalQuantAgent(BaseAgent):
    prompt_name = "technical_quant"
    display_name = "Technical Quant Agent"

    def analyze(self, f: FeatureSet) -> tuple[Stance, float, str, list[str]]:
        if not f.is_complete:
            return (
                Stance.NEUTRAL,
                0.1,
                "Insufficient price history for a reliable technical read.",
                ["insufficient_history"],
            )

        assert f.rsi14 is not None and f.momentum20 is not None
        points: list[str] = []
        bullish_factors = 0
        bearish_factors = 0

        if f.above_sma20:
            bullish_factors += 1
            points.append("price above SMA20")
        else:
            bearish_factors += 1
            points.append("price below SMA20")

        if f.above_sma50:
            bullish_factors += 1
            points.append("price above SMA50")
        else:
            bearish_factors += 1
            points.append("price below SMA50")

        if f.momentum20 > 0:
            bullish_factors += 1
            points.append(f"positive 20d momentum ({f.momentum20:.1%})")
        else:
            bearish_factors += 1
            points.append(f"negative 20d momentum ({f.momentum20:.1%})")

        overbought = f.rsi14 > 70
        oversold = f.rsi14 < 30
        if overbought:
            bearish_factors += 1
            points.append(f"overbought RSI ({f.rsi14:.0f})")
        elif oversold:
            points.append(f"oversold RSI ({f.rsi14:.0f})")
        else:
            points.append(f"neutral RSI ({f.rsi14:.0f})")

        total = bullish_factors + bearish_factors
        net = (bullish_factors - bearish_factors) / total if total else 0.0
        if net > 0.2 and not overbought:
            stance = Stance.BULLISH
        elif net < -0.2:
            stance = Stance.BEARISH
        else:
            stance = Stance.NEUTRAL
        confidence = min(0.9, 0.4 + abs(net) * 0.5)
        rationale = (
            f"Trend/momentum net score {net:+.2f}; RSI {f.rsi14:.0f}; "
            f"ATR {f.atr14:.2f}. " + ("Caution: overbought. " if overbought else "")
        )
        return (stance, confidence, rationale, points)
