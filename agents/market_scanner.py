"""Market Scanner Agent (mock, deterministic).

Shortlists candidate opportunities from the universe using trend, momentum, and
liquidity. Produces a per-symbol opinion and a ranked candidate list.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from agents.base_agent import AgentOpinion, BaseAgent, Stance
from features.pipeline import FeatureSet


class ScanCandidate(BaseModel):
    model_config = ConfigDict(frozen=True)

    symbol: str
    score: float
    opinion: AgentOpinion


class MarketScannerAgent(BaseAgent):
    prompt_name = "market_scanner"
    display_name = "Market Scanner Agent"

    def _score(self, f: FeatureSet) -> float:
        if not f.is_complete:
            return 0.0
        assert f.momentum20 is not None and f.liquidity is not None and f.rsi14 is not None
        score = 0.0
        if f.above_sma20:
            score += 0.30
        if f.above_sma50:
            score += 0.20
        if f.momentum20 > 0:
            score += min(0.30, f.momentum20 * 2.0)
        score += f.liquidity * 0.20
        if f.rsi14 > 75:  # too hot, fade the score
            score -= 0.15
        return max(0.0, min(1.0, score))

    def analyze(self, f: FeatureSet) -> tuple[Stance, float, str, list[str]]:
        score = self._score(f)
        if not f.is_complete:
            return (Stance.NEUTRAL, 0.1, "Insufficient history to scan.", ["insufficient_history"])
        stance = Stance.BULLISH if score >= 0.55 else (
            Stance.NEUTRAL if score >= 0.4 else Stance.BEARISH
        )
        points = [
            "above_sma20" if f.above_sma20 else "below_sma20",
            f"momentum20={f.momentum20:.1%}" if f.momentum20 is not None else "momentum=na",
            f"liquidity={f.liquidity:.2f}" if f.liquidity is not None else "liquidity=na",
        ]
        rationale = f"Scan score {score:.2f} from trend, momentum, and liquidity."
        return (stance, min(0.85, 0.4 + score * 0.5), rationale, points)

    def scan(self, feature_sets: list[FeatureSet], *, top_n: int | None = None,
             min_score: float = 0.55) -> list[ScanCandidate]:
        """Rank symbols and return the candidates above ``min_score``."""
        candidates: list[ScanCandidate] = []
        for f in feature_sets:
            score = self._score(f)
            if score >= min_score:
                candidates.append(
                    ScanCandidate(symbol=f.symbol, score=score, opinion=self.run(f))
                )
        candidates.sort(key=lambda c: c.score, reverse=True)
        return candidates if top_n is None else candidates[:top_n]
