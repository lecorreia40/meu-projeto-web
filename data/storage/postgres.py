"""PostgreSQL-ready repository stubs.

These document the intended PostgreSQL/TimescaleDB backend and satisfy the same
interfaces as the in-memory repositories, but they are NOT wired up in Sprint 1.
The MVP runs entirely on the in-memory implementations
(:mod:`data.storage.memory`). Attempting to use these before Phase 1 raises
``NotImplementedError`` so there is no silent half-working DB path.

Reference DDL for the core tables lives in ``docs/data-architecture.md``.
"""

from __future__ import annotations

from typing import Generic, TypeVar

from data.storage.base import Repository, TimeSeriesRepository

T = TypeVar("T")

_NOT_READY = (
    "PostgreSQL backend is not enabled in the Sprint 1 MVP. "
    "Set REPOSITORY_BACKEND=memory (default) or implement this in Phase 1."
)


class PostgresRepository(Repository[T], Generic[T]):
    """Placeholder for a psycopg-backed repository (Phase 1+)."""

    def __init__(self, dsn: str, table: str, id_column: str) -> None:
        self._dsn = dsn
        self._table = table
        self._id_column = id_column

    def add(self, entity: T) -> T:  # pragma: no cover - not implemented in MVP
        raise NotImplementedError(_NOT_READY)

    def get(self, entity_id: str) -> T | None:  # pragma: no cover
        raise NotImplementedError(_NOT_READY)

    def list(self) -> list[T]:  # pragma: no cover
        raise NotImplementedError(_NOT_READY)

    def update(self, entity: T) -> T:  # pragma: no cover
        raise NotImplementedError(_NOT_READY)

    def delete(self, entity_id: str) -> bool:  # pragma: no cover
        raise NotImplementedError(_NOT_READY)

    def count(self) -> int:  # pragma: no cover
        raise NotImplementedError(_NOT_READY)


class TimescaleBarRepository(TimeSeriesRepository[T], Generic[T]):
    """Placeholder for a TimescaleDB hypertable OHLCV store (Phase 1+)."""

    def __init__(self, dsn: str, table: str = "market_bars") -> None:
        self._dsn = dsn
        self._table = table

    def add_bars(self, symbol: str, bars: list[T]) -> int:  # pragma: no cover
        raise NotImplementedError(_NOT_READY)

    def get_bars(self, symbol: str, *, limit: int | None = None) -> list[T]:  # pragma: no cover
        raise NotImplementedError(_NOT_READY)

    def symbols(self) -> list[str]:  # pragma: no cover
        raise NotImplementedError(_NOT_READY)
