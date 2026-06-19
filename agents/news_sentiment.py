"""News and Sentiment Agent (mock, deterministic)."""

from __future__ import annotations

from agents.base_agent import BaseAgent, Stance, stable_unit
from features.pipeline import FeatureSet


class NewsSentimentAgent(BaseAgent):
    prompt_name = "news_sentiment"
    display_name = "News and Sentiment Agent"

    def analyze(self, f: FeatureSet) -> tuple[Stance, float, str, list[str]]:
        sentiment = stable_unit(f.symbol, "news")          # 0 bearish .. 1 bullish
        relevance = stable_unit(f.symbol, "news_relevance")  # event importance
        priced_in = stable_unit(f.symbol, "priced_in") > 0.5

        if sentiment > 0.6:
            stance = Stance.BULLISH
        elif sentiment < 0.4:
            stance = Stance.BEARISH
        else:
            stance = Stance.NEUTRAL

        # If the event is already priced in, sentiment matters less.
        confidence = min(0.8, 0.3 + abs(sentiment - 0.5) * relevance)
        if priced_in:
            confidence *= 0.6

        points = [
            f"sentiment={sentiment:.2f}",
            f"relevance={relevance:.2f}",
            "already_priced_in" if priced_in else "not_fully_priced_in",
        ]
        rationale = (
            f"Recent-flow sentiment {sentiment:.2f} (relevance {relevance:.2f}); "
            f"event appears {'already priced in' if priced_in else 'not fully priced in'}."
        )
        return (stance, confidence, rationale, points)
