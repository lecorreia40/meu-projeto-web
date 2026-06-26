"""Trade journal: completed round-trip records (paper)."""

from __future__ import annotations

import json
from pathlib import Path

from pydantic import BaseModel, ConfigDict, Field

from core.clock import utcnow


class RoundTrip(BaseModel):
    """A completed entry+exit (paper)."""

    model_config = ConfigDict(frozen=True)

    symbol: str
    signal_id: str
    quantity: int
    entry_price: float
    exit_price: float
    exit_reason: str          # "stop" | "target" | "time" | "eod"
    pnl: float                # realized $ (net of exit slippage; entry cost in avg_price)
    return_pct: float
    r_multiple: float
    bars_held: int
    closed_at: str = Field(default_factory=lambda: utcnow().isoformat())


class TradeJournal:
    """Collects round trips and computes summary stats."""

    def __init__(self) -> None:
        self._trips: list[RoundTrip] = []

    def record(self, trip: RoundTrip) -> None:
        self._trips.append(trip)

    @property
    def trips(self) -> list[RoundTrip]:
        return list(self._trips)

    def stats(self) -> dict[str, float]:
        n = len(self._trips)
        if n == 0:
            return {"n_trades": 0, "wins": 0, "win_rate": 0.0,
                    "total_pnl": 0.0, "expectancy_r": 0.0}
        wins = sum(1 for t in self._trips if t.pnl > 0)
        return {
            "n_trades": n,
            "wins": wins,
            "win_rate": round(wins / n, 4),
            "total_pnl": round(sum(t.pnl for t in self._trips), 2),
            "expectancy_r": round(sum(t.r_multiple for t in self._trips) / n, 4),
        }

    def persist(self, path: str = "./artifacts/trades.jsonl") -> str:
        out = Path(path)
        out.parent.mkdir(parents=True, exist_ok=True)
        with out.open("w", encoding="utf-8") as fh:
            for trip in self._trips:
                fh.write(trip.model_dump_json() + "\n")
        return str(out)
