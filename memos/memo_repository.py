"""Repository for investment memos (in-memory or durable SQLite)."""

from __future__ import annotations

from data.storage.memory import InMemoryRepository
from data.storage.sqlite import SQLiteRepository
from memos.memo_schema import InvestmentMemo


def _for_symbol(memos: list[InvestmentMemo], symbol: str) -> list[InvestmentMemo]:
    return [m for m in memos if m.symbol == symbol]


class MemoRepository(InMemoryRepository[InvestmentMemo]):
    """In-memory store of investment memos keyed by ``memo_id``."""

    def __init__(self) -> None:
        super().__init__(id_attr="memo_id")

    def for_symbol(self, symbol: str) -> list[InvestmentMemo]:
        return _for_symbol(self.list(), symbol)


class DurableMemoRepository(SQLiteRepository[InvestmentMemo]):
    """SQLite-backed store of investment memos (same interface)."""

    def __init__(self, db_path: str = "./data_store/mesa.db") -> None:
        super().__init__(
            db_path, table="memos", id_attr="memo_id", model_type=InvestmentMemo
        )

    def for_symbol(self, symbol: str) -> list[InvestmentMemo]:
        return _for_symbol(self.list(), symbol)
