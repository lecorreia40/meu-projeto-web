"""Structured JSONL logging.

Per the observability policy, **every** log record includes at minimum:
``timestamp``, ``event_type``, ``entity_id``, and ``severity``. Records are
emitted as one JSON object per line (JSONL) so they can be tailed, shipped, and
later loaded into PostgreSQL as an append-only audit trail.

This module deliberately has no third-party dependencies so it works in the
minimal Sprint 1 environment.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, TextIO

from core.clock import Clock, SystemClock, utcnow
from core.events import EventType, Severity


class StructuredLogger:
    """Emit structured JSONL audit records.

    Parameters
    ----------
    name:
        Logical component name (e.g. ``"risk_engine"``).
    stream:
        Where human-facing lines go (defaults to stdout).
    file_path:
        Optional path to also append JSONL records to (the durable audit log).
    clock:
        Time source; injected for deterministic tests.
    """

    def __init__(
        self,
        name: str,
        *,
        stream: TextIO | None = None,
        file_path: str | Path | None = None,
        clock: Clock | None = None,
    ) -> None:
        self.name = name
        self._stream = stream if stream is not None else sys.stdout
        self._clock = clock or SystemClock()
        self._file: TextIO | None = None
        if file_path is not None:
            path = Path(file_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            self._file = path.open("a", encoding="utf-8")

    def log(
        self,
        event_type: EventType | str,
        *,
        entity_id: str,
        severity: Severity | str = Severity.INFO,
        message: str = "",
        **fields: Any,
    ) -> dict[str, Any]:
        """Write one audit record and return it (useful for tests)."""
        record: dict[str, Any] = {
            "timestamp": self._clock.now().isoformat()
            if self._clock
            else utcnow().isoformat(),
            "event_type": event_type.value if isinstance(event_type, EventType) else str(event_type),
            "entity_id": entity_id,
            "severity": severity.value if isinstance(severity, Severity) else str(severity),
            "component": self.name,
        }
        if message:
            record["message"] = message
        # Extra structured context (kept JSON-serializable by the caller).
        record.update(fields)

        line = json.dumps(record, default=str, sort_keys=False)
        self._stream.write(line + "\n")
        self._stream.flush()
        if self._file is not None:
            self._file.write(line + "\n")
            self._file.flush()
        return record

    def info(self, event_type: EventType | str, *, entity_id: str, **fields: Any) -> dict[str, Any]:
        return self.log(event_type, entity_id=entity_id, severity=Severity.INFO, **fields)

    def warning(self, event_type: EventType | str, *, entity_id: str, **fields: Any) -> dict[str, Any]:
        return self.log(event_type, entity_id=entity_id, severity=Severity.WARNING, **fields)

    def error(self, event_type: EventType | str, *, entity_id: str, **fields: Any) -> dict[str, Any]:
        return self.log(event_type, entity_id=entity_id, severity=Severity.ERROR, **fields)

    def close(self) -> None:
        if self._file is not None:
            self._file.close()
            self._file = None


def get_logger(name: str, *, file_path: str | Path | None = None) -> StructuredLogger:
    """Factory for a :class:`StructuredLogger`."""
    return StructuredLogger(name, file_path=file_path)
