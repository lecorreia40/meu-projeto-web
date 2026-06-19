"""Repository for trading signals."""

from __future__ import annotations

from data.storage.memory import InMemoryRepository
from signals.signal_schema import RiskStatus, TradingSignal


class SignalRepository(InMemoryRepository[TradingSignal]):
    """In-memory store of trading signals keyed by ``signal_id``."""

    def __init__(self) -> None:
        super().__init__(id_attr="signal_id")

    def by_status(self, status: RiskStatus) -> list[TradingSignal]:
        return [s for s in self.list() if s.risk_status == status]

    def approved(self) -> list[TradingSignal]:
        return self.by_status(RiskStatus.APPROVED)
