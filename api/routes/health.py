"""Health and safety-status endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from app.config import get_settings
from data.universe import SYMBOLS

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, object]:
    """Liveness probe plus a readout of the critical safety flags.

    Exposing ``live_trading_enabled`` here makes the system's safety posture
    observable at a glance.
    """
    settings = get_settings()
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "execution_mode": settings.execution_mode.value,
        "live_trading_enabled": settings.live_trading_enabled,
        "repository_backend": settings.repository_backend.value,
        "universe_size": len(SYMBOLS),
    }
