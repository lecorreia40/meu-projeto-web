"""FastAPI endpoint tests."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app)


def test_health_reports_safety_flags(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["live_trading_enabled"] is False
    assert body["execution_mode"] == "paper"


def test_risk_policy_endpoint(client: TestClient) -> None:
    r = client.get("/risk/policy")
    assert r.status_code == 200
    policy = r.json()
    assert policy["max_open_positions"] == 3
    assert policy["allow_short"] is False


def test_risk_evaluate_blocks_oversized(client: TestClient) -> None:
    payload = {
        "signal": {
            "memo_id": "m1", "symbol": "AAPL", "direction": "long",
            "entry_type": "limit", "entry_price": 100, "stop_loss": 98,
            "take_profit": 106, "max_position_pct": 9.0, "max_risk_pct": 5.0,
            "time_horizon": "swing", "confidence_score": 0.7,
        },
        "context": {"broker_connected": False},
    }
    r = client.post("/risk/evaluate", json=payload)
    assert r.status_code == 200
    decision = r.json()
    assert decision["approved"] is False
    assert "broker_connection_failure" in decision["reasons"]


def test_portfolio_endpoint_shape(client: TestClient) -> None:
    r = client.get("/portfolio")
    assert r.status_code == 200
    assert r.json()["mode"] == "paper"


def test_memos_and_signals_list(client: TestClient) -> None:
    assert client.get("/memos").status_code == 200
    assert client.get("/signals").status_code == 200
    assert isinstance(client.get("/memos").json(), list)
