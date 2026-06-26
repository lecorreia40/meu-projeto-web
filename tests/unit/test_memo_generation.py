"""Tests for the agent swarm and Investment Memo Engine."""

from __future__ import annotations

from agents.orchestrator import OrchestratorAgent
from data.ingestion.prices import MockPriceFeed
from data.universe import SYMBOLS
from features.pipeline import build_feature_set
from memos.memo_generator import is_memo_complete, missing_memo_fields
from memos.memo_schema import MemoStatus


def _swarm_results(seed: int = 42, days: int = 180):
    feed = MockPriceFeed(seed=seed)
    orch = OrchestratorAgent()
    out = []
    for symbol in SYMBOLS:
        features = build_feature_set(symbol, feed.fetch_bars(symbol, days=days))
        out.append(orch.run(features))
    return out


def test_every_memo_has_a_skeptic_view() -> None:
    # Hard constraint: ALL generated memos must include skeptic_view.
    for result in _swarm_results():
        assert result.memo.skeptic_view.strip() != ""
        assert result.skeptic_view.strip() != ""


def test_swarm_runs_all_eight_roles() -> None:
    result = _swarm_results(days=180)[0]
    # Four directional analysts captured as opinions ...
    assert set(result.opinions.keys()) == {"fundamental", "technical", "news", "macro"}
    # ... plus skeptic (skeptic_view), risk analyst (risk_proposal), and the
    # orchestrator that produced the memo.
    assert result.risk_proposal is not None
    assert result.memo is not None


def test_at_least_one_complete_memo() -> None:
    results = _swarm_results()
    complete = [r for r in results if r.memo.status is MemoStatus.COMPLETE]
    assert complete, "expected at least one COMPLETE memo from the universe"


def test_complete_memos_have_all_required_fields() -> None:
    for result in _swarm_results():
        if result.memo.status is MemoStatus.COMPLETE:
            assert missing_memo_fields(result.memo) == []
            assert is_memo_complete(result.memo)


def test_rejected_memos_are_not_complete() -> None:
    for result in _swarm_results():
        if result.memo.status is MemoStatus.REJECTED:
            assert not is_memo_complete(result.memo)


def test_memo_records_model_and_prompt_versions() -> None:
    result = _swarm_results()[0]
    assert result.memo.model_version  # explainability
    assert result.memo.prompt_version
    assert result.memo.prompt_version != "0.0.0"  # prompt file was loaded


def test_swarm_is_deterministic() -> None:
    a = _swarm_results(seed=7)[0]
    b = _swarm_results(seed=7)[0]
    assert a.memo.confidence_score == b.memo.confidence_score
    assert a.net_score == b.net_score
