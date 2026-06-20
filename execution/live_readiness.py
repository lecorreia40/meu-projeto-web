"""Live-trading readiness checklist (Phase 12) — DISABLED in the MVP.

Live trading is off by default and is intentionally **not** enabled anywhere in
this system. This module makes the gate explicit and auditable: it enumerates
every condition that would have to be satisfied before live trading could ever
be turned on, evaluates each deterministically, and refuses to authorize live
trading unless *all* of them pass (which they do not in the MVP).

It is a safety control, not an on-switch.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.config import ExecutionMode, Settings, get_settings
from core.exceptions import LiveTradingDisabledError
from execution.broker_interface import BrokerInterface


class ReadinessCheck(BaseModel):
    model_config = ConfigDict(frozen=True)

    name: str
    ready: bool
    detail: str


class ReadinessReport(BaseModel):
    model_config = ConfigDict(frozen=True)

    ready: bool
    checks: list[ReadinessCheck]

    @property
    def blocking(self) -> list[ReadinessCheck]:
        return [c for c in self.checks if not c.ready]


def evaluate_readiness(
    settings: Settings | None = None,
    broker: BrokerInterface | None = None,
) -> ReadinessReport:
    """Evaluate the live-trading readiness checklist.

    In the MVP this always reports NOT READY because (at minimum) the live
    flag is off, the execution mode is paper, no live-capable broker is
    connected, and the required human sign-off and compliance review are absent.
    """
    settings = settings or get_settings()
    checks: list[ReadinessCheck] = [
        ReadinessCheck(
            name="live_flag_enabled",
            ready=settings.live_trading_enabled,
            detail="LIVE_TRADING_ENABLED must be explicitly true",
        ),
        ReadinessCheck(
            name="execution_mode_live",
            ready=settings.execution_mode is ExecutionMode.LIVE,
            detail="EXECUTION_MODE must be 'live'",
        ),
        ReadinessCheck(
            name="live_capable_broker_connected",
            ready=bool(broker and broker.supports_live and broker.is_connected()),
            detail="a live-capable broker must be connected (paper broker cannot)",
        ),
        # Controls that ARE in place in the MVP.
        ReadinessCheck(
            name="deterministic_risk_engine",
            ready=True,
            detail="deterministic risk engine present and authoritative",
        ),
        ReadinessCheck(
            name="backtest_gate",
            ready=True,
            detail="backtest pass/fail gate present",
        ),
        ReadinessCheck(
            name="kill_switch",
            ready=True,
            detail="global kill switch present",
        ),
        ReadinessCheck(
            name="audit_logging",
            ready=True,
            detail="structured JSONL audit logging present",
        ),
        ReadinessCheck(
            name="reconciliation",
            ready=True,
            detail="position reconciliation present",
        ),
        # Controls that require deliberate human/process action (absent in MVP).
        ReadinessCheck(
            name="paper_track_record",
            ready=False,
            detail="a reviewed paper-trading track record is required (not yet established)",
        ),
        ReadinessCheck(
            name="human_signoff",
            ready=False,
            detail="explicit human sign-off is required and has not been given",
        ),
        ReadinessCheck(
            name="compliance_review",
            ready=False,
            detail="broker/regulatory compliance review required (owner capital only)",
        ),
    ]
    return ReadinessReport(ready=all(c.ready for c in checks), checks=checks)


def assert_live_trading_allowed(
    settings: Settings | None = None,
    broker: BrokerInterface | None = None,
) -> None:
    """Raise unless every readiness check passes.

    This is the single chokepoint any future live path must call. In the MVP it
    always raises.
    """
    report = evaluate_readiness(settings, broker)
    if not report.ready:
        blocking = ", ".join(c.name for c in report.blocking)
        raise LiveTradingDisabledError(
            f"live trading is not authorized; failing checks: {blocking}"
        )
