"""Order endpoints — Sprint 1 placeholder.

No execution layer is wired up in Sprint 1: there is NO broker connection and
NO paper-fill simulator yet (those arrive in Phase 8/9). This router exists so
the surface is stable, and it loudly reports that live trading is disabled.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.config import get_settings

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("")
def list_orders() -> dict[str, object]:
    settings = get_settings()
    return {
        "orders": [],
        "execution_mode": settings.execution_mode.value,
        "live_trading_enabled": settings.live_trading_enabled,
        "note": "Execution is not implemented in Sprint 1. Paper simulator lands in Phase 8.",
    }
