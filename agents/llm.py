"""LLM provider abstraction.

The agent swarm runs on a deterministic :class:`~agents.base_agent.MockLLMClient`
by default, so the whole system is offline and reproducible. This module adds a
*real* provider — the Anthropic Claude API — behind the same ``LLMClient``
protocol, plus a factory that selects the backend from configuration.

Safety posture:
  * The default is ``mock`` — no network, no API key.
  * The Anthropic client is **fail-closed**: it is only constructed when
    explicitly configured (``LLM_PROVIDER=anthropic``) *and* an API key is
    present; otherwise the factory falls back to mock. Any provider failure
    raises :class:`~core.exceptions.LLMProviderError`, which the risk engine
    treats as a no-trade condition.
  * No API key is ever hardcoded; it comes from settings / environment.
"""

from __future__ import annotations

from agents.base_agent import LLMClient, MockLLMClient
from app.config import Settings, get_settings
from core.exceptions import LLMProviderError

# Default model for the trading desk's AI plane (see the claude-api reference).
DEFAULT_MODEL = "claude-opus-4-8"


class AnthropicLLMClient:
    """Real LLM client backed by the Anthropic Claude API.

    Implements the :class:`LLMClient` protocol (``model_version`` + ``complete``)
    and adds :meth:`generate` for free-form text. The ``anthropic`` SDK is
    imported lazily so importing this module never requires the dependency.
    """

    def __init__(self, *, api_key: str, model: str = DEFAULT_MODEL) -> None:
        if not api_key:
            # Fail closed: never run a real provider without an explicit key.
            raise LLMProviderError("Anthropic LLM client requires an API key")
        self._model = model
        self._api_key = api_key
        self._client = None  # lazily constructed on first use

    @property
    def model_version(self) -> str:
        return self._model

    def _ensure_client(self) -> object:
        if self._client is None:
            try:
                import anthropic  # imported lazily; optional dependency
            except ImportError as exc:  # pragma: no cover - depends on env
                raise LLMProviderError(
                    "the 'anthropic' package is not installed; "
                    "install it or set LLM_PROVIDER=mock"
                ) from exc
            self._client = anthropic.Anthropic(api_key=self._api_key)
        return self._client

    def generate(self, prompt: str, *, system: str | None = None, max_tokens: int = 1024) -> str:
        """Return Claude's text response to ``prompt``.

        Uses adaptive thinking (recommended for analytical work) and extracts the
        text blocks from the response. Any failure becomes an
        :class:`LLMProviderError` so the system fails closed.
        """
        client = self._ensure_client()
        try:
            response = client.messages.create(  # type: ignore[attr-defined]
                model=self._model,
                max_tokens=max_tokens,
                system=system or "You are a financial research analyst.",
                thinking={"type": "adaptive"},
                messages=[{"role": "user", "content": prompt}],
            )
        except Exception as exc:  # pragma: no cover - network path
            raise LLMProviderError(f"Anthropic request failed: {exc}") from exc

        # Concatenate text blocks, skipping thinking blocks.
        parts = [b.text for b in response.content if getattr(b, "type", None) == "text"]
        text = "".join(parts).strip()
        if not text:
            raise LLMProviderError("Anthropic returned an empty response")
        return text

    def complete(self, prompt: str, context: dict) -> dict:
        """Protocol-compatible completion returning a dict."""
        text = self.generate(prompt)
        return {"text": text}


def build_llm_client(settings: Settings | None = None) -> LLMClient:
    """Select an LLM client from configuration.

    Defaults to the deterministic mock. Returns the Anthropic client only when
    ``LLM_PROVIDER=anthropic`` and a key is available; otherwise mock.
    """
    settings = settings or get_settings()
    provider = settings.llm_provider.lower()
    if provider == "anthropic":
        api_key = settings.llm_api_key
        if not api_key:
            # No key -> fail closed to mock rather than crashing the system.
            return MockLLMClient()
        return AnthropicLLMClient(api_key=api_key, model=settings.llm_model)
    return MockLLMClient()
