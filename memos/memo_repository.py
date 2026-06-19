"""Repository for investment memos."""

from __future__ import annotations

from data.storage.memory import InMemoryRepository
from memos.memo_schema import InvestmentMemo


class MemoRepository(InMemoryRepository[InvestmentMemo]):
    """In-memory store of investment memos keyed by ``memo_id``."""

    def __init__(self) -> None:
        super().__init__(id_attr="memo_id")

    def for_symbol(self, symbol: str) -> list[InvestmentMemo]:
        return [m for m in self.list() if m.symbol == symbol]
