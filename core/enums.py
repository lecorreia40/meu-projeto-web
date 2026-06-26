"""Shared domain enumerations used across schemas.

Centralized to avoid cross-package coupling between memos, signals, orders,
and positions.
"""

from __future__ import annotations

from enum import Enum


class AssetType(str, Enum):
    STOCK = "stock"
    ETF = "etf"


class Direction(str, Enum):
    """Trade direction. MVP is long-only; ``SHORT`` exists so the risk engine
    can explicitly *reject* it, never to enable it."""

    LONG = "long"
    SHORT = "short"


class TimeHorizon(str, Enum):
    INTRADAY = "intraday"
    SWING = "swing"        # days
    POSITION = "position"  # weeks to months
