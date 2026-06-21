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
        "confidence_threshold": cfg.confidence_threshold(),
    }


class EvaluationUpdate(BaseModel):
    confidence_threshold: float = Field(..., ge=0.0, le=1.0)


@router.put("/admin/evaluation")
def update_evaluation(
    req: EvaluationUpdate,
    _: str = Depends(require_auth),
    cfg: RuntimeConfig = Depends(get_runtime_config),
) -> dict[str, float]:
    """Adjust the orchestrator's confidence threshold in real time."""
    try:
        value = cfg.set_confidence_threshold(req.confidence_threshold)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"confidence_threshold": value}


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


def _enum(value: object) -> object:
    return value.value if hasattr(value, "value") else value


def _round(value: object) -> object:
    return round(value, 4) if isinstance(value, float) else value


def _data_trace(features: object, backtest: object, price_source: str = "MockPriceFeed") -> dict[str, object]:
    """The data each function brought in + the validation verdict per check.

    Answers the owner's question: *what data did each step produce, did it pass
    validation, and how did that drive the decision?*
    """
    if features is None:
        return {"available": False, "inputs": [], "validations": []}

    f = features
    inputs = [
        {"name": "last_price", "value": _round(getattr(f, "last_price", None)), "source": f"{price_source} (OHLCV)"},
        {"name": "history_len", "value": getattr(f, "history_len", None), "source": f"{price_source} (bars)"},
        {"name": "sma20", "value": _round(getattr(f, "sma20", None)), "source": "features.moving_average"},
        {"name": "sma50", "value": _round(getattr(f, "sma50", None)), "source": "features.moving_average"},
        {"name": "rsi14", "value": _round(getattr(f, "rsi14", None)), "source": "features.rsi (Wilder)"},
        {"name": "atr14", "value": _round(getattr(f, "atr14", None)), "source": "features.atr (Wilder)"},
        {"name": "annualized_vol", "value": _round(getattr(f, "annualized_vol", None)), "source": "features.volatility"},
        {"name": "momentum20", "value": _round(getattr(f, "momentum20", None)), "source": "features.momentum"},
        {"name": "liquidity", "value": _round(getattr(f, "liquidity", None)), "source": "features.liquidity_score"},
    ]

    hist = getattr(f, "history_len", 0) or 0
    liq = getattr(f, "liquidity", None)
    validations = [
        {
            "check": "histórico suficiente (≥60 barras)",
            "passed": hist >= 60,
            "detail": f"{hist} barras disponíveis",
        },
        {
            "check": "features completas (sem None)",
            "passed": bool(getattr(f, "is_complete", False)),
            "detail": "todos os indicadores calculados" if getattr(f, "is_complete", False)
            else "algum indicador ficou None (histórico curto)",
        },
        {
            "check": "liquidez presente",
            "passed": liq is not None,
            "detail": f"liquidez={_round(liq)}" if liq is not None else "sem liquidez calculada",
        },
        {
            "check": "preço válido (>0)",
            "passed": (getattr(f, "last_price", 0) or 0) > 0,
            "detail": f"último preço={_round(getattr(f, 'last_price', None))}",
        },
    ]
    if backtest is not None:
        validations.append({
            "check": "backtest aprovado (gate de replay)",
            "passed": bool(backtest.passed),
            "detail": backtest.reason or "ok",
        })
    return {
        "available": True,
        "inputs": inputs,
        "validations": validations,
        "all_passed": all(v["passed"] for v in validations),
    }


def _record_to_decision(r: object, price_source: str = "MockPriceFeed") -> dict[str, object]:
    """Flatten one symbol's full decision trail for the panel."""
    swarm = getattr(r, "swarm", None)
    memo = r.memo  # type: ignore[attr-defined]
    agents: list[dict[str, object]] = []
    if swarm is not None:
        for op in swarm.opinions.values():
            agents.append({
                "agent": op.agent,
                "stance": _enum(op.stance),
                "confidence": round(op.confidence, 3),
                "rationale": op.rationale,
                "key_points": op.key_points,
            })
    signal = getattr(r, "signal", None)
    backtest = getattr(r, "backtest", None)
    decision = getattr(r, "decision", None)
    features = getattr(r, "features", None)
    return {
        "symbol": r.symbol,  # type: ignore[attr-defined]
        "stage": r.stage,  # type: ignore[attr-defined]
        "data_trace": _data_trace(features, backtest, price_source),
        "memo_status": _enum(memo.status),
        "direction": _enum(memo.direction),
        "confidence": round(memo.confidence_score, 3),
        "net_score": round(swarm.net_score, 3) if swarm else None,
        "thesis": memo.thesis,
        "catalyst": memo.catalyst,
        "skeptic_view": swarm.skeptic_view if swarm else memo.skeptic_view,
        "agents": agents,
        "signal": None if signal is None else {
            "entry": signal.entry_price,
            "stop": signal.stop_loss,
            "target": signal.take_profit,
            "max_position_pct": signal.max_position_pct,
            "max_risk_pct": signal.max_risk_pct,
            "time_horizon": _enum(signal.time_horizon),
            "reward_risk": swarm.risk_proposal.reward_risk if swarm else None,
        },
        "backtest": None if backtest is None else {
            "passed": backtest.passed,
            "reason": backtest.reason,
            "win_rate": backtest.metrics.win_rate,
            "expectancy_r": backtest.metrics.expectancy_r,
            "n_trades": backtest.metrics.n_trades,
            "reward_risk": backtest.reward_risk,
        },
        "risk": None if decision is None else {
            "approved": decision.approved,
            "reasons": decision.reason_values,
        },
        "notes": getattr(r, "notes", ""),
    }


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
        confidence_threshold=cfg.confidence_threshold(),
    )
    summary = pipeline.run(SYMBOLS)
    artifacts = pipeline.persist_artifacts(str(_ARTIFACTS))
    snapshot = pipeline.portfolio_snapshot()
    price_source = type(pipeline.feed).__name__
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
        "decisions": [_record_to_decision(r, price_source) for r in summary.records],
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


# --- Ontology (knowledge layer) ---------------------------------------------

@router.get("/admin/ontology")
def get_ontology_view(_: str = Depends(require_auth)) -> dict[str, object]:
    """Formal model of every domain entity, its fields/validations, and relations."""
    from core.ontology import get_ontology

    return get_ontology()


# --- Data source (mock vs real, fail-closed) --------------------------------

@router.get("/admin/data-source")
def get_data_source(_: str = Depends(require_auth)) -> dict[str, object]:
    """Which market-data feed is active (mock vs real) and where keys go.

    A real provider only goes 'live' when its credentials are present; otherwise
    it is reported as 'blocked' (fail-closed) — the desk never invents prices.
    """
    from data.ingestion.feed_factory import describe_data_source

    return describe_data_source()


# --- Accounts (test + gated real) -------------------------------------------

@router.get("/admin/accounts")
def get_accounts_view(_: str = Depends(require_auth)) -> dict[str, object]:
    """The test (paper, active) account and the real (live, gated) account.

    Live trading is never enabled here; the real account is reported through the
    live-readiness gate, which stays closed in the MVP.
    """
    from core.accounts import get_accounts_payload

    return get_accounts_payload()
