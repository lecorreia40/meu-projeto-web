"""Broker abstraction.

ALL broker interactions go through :class:`BrokerInterface`. The MVP ships only
:class:`~execution.paper_trading.PaperBroker`. A real adapter (Interactive
Brokers paper, Phase 9) must implement this same interface — and even then,
live trading stays gated behind ``LIVE_TRADING_ENABLED`` and the risk engine.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from execution.order_schema import Fill, Order


class BrokerInterface(ABC):
    """Every broker (paper or, later, real) implements this."""

    @property
    @abstractmethod
    def name(self) -> str: ...

    @property
    @abstractmethod
    def supports_live(self) -> bool:
        """Whether this broker can place real orders. The paper broker returns
        ``False`` — it is structurally incapable of live trading."""

    @abstractmethod
    def is_connected(self) -> bool: ...

    @abstractmethod
    def submit_order(self, order: Order, *, mark_price: float) -> Fill:
        """Submit an order and return the resulting fill."""
