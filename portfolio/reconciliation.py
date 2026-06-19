"""Position reconciliation (paper).

Compares the portfolio's booked positions against an independent tally (e.g. the
sum of broker fills). Any discrepancy is a hard signal that the system's view of
the world is wrong — and a wrong view must never trade.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from execution.order_schema import Fill, OrderSide
from portfolio.positions import Position


class Discrepancy(BaseModel):
    model_config = ConfigDict(frozen=True)

    symbol: str
    booked_qty: int
    expected_qty: int

    @property
    def delta(self) -> int:
        return self.booked_qty - self.expected_qty


def expected_quantities_from_fills(fills: list[Fill]) -> dict[str, int]:
    """Net long quantity per symbol implied by a list of fills."""
    out: dict[str, int] = {}
    for fill in fills:
        sign = 1 if fill.side is OrderSide.BUY else -1
        out[fill.symbol] = out.get(fill.symbol, 0) + sign * fill.quantity
    return {s: q for s, q in out.items() if q != 0}


def reconcile(
    positions: dict[str, Position], fills: list[Fill]
) -> list[Discrepancy]:
    """Return discrepancies between booked positions and fill-implied quantities."""
    expected = expected_quantities_from_fills(fills)
    symbols = set(positions) | set(expected)
    out: list[Discrepancy] = []
    for symbol in sorted(symbols):
        booked = positions[symbol].quantity if symbol in positions else 0
        exp = expected.get(symbol, 0)
        if booked != exp:
            out.append(Discrepancy(symbol=symbol, booked_qty=booked, expected_qty=exp))
    return out
