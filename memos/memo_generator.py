"""Investment Memo Engine.

Assembles a structured :class:`InvestmentMemo` from the agent swarm's opinions
and enforces completeness. The mandatory ``skeptic_view`` is always required —
a memo without it can never be marked COMPLETE.
"""

from __future__ import annotations

from agents.base_agent import AgentOpinion
from agents.risk_analyst import RiskProposal
from core.enums import AssetType, Direction
from memos.memo_schema import InvestmentMemo, MemoStatus

# Fields that must be present and non-empty for a memo to be COMPLETE.
REQUIRED_MEMO_FIELDS: tuple[str, ...] = (
    "memo_id", "symbol", "asset_type", "direction", "thesis", "catalyst",
    "time_horizon", "entry_logic", "risk_summary", "skeptic_view",
    "confidence_score", "data_sources", "created_at", "model_version",
    "prompt_version", "status",
)


def missing_memo_fields(memo: InvestmentMemo) -> list[str]:
    """Return the names of required fields that are missing or empty."""
    missing: list[str] = []
    for field in REQUIRED_MEMO_FIELDS:
        value = getattr(memo, field, None)
        if value is None:
            missing.append(field)
        elif isinstance(value, str) and value.strip() == "":
            missing.append(field)
        elif isinstance(value, list) and len(value) == 0:
            missing.append(field)
    return missing


def is_memo_complete(memo: InvestmentMemo) -> bool:
    """A memo is complete only if all required fields (incl. skeptic_view) are
    present AND its status is COMPLETE."""
    return memo.status is MemoStatus.COMPLETE and not missing_memo_fields(memo)


class MemoGenerator:
    """Builds investment memos from agent opinions and a risk proposal."""

    def build(
        self,
        *,
        symbol: str,
        asset_type: AssetType,
        direction: Direction,
        opinions: dict[str, AgentOpinion],
        skeptic_view: str,
        risk_proposal: RiskProposal,
        confidence: float,
        model_version: str,
        prompt_version: str,
        status: MemoStatus,
    ) -> InvestmentMemo:
        tech = opinions.get("technical")
        fund = opinions.get("fundamental")
        news = opinions.get("news")
        macro = opinions.get("macro")

        thesis_parts = [o.rationale for o in (fund, tech, macro) if o is not None]
        thesis = " ".join(thesis_parts) or f"Long thesis for {symbol}."

        catalyst_parts = []
        if news is not None:
            catalyst_parts.append(news.rationale)
        if macro is not None:
            catalyst_parts.append(macro.rationale)
        catalyst = " ".join(catalyst_parts) or "Trend continuation / sector rotation."

        entry_logic = (
            f"Enter long near {risk_proposal.entry_price:.2f}; "
            f"stop {risk_proposal.stop_loss:.2f}, target {risk_proposal.take_profit:.2f} "
            f"(reward:risk {risk_proposal.reward_risk:.1f}). {risk_proposal.rationale}"
        )
        risk_summary = (
            f"Risk capped at {risk_proposal.max_risk_pct:.1f}% of equity, "
            f"position at most {risk_proposal.max_position_pct:.1f}%. "
            f"Stop distance {risk_proposal.atr_used:.2f} (ATR-based)."
        )

        data_sources = sorted({o.agent for o in opinions.values()} | {"mock_ohlcv"})

        return InvestmentMemo(
            symbol=symbol,
            asset_type=asset_type,
            direction=direction,
            thesis=thesis,
            catalyst=catalyst,
            time_horizon=risk_proposal.time_horizon,
            entry_logic=entry_logic,
            risk_summary=risk_summary,
            skeptic_view=skeptic_view,
            confidence_score=round(confidence, 4),
            data_sources=data_sources,
            model_version=model_version,
            prompt_version=prompt_version,
            status=status,
        )
