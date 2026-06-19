"""Durable SQLite repository + backend factory tests."""

from __future__ import annotations

import pytest

from app.config import RepositoryBackend, Settings
from core.enums import AssetType, Direction, TimeHorizon
from data.storage.factory import build_memo_repository, build_signal_repository
from memos.memo_repository import DurableMemoRepository, MemoRepository
from memos.memo_schema import InvestmentMemo, MemoStatus
from signals.signal_repository import DurableSignalRepository, SignalRepository


def _memo(symbol: str = "AAPL") -> InvestmentMemo:
    return InvestmentMemo(
        symbol=symbol, asset_type=AssetType.STOCK, direction=Direction.LONG,
        thesis="t", catalyst="c", time_horizon=TimeHorizon.SWING, entry_logic="e",
        risk_summary="r", skeptic_view="bear", confidence_score=0.5,
        data_sources=["mock"], model_version="mock-llm-v1", prompt_version="1.0.0",
        status=MemoStatus.COMPLETE,
    )


def test_sqlite_round_trip(tmp_path) -> None:
    repo = DurableMemoRepository(str(tmp_path / "mesa.db"))
    memo = _memo()
    repo.add(memo)
    assert repo.count() == 1
    fetched = repo.get(memo.memo_id)
    assert fetched is not None
    assert fetched.symbol == "AAPL"
    assert fetched.model_dump() == memo.model_dump()


def test_sqlite_durable_across_instances(tmp_path) -> None:
    db = str(tmp_path / "mesa.db")
    memo = _memo("MSFT")
    DurableMemoRepository(db).add(memo)
    # New instance, same file -> data persists.
    reopened = DurableMemoRepository(db)
    assert reopened.count() == 1
    assert reopened.get(memo.memo_id) is not None
    assert reopened.for_symbol("MSFT")


def test_sqlite_duplicate_add_raises(tmp_path) -> None:
    repo = DurableMemoRepository(str(tmp_path / "mesa.db"))
    memo = _memo()
    repo.add(memo)
    with pytest.raises(ValueError):
        repo.add(memo)


def test_sqlite_update_and_delete(tmp_path) -> None:
    repo = DurableMemoRepository(str(tmp_path / "mesa.db"))
    memo = _memo()
    repo.add(memo)
    updated = memo.model_copy(update={"status": MemoStatus.REJECTED})
    repo.update(updated)
    assert repo.get(memo.memo_id).status is MemoStatus.REJECTED
    assert repo.delete(memo.memo_id) is True
    assert repo.count() == 0
    assert repo.delete(memo.memo_id) is False


def test_signal_repo_in_memory_db() -> None:
    repo = DurableSignalRepository(":memory:")
    assert repo.count() == 0


def test_factory_selects_backend(tmp_path) -> None:
    mem_settings = Settings(repository_backend=RepositoryBackend.MEMORY)
    assert isinstance(build_memo_repository(mem_settings), MemoRepository)
    assert isinstance(build_signal_repository(mem_settings), SignalRepository)

    sql_settings = Settings(
        repository_backend=RepositoryBackend.SQLITE,
        sqlite_path=str(tmp_path / "f.db"),
    )
    assert isinstance(build_memo_repository(sql_settings), DurableMemoRepository)
    assert isinstance(build_signal_repository(sql_settings), DurableSignalRepository)


def test_factory_postgres_not_enabled() -> None:
    settings = Settings(repository_backend=RepositoryBackend.POSTGRES)
    with pytest.raises(NotImplementedError):
        build_memo_repository(settings)
