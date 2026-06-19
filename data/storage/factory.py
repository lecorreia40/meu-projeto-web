"""Repository factory.

Chooses a memo/signal repository implementation from configuration. Callers ask
for an interface; the backend (in-memory, durable SQLite, or — later —
PostgreSQL) is a deployment detail.
"""

from __future__ import annotations

from app.config import RepositoryBackend, Settings, get_settings
from data.storage.base import Repository
from memos.memo_repository import DurableMemoRepository, MemoRepository
from memos.memo_schema import InvestmentMemo
from signals.signal_repository import DurableSignalRepository, SignalRepository
from signals.signal_schema import TradingSignal


def build_memo_repository(settings: Settings | None = None) -> Repository[InvestmentMemo]:
    settings = settings or get_settings()
    if settings.repository_backend is RepositoryBackend.SQLITE:
        return DurableMemoRepository(settings.sqlite_path)
    if settings.repository_backend is RepositoryBackend.POSTGRES:
        raise NotImplementedError(
            "PostgreSQL backend is not enabled in the MVP; use 'memory' or 'sqlite'."
        )
    return MemoRepository()


def build_signal_repository(settings: Settings | None = None) -> Repository[TradingSignal]:
    settings = settings or get_settings()
    if settings.repository_backend is RepositoryBackend.SQLITE:
        return DurableSignalRepository(settings.sqlite_path)
    if settings.repository_backend is RepositoryBackend.POSTGRES:
        raise NotImplementedError(
            "PostgreSQL backend is not enabled in the MVP; use 'memory' or 'sqlite'."
        )
    return SignalRepository()
