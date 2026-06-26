"""In-memory repository implementations for the MVP and tests.

These are intentionally simple, dependency-free, and deterministic. They
implement the same interfaces as the future PostgreSQL backends so callers are
backend-agnostic.
"""

from __future__ import annotations

from typing import Generic, TypeVar

from data.storage.base import Repository, TimeSeriesRepository

T = TypeVar("T")


class InMemoryRepository(Repository[T], Generic[T]):
    """Dict-backed repository keyed by a configurable id attribute."""

    def __init__(self, id_attr: str) -> None:
        self._id_attr = id_attr
        self._store: dict[str, T] = {}

    def _key(self, entity: T) -> str:
        return str(getattr(entity, self._id_attr))

    def add(self, entity: T) -> T:
        key = self._key(entity)
        if key in self._store:
            raise ValueError(f"entity with id {key!r} already exists")
        self._store[key] = entity
        return entity

    def get(self, entity_id: str) -> T | None:
        return self._store.get(entity_id)

    def list(self) -> list[T]:
        return list(self._store.values())

    def update(self, entity: T) -> T:
        key = self._key(entity)
        if key not in self._store:
            raise KeyError(f"entity with id {key!r} does not exist")
        self._store[key] = entity
        return entity

    def delete(self, entity_id: str) -> bool:
        return self._store.pop(entity_id, None) is not None

    def count(self) -> int:
        return len(self._store)


class InMemoryTimeSeriesRepository(TimeSeriesRepository[T], Generic[T]):
    """Per-symbol list of bars, kept in chronological insertion order."""

    def __init__(self) -> None:
        self._series: dict[str, list[T]] = {}

    def add_bars(self, symbol: str, bars: list[T]) -> int:
        self._series.setdefault(symbol, []).extend(bars)
        return len(bars)

    def get_bars(self, symbol: str, *, limit: int | None = None) -> list[T]:
        bars = self._series.get(symbol, [])
        if limit is not None:
            return bars[-limit:]
        return list(bars)

    def symbols(self) -> list[str]:
        return list(self._series.keys())
