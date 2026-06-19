"""Canonical event types and severities for the audit trail.

Every structured log line carries an ``event_type`` drawn from :class:`EventType`
and a ``severity`` from :class:`Severity`. Keeping them centralized makes the
audit trail queryable and consistent across all 14 architecture layers.
"""

from __future__ import annotations

from enum import Enum


class Severity(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class EventType(str, Enum):
    # Data plane
    DATA_INGESTED = "data.ingested"
    DATA_QUALITY_FAILED = "data.quality_failed"
    FEATURE_COMPUTED = "feature.computed"

    # AI plane (advisory only)
    MEMO_CREATED = "memo.created"
    SIGNAL_CREATED = "signal.created"

    # Deterministic control plane
    SIGNAL_VALIDATED = "signal.validated"
    BACKTEST_COMPLETED = "backtest.completed"
    RISK_APPROVED = "risk.approved"
    RISK_BLOCKED = "risk.blocked"

    # Execution plane (paper by default)
    ORDER_BUILT = "order.built"
    ORDER_VALIDATED = "order.validated"
    ORDER_SUBMITTED = "order.submitted"
    ORDER_FILLED = "order.filled"
    ORDER_REJECTED = "order.rejected"

    # System
    SYSTEM_STARTED = "system.started"
    KILL_SWITCH_TRIGGERED = "system.kill_switch"
