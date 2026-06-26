"""Position lifecycle / exit management tests."""

from __future__ import annotations

from datetime import datetime, timezone

from data.market_schema import MarketBar
from execution.order_schema import ExecutionMode, Fill, OrderSide
from execution.paper_trading import PaperBroker
from portfolio.journal import TradeJournal
from portfolio.paper_portfolio import PaperPortfolio
from portfolio.position_manager import ManagedPosition, PositionManager


def _bar(o: float, h: float, l: float, c: float) -> MarketBar:
    return MarketBar(
        symbol="AAPL", timestamp=datetime(2026, 1, 1, tzinfo=timezone.utc),
        open=o, high=h, low=l, close=c, volume=1_000_000,
    )


def _setup(entry: float = 100.0, qty: int = 10):
    portfolio = PaperPortfolio(starting_cash=100_000.0)
    # Open the long in the portfolio (entry fill) so the close can reduce it.
    portfolio.apply_fill(Fill(
        order_id="o0", signal_id="s0", symbol="AAPL", side=OrderSide.BUY,
        quantity=qty, fill_price=entry, commission=0.0, mode=ExecutionMode.PAPER,
    ))
    journal = TradeJournal()
    manager = PositionManager(portfolio, PaperBroker(slippage_bps=0.0, commission_bps=0.0), journal)
    manager.open(ManagedPosition(
        symbol="AAPL", signal_id="s0", quantity=qty, entry_price=entry,
        stop_loss=96.0, take_profit=110.0, max_holding=5,
    ))
    return portfolio, journal, manager


def test_stop_exit() -> None:
    portfolio, journal, manager = _setup()
    trip = manager.on_bar("AAPL", _bar(97, 98, 95, 96), step=0)  # low 95 <= stop 96
    assert trip is not None
    assert trip.exit_reason == "stop"
    assert "AAPL" not in portfolio.positions
    assert manager.open_symbols == []
    assert journal.stats()["n_trades"] == 1


def test_target_exit() -> None:
    portfolio, journal, manager = _setup()
    trip = manager.on_bar("AAPL", _bar(105, 112, 104, 111), step=0)  # high 112 >= target
    assert trip is not None
    assert trip.exit_reason == "target"
    assert trip.pnl > 0  # exited above entry
    assert "AAPL" not in portfolio.positions


def test_time_exit_after_max_holding() -> None:
    portfolio, journal, manager = _setup()
    manager._open["AAPL"].max_holding = 1
    # Neutral bar: neither stop nor target hit, but bars_held reaches max_holding.
    trip = manager.on_bar("AAPL", _bar(100, 101, 99, 100), step=0)
    assert trip is not None
    assert trip.exit_reason == "time"


def test_no_exit_when_price_in_range() -> None:
    _, _, manager = _setup()
    trip = manager.on_bar("AAPL", _bar(100, 101, 99, 100), step=0)  # max_holding=5
    assert trip is None
    assert manager.open_symbols == ["AAPL"]


def test_force_close_all() -> None:
    portfolio, journal, manager = _setup()
    trips = manager.force_close_all({"AAPL": 103.0}, step=9)
    assert len(trips) == 1
    assert trips[0].exit_reason == "eod"
    assert manager.open_symbols == []
