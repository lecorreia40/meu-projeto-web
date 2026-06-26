"""Runtime configuration for the admin control panel.

A single-process, owner-operated store of operational settings the admin panel
can change without editing code:

  * which research agents are enabled,
  * the active risk policy limits.

Safety rails are baked in:
  * Mandatory agents (skeptic, risk analyst, orchestrator) cannot be disabled.
  * Only numeric risk *limits* are editable — the dangerous capability flags
    (short/options/crypto/leverage) and the live-trading flag are never
    editable here.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import BaseModel, ConfigDict

from risk.policy import MVP_RISK_POLICY, RiskPolicy

# Agent registry shown in the admin panel. The four directional analysts can be
# toggled; the rest are mandatory for safety/explainability.
AGENT_REGISTRY: list[dict[str, object]] = [
    {"key": "fundamental", "name": "Fundamental Analyst", "mandatory": False},
    {"key": "technical", "name": "Technical Quant", "mandatory": False},
    {"key": "news", "name": "News & Sentiment", "mandatory": False},
    {"key": "macro", "name": "Macro & Sector", "mandatory": False},
    {"key": "skeptic", "name": "Skeptic / Red Team", "mandatory": True},
    {"key": "risk_analyst", "name": "Risk Analyst", "mandatory": True},
    {"key": "orchestrator", "name": "Orchestrator", "mandatory": True},
]

_DIRECTIONAL = {"fundamental", "technical", "news", "macro"}
_MANDATORY = {a["key"] for a in AGENT_REGISTRY if a["mandatory"]}

# Risk-policy fields the admin panel is allowed to change (numeric limits only).
EDITABLE_RISK_FIELDS = (
    "max_risk_per_trade_pct",
    "max_position_size_pct",
    "max_daily_loss_pct",
    "max_weekly_loss_pct",
    "max_open_positions",
    "max_total_exposure_pct",
)


class AgentState(BaseModel):
    model_config = ConfigDict(frozen=True)

    key: str
    name: str
    mandatory: bool
    enabled: bool


class RuntimeConfig:
    """Process-wide, mutable operational config (owner-operated)."""

    #: Minimum aggregate (post-skeptic) confidence for a memo to be COMPLETE.
    DEFAULT_CONFIDENCE_THRESHOLD = 0.15

    def __init__(self) -> None:
        self._enabled: dict[str, bool] = {a["key"]: True for a in AGENT_REGISTRY}  # type: ignore[index]
        self._policy: RiskPolicy = MVP_RISK_POLICY
        self._confidence_threshold: float = self.DEFAULT_CONFIDENCE_THRESHOLD

    # --- Evaluation tuning ---
    def confidence_threshold(self) -> float:
        return self._confidence_threshold

    def set_confidence_threshold(self, value: float) -> float:
        if not (0.0 <= value <= 1.0):
            raise ValueError("confidence_threshold must be between 0 and 1")
        self._confidence_threshold = value
        return self._confidence_threshold

    # --- Agents ---
    def agents(self) -> list[AgentState]:
        return [
            AgentState(
                key=a["key"], name=a["name"], mandatory=a["mandatory"],  # type: ignore[arg-type]
                enabled=self._enabled[a["key"]],  # type: ignore[index]
            )
            for a in AGENT_REGISTRY
        ]

    def set_agent_enabled(self, key: str, enabled: bool) -> AgentState:
        if key not in self._enabled:
            raise KeyError(f"unknown agent: {key}")
        if key in _MANDATORY and not enabled:
            raise ValueError(f"agent '{key}' is mandatory and cannot be disabled")
        self._enabled[key] = enabled
        meta = next(a for a in AGENT_REGISTRY if a["key"] == key)
        return AgentState(
            key=key, name=meta["name"], mandatory=meta["mandatory"], enabled=enabled,  # type: ignore[arg-type]
        )

    def enabled_directional(self) -> set[str]:
        """The set of enabled directional analysts (used by the orchestrator)."""
        return {k for k in _DIRECTIONAL if self._enabled.get(k, True)}

    # --- Risk policy ---
    def policy(self) -> RiskPolicy:
        return self._policy

    def update_policy(self, **limits: float) -> RiskPolicy:
        """Update editable numeric limits only. Rejects unknown/forbidden fields."""
        clean: dict[str, float] = {}
        for field, value in limits.items():
            if value is None:
                continue
            if field not in EDITABLE_RISK_FIELDS:
                raise ValueError(f"field '{field}' is not editable via the admin panel")
            if value <= 0:
                raise ValueError(f"field '{field}' must be positive")
            clean[field] = value
        # model_copy validates against the (frozen) RiskPolicy schema.
        self._policy = self._policy.model_copy(update=clean)
        return self._policy

    def reset(self) -> None:
        self._enabled = {a["key"]: True for a in AGENT_REGISTRY}  # type: ignore[index]
        self._policy = MVP_RISK_POLICY
        self._confidence_threshold = self.DEFAULT_CONFIDENCE_THRESHOLD


@lru_cache
def get_runtime_config() -> RuntimeConfig:
    return RuntimeConfig()
