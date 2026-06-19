"""Portfolio endpoints — Sprint 1 placeholder.

Returns an empty paper portfolio. Position tracking and PnL are populated once
the paper-trading simulator exists (Phase 8).
"""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("")
def get_portfolio() -> dict[str, object]:
    return {
        "mode": "paper",
        "positions": [],
        "cash": None,
        "note": "Portfolio tracking is populated by the paper simulator in Phase 8.",
    }
