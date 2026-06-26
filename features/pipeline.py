"""Feature set assembly.

Turns a window of OHLCV bars into a single structured :class:`FeatureSet` that
the agent swarm consumes. Computing features once, here, keeps every agent
looking at the same numbers (consistency + auditability).
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from data.market_schema import MarketBar
from features.liquidity import liquidity_score
from features.momentum import momentum
from features.technical_indicators import atr, closes, moving_average, rsi, simple_returns
from features.volatility import annualized_volatility


class FeatureSet(BaseModel):
    """Computed features for one symbol at the latest bar.

    Fields are ``None`` when there is insufficient history; downstream agents
    must lower confidence (and the risk engine blocks) rather than guess.
    """

    model_config = ConfigDict(frozen=True)

    symbol: str
    history_len: int
    last_price: float
    sma20: float | None = None
    sma50: float | None = None
    rsi14: float | None = None
    atr14: float | None = None
    annualized_vol: float | None = None
    momentum20: float | None = None
    liquidity: float | None = None

    @property
    def above_sma20(self) -> bool:
        return self.sma20 is not None and self.last_price > self.sma20

    @property
    def above_sma50(self) -> bool:
        return self.sma50 is not None and self.last_price > self.sma50

    @property
    def is_complete(self) -> bool:
        """True when every feature needed for a full thesis is available."""
        return all(
            v is not None
            for v in (self.sma20, self.sma50, self.rsi14, self.atr14,
                      self.annualized_vol, self.momentum20, self.liquidity)
        )


def build_feature_set(symbol: str, bars: list[MarketBar]) -> FeatureSet:
    """Compute a :class:`FeatureSet` from a chronological list of bars."""
    if not bars:
        raise ValueError("cannot build features from an empty bar series")

    prices = closes(bars)
    rets = simple_returns(prices)
    return FeatureSet(
        symbol=symbol,
        history_len=len(bars),
        last_price=prices[-1],
        sma20=moving_average(prices, 20),
        sma50=moving_average(prices, 50),
        rsi14=rsi(prices, 14),
        atr14=atr(bars, 14),
        annualized_vol=annualized_volatility(rets),
        momentum20=momentum(prices, 20),
        liquidity=liquidity_score(bars),
    )
