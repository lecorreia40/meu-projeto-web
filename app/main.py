"""FastAPI application entrypoint for Mesa Proprietária com IA.

Run locally with:
    uvicorn app.main:app --reload

The app boots with the in-memory backend and live trading disabled. It wires the
read/advisory endpoints (health, memos, signals, risk) plus safety-forward
placeholders for orders/portfolio.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI

from api.routes import health, memos, orders, portfolio, risk, signals
from app.config import get_settings
from app.dependencies import get_app_logger
from core.events import EventType


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    logger = get_app_logger()
    logger.info(
        EventType.SYSTEM_STARTED,
        entity_id=settings.app_name,
        env=settings.app_env,
        execution_mode=settings.execution_mode.value,
        live_trading_enabled=settings.live_trading_enabled,
    )
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Mesa Proprietária com IA",
        version="0.1.0",
        description=(
            "Proprietary AI-powered trading desk — research, backtesting, and "
            "paper trading. Operates the owner's own capital only. Live trading "
            "is disabled by default and not implemented in the MVP."
        ),
        lifespan=lifespan,
    )

    app.include_router(health.router)
    app.include_router(memos.router)
    app.include_router(signals.router)
    app.include_router(risk.router)
    app.include_router(orders.router)
    app.include_router(portfolio.router)

    @app.get("/", tags=["root"])
    def root() -> dict[str, object]:
        return {
            "name": "Mesa Proprietária com IA",
            "status": "ok",
            "live_trading_enabled": settings.live_trading_enabled,
            "docs": "/docs",
        }

    return app


app = create_app()
