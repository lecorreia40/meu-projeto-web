"""Admin control-panel API tests (auth + agent toggles + risk limits + run cycle)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.runtime_config import get_runtime_config


@pytest.fixture
def client() -> TestClient:
    get_runtime_config().reset()  # isolate state per test
    return TestClient(app)


def _token(client: TestClient) -> str:
    s = get_settings()
    r = client.post("/auth/login", json={"username": s.admin_username, "password": s.admin_password})
    assert r.status_code == 200
    return r.json()["token"]


def _auth(client: TestClient) -> dict[str, str]:
    return {"Authorization": f"Bearer {_token(client)}"}


# --- Auth -------------------------------------------------------------------

def test_login_success_returns_token(client: TestClient) -> None:
    s = get_settings()
    r = client.post("/auth/login", json={"username": s.admin_username, "password": s.admin_password})
    assert r.status_code == 200
    assert r.json()["token"]


def test_login_failure(client: TestClient) -> None:
    r = client.post("/auth/login", json={"username": "owner", "password": "wrong"})
    assert r.status_code == 401


def test_protected_route_requires_token(client: TestClient) -> None:
    assert client.get("/admin/state").status_code == 401
    assert client.get("/admin/agents").status_code == 401


def test_bad_token_rejected(client: TestClient) -> None:
    r = client.get("/admin/state", headers={"Authorization": "Bearer not.a.real.token"})
    assert r.status_code == 401


# --- State ------------------------------------------------------------------

def test_state_reports_safety_and_agents(client: TestClient) -> None:
    r = client.get("/admin/state", headers=_auth(client))
    assert r.status_code == 200
    body = r.json()
    assert body["live_trading_enabled"] is False
    assert len(body["agents"]) == 7
    assert body["risk_policy"]["max_open_positions"] == 3


# --- Agent toggles ----------------------------------------------------------

def test_toggle_directional_agent(client: TestClient) -> None:
    r = client.post("/admin/agents/news", json={"enabled": False}, headers=_auth(client))
    assert r.status_code == 200
    assert r.json()["enabled"] is False


def test_cannot_disable_mandatory_agent(client: TestClient) -> None:
    r = client.post("/admin/agents/skeptic", json={"enabled": False}, headers=_auth(client))
    assert r.status_code == 400  # skeptic is mandatory


def test_unknown_agent_404(client: TestClient) -> None:
    r = client.post("/admin/agents/nope", json={"enabled": False}, headers=_auth(client))
    assert r.status_code == 404


# --- Risk policy ------------------------------------------------------------

def test_update_risk_limit(client: TestClient) -> None:
    r = client.put("/admin/risk-policy", json={"max_open_positions": 2}, headers=_auth(client))
    assert r.status_code == 200
    assert r.json()["max_open_positions"] == 2
    # dangerous flags remain off and untouched
    assert r.json()["allow_short"] is False
    assert r.json()["live_trading_default"] is False


def test_cannot_edit_forbidden_field(client: TestClient) -> None:
    # allow_short is not an editable field -> rejected.
    r = client.put("/admin/risk-policy", json={"allow_short": True}, headers=_auth(client))
    # Pydantic ignores unknown fields in the request model, so allow_short never
    # reaches the policy; confirm it stays false.
    assert r.status_code == 200
    assert r.json()["allow_short"] is False


# --- Run cycle ---------------------------------------------------------------

def test_run_cycle_returns_summary(client: TestClient) -> None:
    r = client.post("/admin/run-cycle", json={"seed": 42, "days": 120}, headers=_auth(client))
    assert r.status_code == 200
    body = r.json()
    assert "counts" in body
    assert "portfolio" in body
    assert body["portfolio"]["equity"] > 0


def test_evaluation_threshold_update(client: TestClient) -> None:
    r = client.put("/admin/evaluation", json={"confidence_threshold": 0.4}, headers=_auth(client))
    assert r.status_code == 200
    assert r.json()["confidence_threshold"] == 0.4
    # Reflected in state.
    state = client.get("/admin/state", headers=_auth(client)).json()
    assert state["confidence_threshold"] == 0.4


def test_evaluation_threshold_out_of_range(client: TestClient) -> None:
    r = client.put("/admin/evaluation", json={"confidence_threshold": 2.0}, headers=_auth(client))
    assert r.status_code == 422  # pydantic validation (le=1.0)


def test_run_cycle_returns_decision_trail(client: TestClient) -> None:
    r = client.post("/admin/run-cycle", json={"seed": 42, "days": 120}, headers=_auth(client))
    body = r.json()
    assert "decisions" in body
    assert len(body["decisions"]) == 21  # one per universe symbol
    d = body["decisions"][0]
    # Each decision carries the per-agent trail and the risk verdict.
    assert "agents" in d and "stage" in d and "skeptic_view" in d
    completed = [x for x in body["decisions"] if x["agents"]]
    assert completed  # at least one symbol ran the agents


def test_disabling_agents_changes_outcomes(client: TestClient) -> None:
    # Disable all four directional analysts -> no net bullish thesis -> no orders.
    for key in ("fundamental", "technical", "news", "macro"):
        client.post(f"/admin/agents/{key}", json={"enabled": False}, headers=_auth(client))
    r = client.post("/admin/run-cycle", json={"seed": 42, "days": 120}, headers=_auth(client))
    counts = r.json()["counts"]
    assert counts.get("paper_filled", 0) == 0  # nothing approved when analysts are off
