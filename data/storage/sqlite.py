"""SQLite-backed durable repositories.

Implements the same :class:`~data.storage.base.Repository` interface as the
in-memory store, so callers are unchanged when persistence is turned on. Pydantic
models are stored as JSON in a single ``data`` column keyed by their id.

SQLite is dependency-free (stdlib) and gives the MVP real durability and
cross-process reads (the dashboard can read what the pipeline wrote). PostgreSQL
remains the production target via :mod:`data.storage.postgres`, behind the very
same interface.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Generic, TypeVar

from pydantic import BaseModel

from data.storage.base import Repository

T = TypeVar("T", bound=BaseModel)


class SQLiteRepository(Repository[T], Generic[T]):
    """A durable repository for a single Pydantic model type."""

    def __init__(
        self,
        db_path: str | Path,
        *,
        table: str,
        id_attr: str,
        model_type: type[T],
    ) -> None:
        self._db_path = str(db_path)
        self._table = table
        self._id_attr = id_attr
        self._model_type = model_type
        if db_path != ":memory:":
            Path(self._db_path).parent.mkdir(parents=True, exist_ok=True)
        # One shared connection; serialized access is fine for the single-owner MVP.
        self._conn = sqlite3.connect(self._db_path, check_same_thread=False)
        self._conn.execute(
            f"CREATE TABLE IF NOT EXISTS {self._table} "
            "(id TEXT PRIMARY KEY, data TEXT NOT NULL)"
        )
        self._conn.commit()

    def _key(self, entity: T) -> str:
        return str(getattr(entity, self._id_attr))

    def _deserialize(self, payload: str) -> T:
        return self._model_type.model_validate_json(payload)

    def add(self, entity: T) -> T:
        key = self._key(entity)
        try:
            self._conn.execute(
                f"INSERT INTO {self._table} (id, data) VALUES (?, ?)",
                (key, entity.model_dump_json()),
            )
        except sqlite3.IntegrityError as exc:
            raise ValueError(f"entity with id {key!r} already exists") from exc
        self._conn.commit()
        return entity

    def get(self, entity_id: str) -> T | None:
        row = self._conn.execute(
            f"SELECT data FROM {self._table} WHERE id = ?", (entity_id,)
        ).fetchone()
        return self._deserialize(row[0]) if row else None

    def list(self) -> list[T]:
        rows = self._conn.execute(
            f"SELECT data FROM {self._table} ORDER BY rowid"
        ).fetchall()
        return [self._deserialize(r[0]) for r in rows]

    def update(self, entity: T) -> T:
        key = self._key(entity)
        cur = self._conn.execute(
            f"UPDATE {self._table} SET data = ? WHERE id = ?",
            (entity.model_dump_json(), key),
        )
        if cur.rowcount == 0:
            raise KeyError(f"entity with id {key!r} does not exist")
        self._conn.commit()
        return entity

    def delete(self, entity_id: str) -> bool:
        cur = self._conn.execute(
            f"DELETE FROM {self._table} WHERE id = ?", (entity_id,)
        )
        self._conn.commit()
        return cur.rowcount > 0

    def count(self) -> int:
        row = self._conn.execute(f"SELECT COUNT(*) FROM {self._table}").fetchone()
        return int(row[0])

    def close(self) -> None:
        self._conn.close()
