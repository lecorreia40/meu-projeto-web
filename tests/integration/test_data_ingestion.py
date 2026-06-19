"""Integration: mock ingestion -> in-memory store -> feature computation -> risk.

Exercises the Sprint 1 pipeline end to end without any external service.
"""

from __future__ import annotations

from data.ingestion.prices import MockPriceFeed, ingest_universe
from data.market_schema import MarketBar
from data.storage.memory import InMemoryTimeSeriesRepository
from data.universe import SYMBOLS
from features.liquidity import liquidity_score
from features.technical_indicators import closes, moving_average
from risk.risk_engine import RiskEngine
from risk.rules import RiskContext
from tests.conftest import make_signal


def test_ingest_universe_populates_repository() -> None:
    repo: InMemoryTimeSeriesRepository[MarketBar] = InMemoryTimeSeriesRepository()
    counts = ingest_universe(repo, feed=MockPriceFeed(seed=3), days=90)

    assert set(counts.keys()) == set(SYMBOLS)
    assert all(n == 90 for n in counts.values())
    assert set(repo.symbols()) == set(SYMBOLS)
    assert len(repo.get_bars("AAPL")) == 90


def test_pipeline_feeds_features_and_risk() -> None:
    repo: InMemoryTimeSeriesRepository[MarketBar] = InMemoryTimeSeriesRepository()
    ingest_universe(repo, feed=MockPriceFeed(seed=5), days=120)

    bars = repo.get_bars("MSFT")
    prices = closes(bars)

    # Features compute cleanly with enough history.
    assert moving_average(prices, window=20) is not None
    score = liquidity_score(bars)
    assert score is not None

    # Feed the real measured context into the risk engine.
    ctx = RiskContext(price_history_bars=len(bars), liquidity_score=score)
    decision = RiskEngine().evaluate(make_signal(symbol="MSFT"), ctx)
    assert decision.approved is True


def test_get_bars_limit_returns_tail() -> None:
    repo: InMemoryTimeSeriesRepository[MarketBar] = InMemoryTimeSeriesRepository()
    ingest_universe(repo, feed=MockPriceFeed(seed=9), days=100, symbols=["SPY"])
    last10 = repo.get_bars("SPY", limit=10)
    assert len(last10) == 10
    assert last10 == repo.get_bars("SPY")[-10:]
