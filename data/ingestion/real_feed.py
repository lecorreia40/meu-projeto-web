"""Real market-data ingestion (Alpaca Market Data) — opt-in, fail-closed.

This is the first *real* data source behind the :class:`PriceFeed` interface.
It pulls daily OHLCV bars from Alpaca Market Data. It is only used when
``MARKET_DATA_PROVIDER=alpaca`` and the credentials are present; otherwise the
deterministic :class:`MockPriceFeed` is used.

Safety principle — **fail closed**: if the provider is selected but unreachable,
unauthorized, or returns malformed/empty data, this feed raises
:class:`DataQualityError` instead of returning anything. The desk must never
trade on invented or partial prices. Credentials come only from the environment;
no secret values are stored or logged here.

Network access uses only the standard library (``urllib``), so there is no extra
runtime dependency to install. The JSON parser is a pure function so it can be
unit-tested offline against a captured payload.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

from core.exceptions import DataQualityError
from data.market_schema import MarketBar


def parse_alpaca_bars(symbol: str, payload: dict) -> list[MarketBar]:
    """Convert an Alpaca ``/v2/stocks/{symbol}/bars`` response into MarketBars.

    Pure function (no I/O) so it is fully testable offline. Bars that fail OHLC
    validation are skipped rather than crashing the whole series, but an empty
    or missing ``bars`` array is treated as a data-quality failure.
    """
    raw = payload.get("bars")
    if not raw:
        raise DataQualityError(f"no bars returned for {symbol}")

    bars: list[MarketBar] = []
    for b in raw:
        try:
            ts = datetime.fromisoformat(str(b["t"]).replace("Z", "+00:00"))
            bars.append(
                MarketBar(
                    symbol=symbol,
                    timestamp=ts,
                    open=float(b["o"]),
                    high=float(b["h"]),
                    low=float(b["l"]),
                    close=float(b["c"]),
                    volume=int(b["v"]),
                )
            )
        except (KeyError, ValueError, TypeError):
            # Skip a single malformed/inconsistent bar; keep the rest.
            continue

    if not bars:
        raise DataQualityError(f"all bars for {symbol} failed validation")
    bars.sort(key=lambda x: x.timestamp)
    return bars


class AlpacaPriceFeed:
    """Daily OHLCV bars from Alpaca Market Data. Fail-closed on any error."""

    def __init__(
        self,
        *,
        api_key: str,
        api_secret: str,
        base_url: str = "https://data.alpaca.markets",
        feed: str = "iex",
        timeout: float = 10.0,
    ) -> None:
        if not api_key or not api_secret:
            # Fail closed: never run a real feed without credentials.
            raise DataQualityError("Alpaca feed requires API key and secret")
        self._key = api_key
        self._secret = api_secret
        self._base = base_url.rstrip("/")
        self._feed = feed
        self._timeout = timeout

    def _get(self, url: str) -> dict:
        req = urllib.request.Request(url, method="GET")
        req.add_header("APCA-API-KEY-ID", self._key)
        req.add_header("APCA-API-SECRET-KEY", self._secret)
        try:
            with urllib.request.urlopen(req, timeout=self._timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:  # 401/403/429/5xx -> fail closed
            raise DataQualityError(
                f"market data HTTP {exc.code} for {url.split('?')[0]}"
            ) from exc
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            raise DataQualityError(f"market data request failed: {exc}") from exc

    def fetch_bars(self, symbol: str, *, days: int = 120) -> list[MarketBar]:
        # Pull a generous window so indicators (SMA50, etc.) have history.
        start = (datetime.now(timezone.utc) - timedelta(days=days * 2)).date()
        query = urllib.parse.urlencode({
            "timeframe": "1Day",
            "start": start.isoformat(),
            "limit": max(days, 100),
            "feed": self._feed,
            "adjustment": "split",
        })
        url = f"{self._base}/v2/stocks/{urllib.parse.quote(symbol)}/bars?{query}"
        payload = self._get(url)
        bars = parse_alpaca_bars(symbol, payload)
        # Return at most the requested number of most-recent bars.
        return bars[-days:] if len(bars) > days else bars
