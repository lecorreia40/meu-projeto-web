"""The MVP asset universe: US-listed liquid stocks and ETFs only.

Long-only. No leverage, options, crypto, or shorting. This list is the single
source of truth for which symbols the system is allowed to consider.
"""

from __future__ import annotations

from core.enums import AssetType
from data.market_schema import Asset

# (symbol, name, asset_type)
_UNIVERSE_DEF: list[tuple[str, str, AssetType]] = [
    # Broad-market and sector ETFs
    ("SPY", "SPDR S&P 500 ETF Trust", AssetType.ETF),
    ("QQQ", "Invesco QQQ Trust", AssetType.ETF),
    ("IWM", "iShares Russell 2000 ETF", AssetType.ETF),
    ("DIA", "SPDR Dow Jones Industrial Average ETF", AssetType.ETF),
    ("XLK", "Technology Select Sector SPDR Fund", AssetType.ETF),
    ("XLF", "Financial Select Sector SPDR Fund", AssetType.ETF),
    ("XLE", "Energy Select Sector SPDR Fund", AssetType.ETF),
    ("XLI", "Industrial Select Sector SPDR Fund", AssetType.ETF),
    ("XLV", "Health Care Select Sector SPDR Fund", AssetType.ETF),
    ("XLY", "Consumer Discretionary Select Sector SPDR Fund", AssetType.ETF),
    ("XLP", "Consumer Staples Select Sector SPDR Fund", AssetType.ETF),
    # Large-cap single names
    ("AAPL", "Apple Inc.", AssetType.STOCK),
    ("MSFT", "Microsoft Corporation", AssetType.STOCK),
    ("NVDA", "NVIDIA Corporation", AssetType.STOCK),
    ("AMZN", "Amazon.com, Inc.", AssetType.STOCK),
    ("META", "Meta Platforms, Inc.", AssetType.STOCK),
    ("GOOGL", "Alphabet Inc.", AssetType.STOCK),
    ("TSLA", "Tesla, Inc.", AssetType.STOCK),
    ("JPM", "JPMorgan Chase & Co.", AssetType.STOCK),
    ("V", "Visa Inc.", AssetType.STOCK),
    ("MA", "Mastercard Incorporated", AssetType.STOCK),
]

UNIVERSE: dict[str, Asset] = {
    symbol: Asset(symbol=symbol, name=name, asset_type=asset_type)
    for symbol, name, asset_type in _UNIVERSE_DEF
}

SYMBOLS: list[str] = list(UNIVERSE.keys())


def is_in_universe(symbol: str) -> bool:
    return symbol in UNIVERSE


def get_asset(symbol: str) -> Asset:
    """Return the :class:`Asset` for ``symbol`` or raise ``KeyError``."""
    return UNIVERSE[symbol]
