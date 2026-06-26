"""Repository for trading signals (in-memory or durable SQLite)."""

from __future__ import annotations

from data.storage.memory import InMemoryRepository
from data.storage.sqlite import SQLiteRepository
from signals.signal_schema import RiskStatus, TradingSignal


def _by_status(signals: list[TradingSignal], status: RiskStatus) -> list[TradingSignal]:
    return [s for s in signals if s.risk_status == status]


class SignalRepository(InMemoryRepository[TradingSignal]):
    """In-memory store of trading signals keyed by ``signal_id``."""

    def __init__(self) -> None:
        super().__init__(id_attr="signal_id")

    def by_status(self, status: RiskStatus) -> list[TradingSignal]:
        return _by_status(self.list(), status)

    def approved(self) -> list[TradingSignal]:
        return self.by_status(RiskStatus.APPROVED)


class DurableSignalRepository(SQLiteRepository[TradingSignal]):
    """SQLite-backed store of trading signals (same interface)."""

    def __init__(self, db_path: str = "./data_store/mesa.db") -> None:
        super().__init__(
            db_path, table="signals", id_attr="signal_id", model_type=TradingSignal
        )

    def by_status(self, status: RiskStatus) -> list[TradingSignal]:
        return _by_status(self.list(), status)

    def approved(self) -> list[TradingSignal]:
        return self.by_status(RiskStatus.APPROVED)
