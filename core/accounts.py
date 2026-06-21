"""Trading accounts: the test (paper) account and the gated real (live) account.

There are exactly two accounts in this workspace:

  * **test / paper** — ACTIVE. The default. Simulated fills, simulated money.
    Everything the desk does runs here. Safe to operate freely.

  * **real / live** — DISABLED and GATED. It exists as a concrete object so the
    owner can see *where* real-broker credentials would go and *what* would have
    to be true before a single real order could ever be placed. It is wired to
    the live-readiness checklist, which always reports NOT READY in the MVP. No
    real credentials live in the repo; they would come only from environment
    variables, and even with them present the readiness gate stays closed.

This module never enables live trading. It only describes and reports.
"""

from __future__ import annotations

import os

from pydantic import BaseModel, ConfigDict

from app.config import Settings, get_settings
from execution.live_readiness import ReadinessReport, evaluate_readiness


class AccountCredentialSlot(BaseModel):
    """Describes one credential the real account would need — and whether the
    environment currently provides it. The *value* is never returned, only a
    boolean 'present' flag, so secrets never leave the process."""

    model_config = ConfigDict(frozen=True)

    env_var: str
    label: str
    present: bool


class TradingAccount(BaseModel):
    model_config = ConfigDict(frozen=True)

    key: str
    name: str
    mode: str  # "paper" | "live"
    status: str  # "active" | "disabled"
    broker: str
    starting_balance: float
    description: str
    can_trade: bool
    # Only populated for the live account.
    credential_slots: list[AccountCredentialSlot] = []
    readiness: ReadinessReport | None = None


# Credentials the real account would require. These are env-var NAMES only;
# their values are read from the environment at runtime and never stored here.
_LIVE_CREDENTIAL_VARS: list[tuple[str, str]] = [
    ("IBKR_ACCOUNT_ID", "Conta da corretora (ex.: Interactive Brokers)"),
    ("IBKR_API_HOST", "Host do gateway/TWS da corretora"),
    ("IBKR_API_PORT", "Porta do gateway/TWS da corretora"),
    ("BROKER_API_KEY", "Chave de API da corretora"),
    ("BROKER_API_SECRET", "Segredo de API da corretora"),
]


def _credential_slots() -> list[AccountCredentialSlot]:
    return [
        AccountCredentialSlot(
            env_var=var,
            label=label,
            present=bool(os.environ.get(var)),
        )
        for var, label in _LIVE_CREDENTIAL_VARS
    ]


def list_accounts(settings: Settings | None = None) -> list[TradingAccount]:
    """Return the two workspace accounts: paper (active) and live (gated)."""
    settings = settings or get_settings()

    paper = TradingAccount(
        key="paper",
        name="Conta Teste (Paper)",
        mode="paper",
        status="active",
        broker="paper-sim",
        starting_balance=100_000.0,
        description=(
            "Conta padrão de simulação. Ordens e saldos são simulados — nenhum "
            "dinheiro real é movimentado. Toda a operação da mesa roda aqui."
        ),
        can_trade=True,
    )

    # The real account is reported through the same readiness gate used by the
    # execution chokepoint. In the MVP this is always NOT READY.
    report = evaluate_readiness(settings, broker=None)
    live = TradingAccount(
        key="live",
        name="Conta Real (Live)",
        mode="live",
        status="disabled",
        broker="ibkr (gated)",
        starting_balance=0.0,
        description=(
            "Conta real, TRAVADA por segurança. Execução com dinheiro real NÃO "
            "está implementada e não é ligada automaticamente. As credenciais da "
            "corretora entram apenas por variáveis de ambiente (nunca no código). "
            "Mesmo com as credenciais presentes, a trava de prontidão (live "
            "readiness) permanece fechada até haver track record em paper, "
            "sign-off humano e revisão de compliance."
        ),
        can_trade=False,  # never true in the MVP
        credential_slots=_credential_slots(),
        readiness=report,
    )
    return [paper, live]


def get_accounts_payload(settings: Settings | None = None) -> dict[str, object]:
    accounts = list_accounts(settings)
    return {
        "accounts": [a.model_dump() for a in accounts],
        "live_trading_enabled": (settings or get_settings()).live_trading_enabled,
        "active_account": "paper",
    }
