"""Real market-data feed: parser, factory selection, and fail-closed behavior."""

from __future__ import annotations

import pytest

from app.config import Settings
from core.exceptions import ConfigurationError, DataQualityError
from data.ingestion.feed_factory import build_price_feed, describe_data_source
from data.ingestion.prices import MockPriceFeed
from data.ingestion.real_feed import AlpacaPriceFeed, parse_alpaca_bars

# A captured-shape Alpaca /v2/stocks/{symbol}/bars payload (no network).
_SAMPLE = {
    "symbol": "AAPL",
    "bars": [
        {"t": "2024-01-02T05:00:00Z", "o": 187.0, "h": 188.4, "l": 183.9, "c": 185.6, "v": 82488200},
        {"t": "2024-01-03T05:00:00Z", "o": 184.2, "h": 185.9, "l": 183.4, "c": 184.3, "v": 58414500},
    ],
    "next_page_token": None,
}


# --- Parser (pure, offline) -------------------------------------------------

def test_parse_alpaca_bars_maps_fields() -> None:
    bars = parse_alpaca_bars("AAPL", _SAMPLE)
    assert len(bars) == 2
    assert bars[0].symbol == "AAPL"
    assert bars[0].open == 187.0 and bars[0].close == 185.6
    assert bars[0].volume == 82488200
    # Sorted chronologically.
    assert bars[0].timestamp < bars[1].timestamp


def test_parse_empty_bars_fails_closed() -> None:
    with pytest.raises(DataQualityError):
        parse_alpaca_bars("AAPL", {"bars": []})
    with pytest.raises(DataQualityError):
        parse_alpaca_bars("AAPL", {})


def test_parse_skips_malformed_bar_but_keeps_valid() -> None:
    payload = {
        "bars": [
            {"t": "2024-01-02T05:00:00Z", "o": 10, "h": 11, "l": 9, "c": 10, "v": 100},
            {"t": "2024-01-03T05:00:00Z", "o": 10, "h": 5, "l": 9, "c": 10, "v": 100},  # high<low
        ]
    }
    bars = parse_alpaca_bars("X", payload)
    assert len(bars) == 1


def test_parse_all_malformed_fails_closed() -> None:
    payload = {"bars": [{"t": "2024-01-02T05:00:00Z", "o": 10, "h": 5, "l": 9, "c": 10, "v": 100}]}
    with pytest.raises(DataQualityError):
        parse_alpaca_bars("X", payload)


# --- Real feed construction is fail-closed ----------------------------------

def test_alpaca_feed_requires_credentials() -> None:
    with pytest.raises(DataQualityError):
        AlpacaPriceFeed(api_key="", api_secret="")


# --- Factory ----------------------------------------------------------------

def test_factory_defaults_to_mock() -> None:
    feed = build_price_feed(Settings(market_data_provider="mock"), seed=7)
    assert isinstance(feed, MockPriceFeed)


def test_factory_unknown_provider_raises() -> None:
    with pytest.raises(ConfigurationError):
        build_price_feed(Settings(market_data_provider="bloomberg"))


def test_factory_real_without_keys_fails_closed() -> None:
    # Selected a real provider but no credentials -> never invent prices.
    with pytest.raises(DataQualityError):
        build_price_feed(Settings(market_data_provider="alpaca"))


def test_factory_real_with_keys_builds_real_feed() -> None:
    settings = Settings(
        market_data_provider="alpaca",
        market_data_api_key="k",
        market_data_api_secret="s",
    )
    feed = build_price_feed(settings)
    assert isinstance(feed, AlpacaPriceFeed)


# --- describe_data_source ---------------------------------------------------

def test_describe_mock_source() -> None:
    d = describe_data_source(Settings(market_data_provider="mock"))
    assert d["status"] == "mock"
    assert d["is_real"] is False
    assert {s["env_var"] for s in d["credential_slots"]} == {
        "MARKET_DATA_API_KEY", "MARKET_DATA_API_SECRET"
    }


def test_describe_real_but_unconfigured_is_blocked() -> None:
    d = describe_data_source(Settings(market_data_provider="alpaca"))
    assert d["status"] == "blocked"  # fail-closed: real selected, keys missing
    assert d["is_real"] is True
    assert d["configured"] is False


def test_describe_real_configured_is_live() -> None:
    d = describe_data_source(Settings(
        market_data_provider="alpaca",
        market_data_api_key="k",
        market_data_api_secret="s",
    ))
    assert d["status"] == "live"
    assert d["configured"] is True
