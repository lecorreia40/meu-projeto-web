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

    #: The four directional analysts that may be toggled by the admin panel.
    DIRECTIONAL = ("fundamental", "technical", "news", "macro")

    def __init__(
        self,
        llm: LLMClient | None = None,
        *,
        enabled_agents: set[str] | None = None,
        confidence_threshold: float | None = None,
    ) -> None:
        self.llm = llm or MockLLMClient()
        self.confidence_threshold = (
            self.CONFIDENCE_THRESHOLD if confidence_threshold is None else confidence_threshold
        )
        _, self.prompt_version = load_prompt("orchestrator")
        self.fundamental = FundamentalAnalystAgent(self.llm)
        self.technical = TechnicalQuantAgent(self.llm)
        self.news = NewsSentimentAgent(self.llm)
        self.macro = MacroSectorAgent(self.llm)
        self.skeptic = SkepticAgent(self.llm)
        self.risk_analyst = RiskAnalystAgent(self.llm)
        self.generator = MemoGenerator()
        # None = all directional analysts enabled (unchanged default behavior).
        self.enabled_agents = (
            set(self.DIRECTIONAL) if enabled_agents is None else set(enabled_agents)
        )

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

    # --- Composable steps (also used by the explicit research graph) ---------

    def run_analysts(self, features: FeatureSet) -> dict[str, AgentOpinion]:
        agents = {
            "fundamental": self.fundamental,
            "technical": self.technical,
            "news": self.news,
            "macro": self.macro,
        }
        # Only run the directional analysts that are enabled (admin toggle).
        return {
            key: agent.run(features)
            for key, agent in agents.items()
            if key in self.enabled_agents
        }

    def aggregate(
        self, opinions: dict[str, AgentOpinion], skeptic_strength: float
    ) -> tuple[float, float]:
        """Return ``(net_score, aggregate_confidence)``."""
        signed = [self._signed(o) for o in opinions.values()]
        net = sum(signed) / len(signed) if signed else 0.0
        base_bull = max(0.0, net)
        aggregate_conf = base_bull * (1.0 - 0.5 * skeptic_strength)
        return net, aggregate_conf

    def decide_status(
        self, net: float, aggregate_conf: float, features: FeatureSet
    ) -> MemoStatus:
        if net > 0.0 and aggregate_conf >= self.confidence_threshold and features.is_complete:
            return MemoStatus.COMPLETE
        return MemoStatus.REJECTED

    def run(self, features: FeatureSet) -> SwarmResult:
        opinions = self.run_analysts(features)

        # Skeptic always runs and always argues against (mandatory skeptic_view).
        skeptic_view, skeptic_strength = self.skeptic.skeptic_view(features)

        net, aggregate_conf = self.aggregate(opinions, skeptic_strength)
        risk_proposal = self.risk_analyst.propose(features, direction=Direction.LONG)
        status = self.decide_status(net, aggregate_conf, features)

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
