"""Admin control-panel endpoints (token-protected).

Lets the owner-operator, from a web panel:
  * log in,
  * enable/disable research agents,
  * adjust the numeric risk limits,
  * trigger a paper cycle and read the results.

Safety: live trading cannot be enabled here; only numeric risk *limits* are
editable; mandatory agents cannot be disabled. Every change is in-memory and
owner-operated.
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth import login as do_login
from app.auth import require_auth
from app.config import get_settings
from app.runtime_config import AgentState, RuntimeConfig, get_runtime_config
from data.universe import SYMBOLS
from risk.policy import RiskPolicy

router = APIRouter(tags=["admin"])
_ARTIFACTS = Path("./artifacts")


# --- Auth -------------------------------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    expires_at: int
    username: str


@router.post("/auth/login", response_model=LoginResponse)
def login(req: LoginRequest) -> LoginResponse:
    try:
        token, expires_at = do_login(req.username, req.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return LoginResponse(token=token, expires_at=expires_at, username=req.username)


# --- State ------------------------------------------------------------------

@router.get("/admin/state")
def get_state(
    _: str = Depends(require_auth),
    cfg: RuntimeConfig = Depends(get_runtime_config),
) -> dict[str, object]:
    settings = get_settings()
    return {
        "live_trading_enabled": settings.live_trading_enabled,  # always false in MVP
        "execution_mode": settings.execution_mode.value,
        "universe_size": len(SYMBOLS),
        "agents": [a.model_dump() for a in cfg.agents()],
        "risk_policy": cfg.policy().model_dump(),
    }


# --- Agents -----------------------------------------------------------------

class ToggleRequest(BaseModel):
    enabled: bool


@router.get("/admin/agents", response_model=list[AgentState])
def list_agents(
    _: str = Depends(require_auth), cfg: RuntimeConfig = Depends(get_runtime_config)
) -> list[AgentState]:
    return cfg.agents()


@router.post("/admin/agents/{key}", response_model=AgentState)
def toggle_agent(
    key: str,
    req: ToggleRequest,
    _: str = Depends(require_auth),
    cfg: RuntimeConfig = Depends(get_runtime_config),
) -> AgentState:
    try:
        return cfg.set_agent_enabled(key, req.enabled)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# --- Risk policy ------------------------------------------------------------

class RiskPolicyUpdate(BaseModel):
    max_risk_per_trade_pct: float | None = Field(default=None, gt=0)
    max_position_size_pct: float | None = Field(default=None, gt=0)
    max_daily_loss_pct: float | None = Field(default=None, gt=0)
    max_weekly_loss_pct: float | None = Field(default=None, gt=0)
    max_open_positions: int | None = Field(default=None, gt=0)
    max_total_exposure_pct: float | None = Field(default=None, gt=0)


@router.get("/admin/risk-policy", response_model=RiskPolicy)
def get_risk_policy(
    _: str = Depends(require_auth), cfg: RuntimeConfig = Depends(get_runtime_config)
) -> RiskPolicy:
    return cfg.policy()


@router.put("/admin/risk-policy", response_model=RiskPolicy)
def update_risk_policy(
    req: RiskPolicyUpdate,
    _: str = Depends(require_auth),
    cfg: RuntimeConfig = Depends(get_runtime_config),
) -> RiskPolicy:
    try:
        return cfg.update_policy(**req.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# --- Run a cycle ------------------------------------------------------------

class RunCycleRequest(BaseModel):
    seed: int = 42
    days: int = 180


@router.post("/admin/run-cycle")
def run_cycle(
    req: RunCycleRequest,
    _: str = Depends(require_auth),
    cfg: RuntimeConfig = Depends(get_runtime_config),
) -> dict[str, object]:
    # Imported here to keep module import light.
    from app.pipeline import TradingDeskPipeline

    pipeline = TradingDeskPipeline(
        seed=req.seed,
        days=req.days,
        policy=cfg.policy(),
        enabled_agents=cfg.enabled_directional(),
    )
    summary = pipeline.run(SYMBOLS)
    artifacts = pipeline.persist_artifacts(str(_ARTIFACTS))
    snapshot = pipeline.portfolio_snapshot()
    return {
        "counts": summary.counts,
        "paper_orders": [
            {
                "symbol": r.symbol,
                "quantity": r.execution.fill.quantity,
                "fill_price": r.execution.fill.fill_price,
                "notional": r.execution.fill.notional,
            }
            for r in summary.paper_orders
            if r.execution is not None
        ],
        "portfolio": snapshot.model_dump(),
        "artifacts": artifacts,
    }


# --- Read latest results (for the panel tables) -----------------------------

def _read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


@router.get("/admin/results")
def get_results(_: str = Depends(require_auth)) -> dict[str, object]:
    portfolio_path = _ARTIFACTS / "portfolio.json"
    return {
        "memos": _read_jsonl(_ARTIFACTS / "memos.jsonl"),
        "signals": _read_jsonl(_ARTIFACTS / "signals.jsonl"),
        "portfolio": json.loads(portfolio_path.read_text()) if portfolio_path.exists() else None,
    }
