"""Live-trading readiness gate tests — must always be NOT READY in the MVP."""

from __future__ import annotations

import pytest

from app.config import ExecutionMode, Settings
from core.exceptions import LiveTradingDisabledError
from execution.ibkr_client import IBKRPaperBroker
from execution.live_readiness import assert_live_trading_allowed, evaluate_readiness
from execution.paper_trading import PaperBroker


def test_default_is_not_ready() -> None:
    report = evaluate_readiness(Settings())
    assert report.ready is False
    blocking = {c.name for c in report.blocking}
    assert "live_flag_enabled" in blocking
    assert "human_signoff" in blocking
    assert "compliance_review" in blocking


def test_paper_broker_cannot_satisfy_live_broker_check() -> None:
    report = evaluate_readiness(Settings(), PaperBroker())
    names = {c.name: c.ready for c in report.checks}
    assert names["live_capable_broker_connected"] is False


def test_disconnected_ibkr_cannot_satisfy_live_broker_check() -> None:
    report = evaluate_readiness(Settings(), IBKRPaperBroker())
    names = {c.name: c.ready for c in report.checks}
    assert names["live_capable_broker_connected"] is False


def test_assert_raises_in_mvp() -> None:
    with pytest.raises(LiveTradingDisabledError):
        assert_live_trading_allowed(Settings())


def test_even_with_flags_on_human_and_compliance_block() -> None:
    # Flipping the flags is not enough — human sign-off and compliance remain.
    settings = Settings(live_trading_enabled=True, execution_mode=ExecutionMode.LIVE)
    report = evaluate_readiness(settings, PaperBroker())
    assert report.ready is False
    with pytest.raises(LiveTradingDisabledError):
        assert_live_trading_allowed(settings, PaperBroker())
