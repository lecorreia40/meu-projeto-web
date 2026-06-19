"""Paper portfolio.

Tracks cash, long positions, realized PnL, and commissions as (paper) fills are
applied. Provides equity / unrealized PnL / exposure snapshots given mark
prices. Long-only in the MVP; selling closes (or reduces) an existing long.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from core.clock import utcnow
from execution.order_schema import Fill, OrderSide
from portfolio.allocation import gross_exposure_pct, position_weights
from portfolio.pnl import positions_market_value, realized_pnl_on_close, unrealized_pnl
from portfolio.positions import Position


class PortfolioSnapshot(BaseModel):
    """A point-in-time, JSON-serializable view of the paper portfolio."""

    model_config = ConfigDict(frozen=True)

    starting_cash: float
    cash: float
    positions_value: float
    equity: float
    realized_pnl: float
    unrealized_pnl: float
    total_pnl: float
    total_return_pct: float
    gross_exposure_pct: float
    open_positions: int
    commissions_paid: float
    weights_pct: dict[str, float] = Field(default_factory=dict)
    timestamp: str


class PaperPortfolio:
    """In-process paper portfolio updated from fills."""

    def __init__(self, starting_cash: float = 100_000.0) -> None:
        self.starting_cash = starting_cash
        self.cash = starting_cash
        self.positions: dict[str, Position] = {}
        self.realized_pnl = 0.0
        self.commissions_paid = 0.0
        self._fills: list[Fill] = []

    @property
    def fills(self) -> list[Fill]:
        return list(self._fills)

    def apply_fill(self, fill: Fill) -> None:
        """Update cash, positions, and realized PnL from a paper fill."""
        self._fills.append(fill)
        self.commissions_paid += fill.commission

        if fill.side is OrderSide.BUY:
            self.cash -= fill.notional + fill.commission
            existing = self.positions.get(fill.symbol)
            if existing is None:
                self.positions[fill.symbol] = Position(
                    symbol=fill.symbol, quantity=fill.quantity, avg_price=fill.fill_price
                )
            else:
                new_qty = existing.quantity + fill.quantity
                new_avg = (existing.cost_basis + fill.notional) / new_qty
                self.positions[fill.symbol] = existing.model_copy(
                    update={"quantity": new_qty, "avg_price": new_avg}
                )
        else:  # SELL closes/reduces a long (not used by the long-only MVP path)
            existing = self.positions.get(fill.symbol)
            if existing is None:
                raise ValueError(f"cannot sell {fill.symbol}: no open position")
            qty = min(fill.quantity, existing.quantity)
            self.realized_pnl += realized_pnl_on_close(existing, fill.fill_price, qty)
            self.cash += fill.quantity * fill.fill_price - fill.commission
            remaining = existing.quantity - qty
            if remaining <= 0:
                self.positions.pop(fill.symbol, None)
            else:
                self.positions[fill.symbol] = existing.model_copy(
                    update={"quantity": remaining}
                )

    def equity(self, marks: dict[str, float]) -> float:
        return self.cash + positions_market_value(self.positions, marks)

    def snapshot(self, marks: dict[str, float] | None = None) -> PortfolioSnapshot:
        marks = marks or {s: p.avg_price for s, p in self.positions.items()}
        positions_value = positions_market_value(self.positions, marks)
        equity = self.cash + positions_value
        unreal = unrealized_pnl(self.positions, marks)
        total_pnl = self.realized_pnl + unreal
        return PortfolioSnapshot(
            starting_cash=round(self.starting_cash, 2),
            cash=round(self.cash, 2),
            positions_value=round(positions_value, 2),
            equity=round(equity, 2),
            realized_pnl=round(self.realized_pnl, 2),
            unrealized_pnl=round(unreal, 2),
            total_pnl=round(total_pnl, 2),
            total_return_pct=round(
                (equity - self.starting_cash) / self.starting_cash * 100.0, 4
            )
            if self.starting_cash
            else 0.0,
            gross_exposure_pct=round(
                gross_exposure_pct(self.positions, marks, equity), 4
            ),
            open_positions=len(self.positions),
            commissions_paid=round(self.commissions_paid, 4),
            weights_pct={
                s: round(w, 4)
                for s, w in position_weights(self.positions, marks, equity).items()
            },
            timestamp=utcnow().isoformat(),
        )
