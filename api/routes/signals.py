"""Trading-signal endpoints (read + create).

Creating a signal only *persists* the proposal. Approval is never granted here;
that authority belongs to the risk engine (see ``/risk/evaluate``).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_app_logger, get_signal_repository
from core.events import EventType
from core.logging import StructuredLogger
from signals.signal_repository import SignalRepository
from signals.signal_schema import TradingSignal

router = APIRouter(prefix="/signals", tags=["signals"])


@router.get("", response_model=list[TradingSignal])
def list_signals(
    repo: SignalRepository = Depends(get_signal_repository),
) -> list[TradingSignal]:
    return repo.list()


@router.get("/{signal_id}", response_model=TradingSignal)
def get_signal(
    signal_id: str, repo: SignalRepository = Depends(get_signal_repository)
) -> TradingSignal:
    signal = repo.get(signal_id)
    if signal is None:
        raise HTTPException(status_code=404, detail="signal not found")
    return signal


@router.post("", response_model=TradingSignal, status_code=201)
def create_signal(
    signal: TradingSignal,
    repo: SignalRepository = Depends(get_signal_repository),
    logger: StructuredLogger = Depends(get_app_logger),
) -> TradingSignal:
    stored = repo.add(signal)
    logger.info(
        EventType.SIGNAL_CREATED,
        entity_id=stored.signal_id,
        symbol=stored.symbol,
        memo_id=stored.memo_id,
    )
    return stored
