"""Paper portfolio, PnL, allocation, and reconciliation tests."""

from __future__ import annotations

from execution.order_schema import ExecutionMode, Fill, OrderSide
from portfolio.allocation import gross_exposure_pct
from portfolio.paper_portfolio import PaperPortfolio
from portfolio.positions import Position
from portfolio.reconciliation import reconcile


def _buy(symbol: str, qty: int, price: float, commission: float = 1.0) -> Fill:
    return Fill(
        order_id=f"o_{symbol}", signal_id=f"s_{symbol}", symbol=symbol,
        side=OrderSide.BUY, quantity=qty, fill_price=price, commission=commission,
        mode=ExecutionMode.PAPER,
    )


def test_buy_reduces_cash_and_opens_position() -> None:
    pf = PaperPortfolio(starting_cash=100_000.0)
    pf.apply_fill(_buy("AAPL", 10, 100.0, commission=1.0))
    assert pf.positions["AAPL"].quantity == 10
    assert pf.cash == 100_000.0 - 1_000.0 - 1.0
    assert pf.commissions_paid == 1.0


def test_averaging_into_position() -> None:
    pf = PaperPortfolio(starting_cash=100_000.0)
    pf.apply_fill(_buy("AAPL", 10, 100.0, commission=0.0))
    pf.apply_fill(_buy("AAPL", 10, 120.0, commission=0.0))
    pos = pf.positions["AAPL"]
    assert pos.quantity == 20
    assert pos.avg_price == 110.0  # weighted average


def test_snapshot_equity_and_pnl() -> None:
    pf = PaperPortfolio(starting_cash=100_000.0)
    pf.apply_fill(_buy("AAPL", 10, 100.0, commission=0.0))
    snap = pf.snapshot({"AAPL": 110.0})
    # Equity = cash (99,000) + position value (1,100) = 100,100
    assert snap.cash == 99_000.0
    assert snap.positions_value == 1_100.0
    assert snap.equity == 100_100.0
    assert snap.unrealized_pnl == 100.0
    assert snap.open_positions == 1
    assert snap.gross_exposure_pct > 0


def test_snapshot_is_json_serializable() -> None:
    pf = PaperPortfolio()
    pf.apply_fill(_buy("MSFT", 5, 400.0))
    payload = pf.snapshot({"MSFT": 410.0}).model_dump_json()
    assert "equity" in payload


def test_gross_exposure_helper() -> None:
    positions = {"AAPL": Position(symbol="AAPL", quantity=10, avg_price=100.0)}
    exposure = gross_exposure_pct(positions, {"AAPL": 100.0}, equity=10_000.0)
    assert exposure == 10.0  # 1,000 / 10,000


def test_reconciliation_detects_mismatch() -> None:
    pf = PaperPortfolio()
    pf.apply_fill(_buy("AAPL", 10, 100.0))
    # Fabricate an extra fill not reflected in positions -> discrepancy.
    extra = _buy("TSLA", 3, 250.0)
    discrepancies = reconcile(pf.positions, pf.fills + [extra])
    symbols = {d.symbol for d in discrepancies}
    assert "TSLA" in symbols


def test_reconciliation_clean_when_consistent() -> None:
    pf = PaperPortfolio()
    pf.apply_fill(_buy("AAPL", 10, 100.0))
    assert reconcile(pf.positions, pf.fills) == []
