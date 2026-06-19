"""Dependency injection wiring for the API.

Provides process-wide singletons for the in-memory repositories, the risk
engine, and the structured logger. Using the in-memory backend keeps the MVP
runnable with zero external services.
"""

from __future__ import annotations

from functools import lru_cache

from app.config import Settings, get_settings
from core.logging import StructuredLogger, get_logger
from memos.memo_repository import MemoRepository
from risk.risk_engine import RiskEngine
from signals.signal_repository import SignalRepository


@lru_cache
def get_memo_repository() -> MemoRepository:
    return MemoRepository()


@lru_cache
def get_signal_repository() -> SignalRepository:
    return SignalRepository()


@lru_cache
def get_risk_engine() -> RiskEngine:
    return RiskEngine()


@lru_cache
def get_app_logger() -> StructuredLogger:
    settings: Settings = get_settings()
    return get_logger("api", file_path=f"{settings.log_dir}/audit.jsonl")
