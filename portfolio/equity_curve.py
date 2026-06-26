"""Equity curve recorder and drawdown computation (paper)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class EquityPoint(BaseModel):
    model_config = ConfigDict(frozen=True)

    step: int
    equity: float
    label: str = ""


class EquityCurve:
    """Records equity over time and derives drawdown / returns."""

    def __init__(self, starting_equity: float) -> None:
        self.starting_equity = starting_equity
        self._points: list[EquityPoint] = []

    def record(self, equity: float, *, label: str = "") -> None:
        self._points.append(EquityPoint(step=len(self._points), equity=equity, label=label))

    @property
    def points(self) -> list[EquityPoint]:
        return list(self._points)

    @property
    def last_equity(self) -> float:
        return self._points[-1].equity if self._points else self.starting_equity

    def total_return_pct(self) -> float:
        if not self._points or self.starting_equity <= 0:
            return 0.0
        return (self.last_equity - self.starting_equity) / self.starting_equity * 100.0

    def max_drawdown_pct(self) -> float:
        """Largest peak-to-trough decline across the recorded equity series."""
        peak = self.starting_equity
        max_dd = 0.0
        for p in self._points:
            peak = max(peak, p.equity)
            if peak > 0:
                dd = (peak - p.equity) / peak * 100.0
                max_dd = max(max_dd, dd)
        return round(max_dd, 4)

    def daily_returns_pct(self) -> list[float]:
        rets: list[float] = []
        prev = self.starting_equity
        for p in self._points:
            if prev > 0:
                rets.append((p.equity - prev) / prev * 100.0)
            prev = p.equity
        return rets
