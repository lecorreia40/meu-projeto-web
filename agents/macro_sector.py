"""Macro and Sector Agent (mock, deterministic)."""

from __future__ import annotations

from agents.base_agent import BaseAgent, Stance, stable_unit
from data.universe import UNIVERSE
from features.pipeline import FeatureSet

# Coarse sector tag per symbol for the mock macro read.
_SECTOR: dict[str, str] = {
    "XLK": "technology", "XLF": "financials", "XLE": "energy", "XLI": "industrials",
    "XLV": "healthcare", "XLY": "discretionary", "XLP": "staples",
    "AAPL": "technology", "MSFT": "technology", "NVDA": "technology",
    "AMZN": "discretionary", "META": "technology", "GOOGL": "technology",
    "TSLA": "discretionary", "JPM": "financials", "V": "financials", "MA": "financials",
    "SPY": "broad", "QQQ": "broad", "IWM": "broad", "DIA": "broad",
}


class MacroSectorAgent(BaseAgent):
    prompt_name = "macro_sector"
    display_name = "Macro and Sector Agent"

    def analyze(self, f: FeatureSet) -> tuple[Stance, float, str, list[str]]:
        sector = _SECTOR.get(f.symbol, "broad")
        regime = stable_unit("macro_regime", sector)   # sector rotation favorability
        rates_risk = stable_unit("rates", sector)        # higher = more rate headwind

        score = regime - rates_risk * 0.5
        if score > 0.25:
            stance = Stance.BULLISH
        elif score < -0.1:
            stance = Stance.BEARISH
        else:
            stance = Stance.NEUTRAL
        confidence = min(0.7, 0.3 + abs(score) * 0.6)
        points = [
            f"sector={sector}",
            f"rotation={regime:.2f}",
            f"rate_headwind={rates_risk:.2f}",
        ]
        rationale = (
            f"Sector '{sector}' rotation score {regime:.2f} against rate headwind "
            f"{rates_risk:.2f}; net macro {'tailwind' if score > 0.25 else 'headwind' if score < -0.1 else 'neutral'}."
        )
        return (stance, confidence, rationale, points)
