"""Global kill switch.

A single process-wide flag that, when engaged, forces the system into a
no-trade state regardless of any other signal or approval. Wired into the
execution layer in later phases; defined here so the control surface exists from
day one.
"""

from __future__ import annotations

from core.events import EventType, Severity
from core.logging import StructuredLogger, get_logger


class KillSwitch:
    """Process-wide trading halt."""

    def __init__(self, logger: StructuredLogger | None = None) -> None:
        self._engaged = False
        self._reason: str | None = None
        self._logger = logger or get_logger("kill_switch")

    @property
    def engaged(self) -> bool:
        return self._engaged

    @property
    def reason(self) -> str | None:
        return self._reason

    def engage(self, reason: str) -> None:
        self._engaged = True
        self._reason = reason
        self._logger.log(
            EventType.KILL_SWITCH_TRIGGERED,
            entity_id="kill_switch",
            severity=Severity.CRITICAL,
            message=reason,
        )

    def reset(self) -> None:
        self._engaged = False
        self._reason = None

    def assert_trading_allowed(self) -> None:
        """Raise if trading is halted. Callers in the execution path use this."""
        if self._engaged:
            from core.exceptions import RiskBlockedError

            raise RiskBlockedError(
                f"kill switch engaged: {self._reason}",
                reasons=["kill_switch_engaged"],
            )
