"""Signal Engine.

Converts a COMPLETE investment memo (plus the risk analyst's proposed
parameters) into a structured :class:`TradingSignal`.

Two hard gates:
  * An **incomplete memo cannot become a signal** (``from_memo`` raises
    :class:`MemoIncompleteError`).
  * An **incomplete signal cannot go to risk review**
    (:func:`validate_ready_for_risk` raises :class:`SignalIncompleteError`).
"""

from __future__ import annotations

from agents.risk_analyst import RiskProposal
from core.exceptions import MemoIncompleteError, SignalIncompleteError
from memos.memo_generator import is_memo_complete, missing_memo_fields
from memos.memo_schema import InvestmentMemo
from signals.signal_schema import EntryType, RiskStatus, TradingSignal

# Fields a signal must carry before it may be submitted to the risk engine.
RISK_REVIEW_REQUIRED_FIELDS: tuple[str, ...] = (
    "stop_loss", "take_profit", "max_position_pct", "max_risk_pct", "time_horizon",
)


def validate_ready_for_risk(signal: TradingSignal) -> None:
    """Raise :class:`SignalIncompleteError` if the signal is not risk-reviewable.

    The Pydantic schema already enforces presence at construction; this is an
    explicit, auditable second gate (and catches post-hoc tampering / partial
    objects).
    """
    missing: list[str] = []
    for field in RISK_REVIEW_REQUIRED_FIELDS:
        value = getattr(signal, field, None)
        if value is None:
            missing.append(field)
        elif isinstance(value, (int, float)) and not isinstance(value, bool) and value <= 0:
            missing.append(field)
    if missing:
        raise SignalIncompleteError(
            f"signal {getattr(signal, 'signal_id', '?')} is not ready for risk review",
            missing=missing,
        )


class SignalEngine:
    """Builds validated trading signals from memos."""

    def from_memo(
        self,
        memo: InvestmentMemo,
        risk_proposal: RiskProposal,
        *,
        entry_type: EntryType = EntryType.LIMIT,
        requires_backtest: bool = True,
    ) -> TradingSignal:
        """Convert a COMPLETE memo into a :class:`TradingSignal`.

        Raises :class:`MemoIncompleteError` if the memo is not complete (this is
        the "incomplete memos cannot become signals" guarantee).
        """
        if not is_memo_complete(memo):
            raise MemoIncompleteError(
                f"memo {memo.memo_id} is not COMPLETE; cannot generate a signal",
                missing=missing_memo_fields(memo) or ["status!=COMPLETE"],
            )

        signal = TradingSignal(
            memo_id=memo.memo_id,
            symbol=memo.symbol,
            direction=memo.direction,
            entry_type=entry_type,
            entry_price=risk_proposal.entry_price,
            stop_loss=risk_proposal.stop_loss,
            take_profit=risk_proposal.take_profit,
            max_position_pct=risk_proposal.max_position_pct,
            max_risk_pct=risk_proposal.max_risk_pct,
            time_horizon=risk_proposal.time_horizon,
            confidence_score=memo.confidence_score,
            requires_backtest=requires_backtest,
            risk_status=RiskStatus.PENDING,
        )
        # Defensive: ensure the freshly built signal is risk-reviewable.
        validate_ready_for_risk(signal)
        return signal
