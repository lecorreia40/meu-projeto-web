"""Application settings.

Loaded from environment variables / ``.env`` via pydantic-settings. The most
important field is :attr:`Settings.live_trading_enabled`, which defaults to
``False`` and gates *all* live execution. The MVP must keep it false.
"""

from __future__ import annotations

from enum import Enum
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class ExecutionMode(str, Enum):
    PAPER = "paper"
    LIVE = "live"


class RepositoryBackend(str, Enum):
    MEMORY = "memory"
    POSTGRES = "postgres"


class Settings(BaseSettings):
    """Typed application configuration with safe defaults."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- Application ---
    app_name: str = "mesa-proprietaria-ia"
    app_env: str = "development"
    log_level: str = "INFO"
    log_dir: str = "./logs"

    # --- Safety / execution -------------------------------------------------
    # Hard safety default: live trading is OFF.
    live_trading_enabled: bool = Field(default=False)
    execution_mode: ExecutionMode = Field(default=ExecutionMode.PAPER)

    # --- Repositories ---
    repository_backend: RepositoryBackend = Field(default=RepositoryBackend.MEMORY)

    # --- PostgreSQL (only used when repository_backend == postgres) ---
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "mesa"
    postgres_user: str = "mesa"
    postgres_password: str = ""
    database_url: str = ""

    # --- Risk policy overrides (defaults mirror risk/policy.py) ---
    risk_max_risk_per_trade_pct: float = 1.0
    risk_max_position_size_pct: float = 2.0
    risk_max_daily_loss_pct: float = 2.0
    risk_max_weekly_loss_pct: float = 5.0
    risk_max_open_positions: int = 3
    risk_max_total_exposure_pct: float = 20.0

    @property
    def is_live_trading_allowed(self) -> bool:
        """Live trading requires BOTH the flag and paper mode being turned off.

        This is intentionally conservative: the default configuration can never
        place a live order.
        """
        return self.live_trading_enabled and self.execution_mode is ExecutionMode.LIVE

    @property
    def effective_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache
def get_settings() -> Settings:
    """Cached settings accessor (one instance per process)."""
    return Settings()
