"""LLM provider abstraction tests (no network)."""

from __future__ import annotations

import pytest

from agents.base_agent import MockLLMClient
from agents.llm import AnthropicLLMClient, build_llm_client
from app.config import Settings
from core.exceptions import LLMProviderError


def test_factory_defaults_to_mock() -> None:
    client = build_llm_client(Settings(llm_provider="mock"))
    assert isinstance(client, MockLLMClient)


def test_factory_anthropic_without_key_falls_back_to_mock() -> None:
    # Fail closed: no key -> mock, never a half-configured live provider.
    client = build_llm_client(Settings(llm_provider="anthropic", llm_api_key=""))
    assert isinstance(client, MockLLMClient)


def test_factory_anthropic_with_key_builds_real_client() -> None:
    client = build_llm_client(
        Settings(llm_provider="anthropic", llm_api_key="sk-test", llm_model="claude-opus-4-8")
    )
    assert isinstance(client, AnthropicLLMClient)
    assert client.model_version == "claude-opus-4-8"


def test_anthropic_client_requires_key() -> None:
    with pytest.raises(LLMProviderError):
        AnthropicLLMClient(api_key="")


def test_mock_client_is_deterministic() -> None:
    a = MockLLMClient().complete("prompt", {"k": "v"})
    b = MockLLMClient().complete("prompt", {"k": "v"})
    assert a == b
