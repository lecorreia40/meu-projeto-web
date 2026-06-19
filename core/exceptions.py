"""Domain exception hierarchy for Mesa Proprietária com IA.

All custom errors inherit from :class:`MesaError` so callers can catch the whole
family. Execution and risk errors are kept distinct because the system must
*fail closed* (no trade) whenever any of them is raised.
"""

from __future__ import annotations


class MesaError(Exception):
    """Base class for all domain errors."""


class ConfigurationError(MesaError):
    """Invalid or missing configuration."""


class DataQualityError(MesaError):
    """Market data failed a quality gate; the system must not trade on it."""


class InsufficientHistoryError(DataQualityError):
    """Not enough price history to compute features or validate a signal."""


class ValidationError(MesaError):
    """A schema or business-rule validation failed."""


class RiskBlockedError(MesaError):
    """The deterministic risk engine blocked an action.

    Carries the structured block reasons so callers can audit *why*.
    """

    def __init__(self, message: str, reasons: list[str] | None = None) -> None:
        super().__init__(message)
        self.reasons: list[str] = reasons or []


class BrokerError(MesaError):
    """Broker/execution layer failure; the system must not trade."""


class LiveTradingDisabledError(BrokerError):
    """A live order was attempted while live trading is disabled."""


class LLMProviderError(MesaError):
    """The LLM provider failed or returned an incomplete/uncertain response."""
