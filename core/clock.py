"""Clock abstraction.

Time is injected through a :class:`Clock` so tests and backtests are
deterministic and never depend on wall-clock time directly.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Protocol


class Clock(Protocol):
    """Anything that can report the current UTC time."""

    def now(self) -> datetime: ...


class SystemClock:
    """Real wall-clock time, always timezone-aware UTC."""

    def now(self) -> datetime:
        return datetime.now(timezone.utc)


class FixedClock:
    """A frozen clock for tests and reproducible backtests."""

    def __init__(self, moment: datetime) -> None:
        if moment.tzinfo is None:
            moment = moment.replace(tzinfo=timezone.utc)
        self._moment = moment

    def now(self) -> datetime:
        return self._moment

    def set(self, moment: datetime) -> None:
        if moment.tzinfo is None:
            moment = moment.replace(tzinfo=timezone.utc)
        self._moment = moment


def utcnow() -> datetime:
    """Convenience helper for timezone-aware UTC now."""
    return datetime.now(timezone.utc)
