"""Repository interfaces.

The system codes against these abstract interfaces, never against a concrete
database. The MVP ships an in-memory implementation (:mod:`data.storage.memory`)
and a PostgreSQL-ready stub (:mod:`data.storage.postgres`) that will be filled
in during Phase 1+. Swapping backends must not require changes to callers.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, Protocol, TypeVar, runtime_checkable

T = TypeVar("T")


@runtime_checkable
class HasId(Protocol):
    """Anything stored in a keyed repository must expose a string id via the
    repository's configured id attribute (see :class:`Repository`)."""


class Repository(ABC, Generic[T]):
    """Abstract CRUD repository keyed by a string id.

    Concrete subclasses choose the storage medium (memory, PostgreSQL, ...).
    """

    @abstractmethod
    def add(self, entity: T) -> T:
        """Persist a new entity and return it."""

    @abstractmethod
    def get(self, entity_id: str) -> T | None:
        """Return the entity with ``entity_id`` or ``None``."""

    @abstractmethod
    def list(self) -> list[T]:
        """Return all entities (insertion order)."""

    @abstractmethod
    def update(self, entity: T) -> T:
        """Replace an existing entity (matched by id) and return it."""

    @abstractmethod
    def delete(self, entity_id: str) -> bool:
        """Remove an entity; return ``True`` if it existed."""

    @abstractmethod
    def count(self) -> int:
        """Number of stored entities."""


class TimeSeriesRepository(ABC, Generic[T]):
    """Abstract repository for OHLCV-style time-series rows keyed by symbol.

    A PostgreSQL/TimescaleDB implementation would back this with a hypertable;
    the MVP uses an in-memory list per symbol.
    """

    @abstractmethod
    def add_bars(self, symbol: str, bars: list[T]) -> int:
        """Append bars for ``symbol``; return the number stored."""

    @abstractmethod
    def get_bars(self, symbol: str, *, limit: int | None = None) -> list[T]:
        """Return bars for ``symbol`` in chronological order (optionally the last
        ``limit`` bars)."""

    @abstractmethod
    def symbols(self) -> list[str]:
        """Symbols that have at least one stored bar."""
