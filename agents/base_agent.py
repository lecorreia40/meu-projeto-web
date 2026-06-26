"""Agent base class and shared contracts.

The agent swarm is the *advisory* plane: agents read features and emit a
structured :class:`AgentOpinion`. They NEVER place orders, never touch the
broker, and never override the risk engine.

Sprint 2 uses a deterministic mock LLM (:class:`MockLLMClient`) so the whole
pipeline runs offline and reproducibly. Real LLM clients implement the same
:class:`LLMClient` protocol and can be dropped in later (Phase 3+). Every
opinion records ``model_version`` and ``prompt_version`` for explainability.
"""

from __future__ import annotations

import hashlib
from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field

from core.clock import utcnow
from features.pipeline import FeatureSet

_PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"


class Stance(str, Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"


class AgentOpinion(BaseModel):
    """A single agent's structured, explainable opinion on one symbol."""

    model_config = ConfigDict(frozen=True)

    agent: str
    symbol: str
    stance: Stance
    confidence: float = Field(..., ge=0.0, le=1.0)
    rationale: str
    key_points: list[str] = Field(default_factory=list)
    model_version: str
    prompt_version: str
    created_at: datetime = Field(default_factory=utcnow)


class LLMClient(Protocol):
    """Minimal interface an LLM backend must satisfy."""

    @property
    def model_version(self) -> str: ...

    def complete(self, prompt: str, context: dict) -> dict: ...


class MockLLMClient:
    """Deterministic stand-in for a real LLM.

    It returns a stable pseudo-random number in [0, 1] derived from the prompt
    and context key, so agents can blend it with real computed features while
    staying fully reproducible. No network, no API key.
    """

    def __init__(self, model_version: str = "mock-llm-v1") -> None:
        self._model_version = model_version

    @property
    def model_version(self) -> str:
        return self._model_version

    def complete(self, prompt: str, context: dict) -> dict:
        seed_src = f"{prompt}:{sorted(context.items())}"
        digest = hashlib.sha256(seed_src.encode()).hexdigest()
        unit = int(digest[:8], 16) / 0xFFFFFFFF
        return {"score": unit, "digest": digest}


def stable_unit(*parts: object) -> float:
    """A deterministic float in [0, 1] from arbitrary inputs (for mock signals)."""
    src = ":".join(str(p) for p in parts)
    digest = hashlib.sha256(src.encode()).hexdigest()
    return int(digest[:8], 16) / 0xFFFFFFFF


def load_prompt(name: str) -> tuple[str, str]:
    """Load an agent prompt file, returning ``(text, version)``.

    The version is parsed from a ``version: X.Y.Z`` line near the top. Missing
    files or versions degrade gracefully to ``"0.0.0"`` so the pipeline still
    runs (the absence is visible in the audit trail).
    """
    path = _PROMPTS_DIR / f"{name}.md"
    if not path.exists():
        return ("", "0.0.0")
    text = path.read_text(encoding="utf-8")
    version = "0.0.0"
    for line in text.splitlines()[:10]:
        stripped = line.strip()
        if stripped.lower().startswith("version:"):
            version = stripped.split(":", 1)[1].strip()
            break
    return (text, version)


class BaseAgent(ABC):
    """Base class for all research agents.

    Subclasses implement :meth:`analyze`. The base handles prompt/version
    loading and opinion construction so every agent is explainable by default.
    """

    #: Filename stem under agents/prompts/ and the agent's logical name.
    prompt_name: str = "base"
    display_name: str = "Base Agent"

    def __init__(self, llm: LLMClient | None = None) -> None:
        self.llm = llm or MockLLMClient()
        self.prompt_text, self.prompt_version = load_prompt(self.prompt_name)

    @property
    def model_version(self) -> str:
        return self.llm.model_version

    @abstractmethod
    def analyze(self, features: FeatureSet) -> tuple[Stance, float, str, list[str]]:
        """Return ``(stance, confidence, rationale, key_points)`` for a symbol."""

    def run(self, features: FeatureSet) -> AgentOpinion:
        """Produce a fully-formed, explainable :class:`AgentOpinion`."""
        stance, confidence, rationale, key_points = self.analyze(features)
        confidence = max(0.0, min(1.0, confidence))
        return AgentOpinion(
            agent=self.display_name,
            symbol=features.symbol,
            stance=stance,
            confidence=confidence,
            rationale=rationale,
            key_points=key_points,
            model_version=self.model_version,
            prompt_version=self.prompt_version,
        )
