"""Price-feed factory: choose the mock or a real provider, fail-closed.

One place decides which :class:`PriceFeed` the desk runs on, based on settings:

  * ``market_data_provider="mock"`` (default) -> deterministic offline feed.
  * ``market_data_provider="alpaca"``        -> real Alpaca feed, but ONLY if
    credentials are present; otherwise it raises (fail closed) instead of
    silently falling back to synthetic prices.

``describe_data_source`` reports the current configuration for the admin panel —
which provider is active, whether it is real, and which credential env-vars are
present (names and a present/absent flag only; never the secret values).
"""

from __future__ import annotations

import os

from app.config import Settings, get_settings
from core.exceptions import ConfigurationError, DataQualityError
from data.ingestion.prices import MockPriceFeed, PriceFeed

_SUPPORTED_REAL = {"alpaca"}

# Credential env-vars a real feed needs (names only; values read at runtime).
_CREDENTIAL_VARS: list[tuple[str, str]] = [
    ("MARKET_DATA_API_KEY", "Chave de API do provedor de dados"),
    ("MARKET_DATA_API_SECRET", "Segredo de API do provedor de dados"),
]


def build_price_feed(settings: Settings | None = None, *, seed: int = 42) -> PriceFeed:
    """Return the configured price feed. Fail closed on a misconfigured real feed."""
    settings = settings or get_settings()
    provider = settings.market_data_provider.strip().lower()

    if provider in ("", "mock"):
        return MockPriceFeed(seed=seed)

    if provider not in _SUPPORTED_REAL:
        raise ConfigurationError(
            f"unknown market_data_provider '{provider}'; "
            f"supported: mock, {', '.join(sorted(_SUPPORTED_REAL))}"
        )

    if not settings.market_data_configured:
        # Selected a real provider but no credentials -> never invent prices.
        raise DataQualityError(
            f"market_data_provider='{provider}' selected but credentials are "
            "missing; set MARKET_DATA_API_KEY and MARKET_DATA_API_SECRET"
        )

    # Imported lazily so the mock path has zero extra imports.
    from data.ingestion.real_feed import AlpacaPriceFeed

    return AlpacaPriceFeed(
        api_key=settings.market_data_api_key,
        api_secret=settings.market_data_api_secret,
        base_url=settings.market_data_base_url,
        feed=settings.market_data_feed,
    )


def describe_data_source(settings: Settings | None = None) -> dict[str, object]:
    """Report the active data source for the admin panel (no secret values)."""
    settings = settings or get_settings()
    provider = settings.market_data_provider.strip().lower() or "mock"
    is_real = settings.market_data_is_real
    return {
        "provider": provider,
        "is_real": is_real,
        "configured": settings.market_data_configured,
        "feed": settings.market_data_feed if is_real else None,
        "base_url": settings.market_data_base_url if is_real else None,
        # When real & configured it's "live"; real but missing keys is "blocked"
        # (fail-closed); mock is "mock".
        "status": (
            "mock" if not is_real
            else "live" if settings.market_data_configured
            else "blocked"
        ),
        "label": "Dados sintéticos (mock)" if not is_real else f"Dados reais ({provider})",
        "credential_slots": [
            {"env_var": var, "label": label, "present": bool(os.environ.get(var))}
            for var, label in _CREDENTIAL_VARS
        ],
    }
