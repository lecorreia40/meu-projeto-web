"""Signal ranking.

Orders candidate signals by an expectancy proxy: confidence times reward:risk.
Used to prioritize which approved signals to act on first when capacity (max
open positions) is limited.
"""

from __future__ import annotations

from signals.signal_schema import TradingSignal


def reward_risk(signal: TradingSignal) -> float:
    """Reward:risk ratio implied by the signal's levels."""
    risk = abs(signal.entry_price - signal.stop_loss)
    if risk <= 0:
        return 0.0
    return abs(signal.take_profit - signal.entry_price) / risk


def signal_score(signal: TradingSignal) -> float:
    """A simple expectancy proxy in arbitrary units."""
    return signal.confidence_score * reward_risk(signal)


def rank_signals(signals: list[TradingSignal]) -> list[TradingSignal]:
    """Return signals sorted best-first by :func:`signal_score`."""
    return sorted(signals, key=signal_score, reverse=True)
