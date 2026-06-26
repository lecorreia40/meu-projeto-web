"""Position lifecycle / exit management (paper).

Holds open paper positions and, as new bars arrive, exits them at their stop,
target, or a time stop by issuing reduce-only SELL *close* orders. This completes
the trade loop: entry -> manage -> exit. Long-only is preserved — the manager
only ever closes (part of) an existing long, never opens a short.
"""

from __future__ import annotations

from dataclasses import dataclass

from data.market_schema import MarketBar
from execution.broker_interface import BrokerInterface
from execution.order_schema import ExecutionMode, Order, OrderSide, OrderType
from execution.order_validator import validate_order
from portfolio.journal import RoundTrip, TradeJournal
from portfolio.paper_portfolio import PaperPortfolio


@dataclass
class ManagedPosition:
    symbol: str
    signal_id: str
    quantity: int
    entry_price: float
    stop_loss: float
    take_profit: float
    entry_step: int = 0
    bars_held: int = 0
    max_holding: int = 20


class PositionManager:
    """Drives open positions to an exit and records the result."""

    def __init__(
        self,
        portfolio: PaperPortfolio,
        broker: BrokerInterface,
        journal: TradeJournal,
        *,
        live_trading_enabled: bool = False,
    ) -> None:
        self.portfolio = portfolio
        self.broker = broker
        self.journal = journal
        self._live = live_trading_enabled
        self._open: dict[str, ManagedPosition] = {}

    @property
    def open_symbols(self) -> list[str]:
        return list(self._open)

    def open(self, managed: ManagedPosition) -> None:
        self._open[managed.symbol] = managed

    def on_bar(self, symbol: str, bar: MarketBar, *, step: int) -> RoundTrip | None:
        """Process one bar for a held symbol; exit if stop/target/time triggers."""
        mp = self._open.get(symbol)
        if mp is None:
            return None
        mp.bars_held += 1

        if bar.low <= mp.stop_loss:                 # stop checked first (conservative)
            return self._close(mp, mp.stop_loss, "stop", step)
        if bar.high >= mp.take_profit:
            return self._close(mp, mp.take_profit, "target", step)
        if mp.bars_held >= mp.max_holding:
            return self._close(mp, bar.close, "time", step)
        return None

    def force_close(self, symbol: str, price: float, *, step: int, reason: str = "eod") -> RoundTrip | None:
        mp = self._open.get(symbol)
        if mp is None:
            return None
        return self._close(mp, price, reason, step)

    def force_close_all(self, prices: dict[str, float], *, step: int) -> list[RoundTrip]:
        trips: list[RoundTrip] = []
        for symbol in list(self._open):
            price = prices.get(symbol, self._open[symbol].entry_price)
            trip = self.force_close(symbol, price, step=step)
            if trip is not None:
                trips.append(trip)
        return trips

    def _close(self, mp: ManagedPosition, exit_ref: float, reason: str, step: int) -> RoundTrip:
        order = Order(
            signal_id=mp.signal_id,
            symbol=mp.symbol,
            side=OrderSide.SELL,
            order_type=OrderType.MARKET,
            quantity=mp.quantity,
            risk_approved=True,   # closing reduces risk; always permitted
            is_close=True,        # reduce-only: never opens a short
            mode=ExecutionMode.PAPER,
        )
        validate_order(order, live_trading_enabled=self._live)

        before = self.portfolio.realized_pnl
        fill = self.broker.submit_order(order, mark_price=exit_ref)
        self.portfolio.apply_fill(fill)
        realized = self.portfolio.realized_pnl - before

        risk_per_share = mp.entry_price - mp.stop_loss
        r_multiple = (fill.fill_price - mp.entry_price) / risk_per_share if risk_per_share > 0 else 0.0
        trip = RoundTrip(
            symbol=mp.symbol,
            signal_id=mp.signal_id,
            quantity=mp.quantity,
            entry_price=round(mp.entry_price, 4),
            exit_price=round(fill.fill_price, 4),
            exit_reason=reason,
            pnl=round(realized, 2),
            return_pct=round((fill.fill_price - mp.entry_price) / mp.entry_price * 100.0, 4),
            r_multiple=round(r_multiple, 4),
            bars_held=mp.bars_held,
        )
        self.journal.record(trip)
        del self._open[mp.symbol]
        return trip
