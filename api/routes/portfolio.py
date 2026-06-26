"""Portfolio endpoints.

Serves the latest paper-portfolio snapshot written by the pipeline
(``artifacts/portfolio.json``). If no cycle has run yet, returns an empty paper
portfolio. Read-only; the portfolio is mutated only by the pipeline applying
paper fills.
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

_SNAPSHOT = Path("./artifacts/portfolio.json")


@router.get("")
def get_portfolio() -> dict[str, object]:
    if _SNAPSHOT.exists():
        snapshot = json.loads(_SNAPSHOT.read_text(encoding="utf-8"))
        return {"mode": "paper", "snapshot": snapshot}
    return {
        "mode": "paper",
        "snapshot": None,
        "note": "No cycle has run yet. Run scripts/run_paper_trading.py to populate.",
    }
