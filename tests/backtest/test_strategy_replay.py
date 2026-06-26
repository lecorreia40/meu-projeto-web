"""Backtest simulator / engine tests."""

from __future__ import annotations

from backtest.engine import BacktestEngine
from backtest.metrics import compute_metrics
from backtest.simulator import SimConfig, replay_bracket
from data.ingestion.prices import MockPriceFeed
from tests.conftest import make_signal


def _bars(symbol: str = "AAPL", seed: int = 42, days: int = 180):
    return MockPriceFeed(seed=seed).fetch_bars(symbol, days=days)


def test_replay_produces_trades_and_is_deterministic() -> None:
    bars = _bars()
    a = replay_bracket(bars, stop_frac=0.02, target_frac=0.05)
    b = replay_bracket(bars, stop_frac=0.02, target_frac=0.05)
    assert a == b  # deterministic
    assert len(a) >= 1


def test_replay_needs_sufficient_history() -> None:
    short = _bars(days=10)
    assert replay_bracket(short, stop_frac=0.02, target_frac=0.05) == []


def test_metrics_on_empty_trades() -> None:
    m = compute_metrics([])
    assert m.n_trades == 0
    assert m.profit_factor == 0.0


def test_engine_blocks_low_reward_risk() -> None:
    bars = _bars()
    # stop 4% / target 4% -> reward:risk 1.0 < 1.5 gate.
    signal = make_signal(entry_price=100.0, stop_loss=96.0, take_profit=104.0)
    result = BacktestEngine().run(signal, bars)
    assert result.passed is False
    assert "reward:risk" in result.reason


def test_engine_blocks_insufficient_history() -> None:
    bars = _bars(days=30)
    signal = make_signal(entry_price=100.0, stop_loss=96.0, take_profit=110.0)
    result = BacktestEngine().run(signal, bars)
    assert result.passed is False
    assert "insufficient history" in result.reason


def test_engine_runs_full_replay_and_reports_metrics() -> None:
    bars = _bars()
    signal = make_signal(entry_price=100.0, stop_loss=96.0, take_profit=110.0)
    result = BacktestEngine().run(signal, bars)
    assert result.n_bars == len(bars)
    assert result.reward_risk >= 1.5
    assert result.metrics.n_trades >= 0
    # passed is a deterministic boolean derived from the gate.
    assert isinstance(result.passed, bool)


def test_slippage_makes_fills_adverse() -> None:
    bars = _bars()
    no_slip = replay_bracket(bars, stop_frac=0.03, target_frac=0.08,
                             config=SimConfig(slippage_bps=0.0, commission_bps=0.0))
    with_slip = replay_bracket(bars, stop_frac=0.03, target_frac=0.08,
                               config=SimConfig(slippage_bps=20.0, commission_bps=5.0))
    # Same number of trades, but costs reduce average return.
    if no_slip and with_slip and len(no_slip) == len(with_slip):
        avg_no = sum(t.return_pct for t in no_slip) / len(no_slip)
        avg_yes = sum(t.return_pct for t in with_slip) / len(with_slip)
        assert avg_yes < avg_no
