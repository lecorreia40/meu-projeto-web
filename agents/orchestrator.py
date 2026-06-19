"""Orchestrator Agent.

Coordinates the research swarm and writes the final investment memo. It NEVER
executes trades and never touches the broker — it produces memos only. The
mandatory skeptic view is always attached, even to rejected theses.

Workflow: scanner context -> fundamental / technical / news / macro analysts ->
skeptic (argues against) -> risk analyst (suggests params) -> orchestrator
aggregates confidence and writes the memo.
"""

from __future__ import annotations

from agents.base_agent import AgentOpinion, LLMClient, MockLLMClient, Stance, load_prompt
from agents.fundamental_analyst import FundamentalAnalystAgent
from agents.macro_sector import MacroSectorAgent
from agents.news_sentiment import NewsSentimentAgent
from agents.risk_analyst import RiskAnalystAgent, RiskProposal
from agents.skeptic import SkepticAgent
from agents.technical_quant import TechnicalQuantAgent
from core.enums import Direction
from data.universe import UNIVERSE
from features.pipeline import FeatureSet
from memos.memo_generator import MemoGenerator
from memos.memo_schema import InvestmentMemo, MemoStatus
from pydantic import BaseModel, ConfigDict


class SwarmResult(BaseModel):
    """Everything the swarm produced for one symbol (for audit/dashboard)."""

    model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)

    symbol: str
    opinions: dict[str, AgentOpinion]
    skeptic_view: str
    skeptic_strength: float
    risk_proposal: RiskProposal
    net_score: float
    aggregate_confidence: float
    memo: InvestmentMemo


class OrchestratorAgent:
    """Runs the swarm and renders an investment memo."""

    #: Minimum aggregate (post-skeptic) confidence to mark a memo COMPLETE.
    CONFIDENCE_THRESHOLD = 0.15

    def __init__(self, llm: LLMClient | None = None) -> None:
        self.llm = llm or MockLLMClient()
        _, self.prompt_version = load_prompt("orchestrator")
        self.fundamental = FundamentalAnalystAgent(self.llm)
        self.technical = TechnicalQuantAgent(self.llm)
        self.news = NewsSentimentAgent(self.llm)
        self.macro = MacroSectorAgent(self.llm)
        self.skeptic = SkepticAgent(self.llm)
        self.risk_analyst = RiskAnalystAgent(self.llm)
        self.generator = MemoGenerator()

    @property
    def model_version(self) -> str:
        return self.llm.model_version

    @staticmethod
    def _signed(opinion: AgentOpinion) -> float:
        if opinion.stance is Stance.BULLISH:
            return opinion.confidence
        if opinion.stance is Stance.BEARISH:
            return -opinion.confidence
        return 0.0

    def run(self, features: FeatureSet) -> SwarmResult:
        opinions: dict[str, AgentOpinion] = {
            "fundamental": self.fundamental.run(features),
            "technical": self.technical.run(features),
            "news": self.news.run(features),
            "macro": self.macro.run(features),
        }

        # Skeptic always runs and always argues against (mandatory skeptic_view).
        skeptic_view, skeptic_strength = self.skeptic.skeptic_view(features)

        # Aggregate the four directional analysts.
        signed = [self._signed(o) for o in opinions.values()]
        net = sum(signed) / len(signed) if signed else 0.0
        base_bull = max(0.0, net)
        aggregate_conf = base_bull * (1.0 - 0.5 * skeptic_strength)

        risk_proposal = self.risk_analyst.propose(features, direction=Direction.LONG)

        # Long-only: only a net-bullish, sufficiently-confident, fully-featured
        # thesis becomes a COMPLETE memo eligible for signal generation.
        if (
            net > 0.0
            and aggregate_conf >= self.CONFIDENCE_THRESHOLD
            and features.is_complete
        ):
            status = MemoStatus.COMPLETE
        else:
            status = MemoStatus.REJECTED

        asset_type = UNIVERSE[features.symbol].asset_type
        memo = self.generator.build(
            symbol=features.symbol,
            asset_type=asset_type,
            direction=Direction.LONG,
            opinions=opinions,
            skeptic_view=skeptic_view,
            risk_proposal=risk_proposal,
            confidence=aggregate_conf,
            model_version=self.model_version,
            prompt_version=self.prompt_version,
            status=status,
        )

        return SwarmResult(
            symbol=features.symbol,
            opinions=opinions,
            skeptic_view=skeptic_view,
            skeptic_strength=skeptic_strength,
            risk_proposal=risk_proposal,
            net_score=net,
            aggregate_confidence=aggregate_conf,
            memo=memo,
        )
