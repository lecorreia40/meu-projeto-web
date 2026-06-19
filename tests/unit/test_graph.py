"""Explicit research graph tests."""

from __future__ import annotations

from agents.graph import END, StateGraph, build_research_graph, run_research_graph
from agents.orchestrator import OrchestratorAgent
from data.ingestion.prices import MockPriceFeed
from data.universe import SYMBOLS
from features.pipeline import build_feature_set


def _features(symbol: str, seed: int = 42, days: int = 180):
    return build_feature_set(symbol, MockPriceFeed(seed=seed).fetch_bars(symbol, days=days))


def test_graph_has_expected_nodes() -> None:
    graph, _ = build_research_graph()
    for node in ("analysts", "skeptic", "risk_analyst", "aggregate", "complete", "rejected"):
        assert node in graph.nodes


def test_graph_matches_orchestrator_output() -> None:
    # The graph is a formalization of the orchestrator; results must match.
    orch = OrchestratorAgent()
    for symbol in SYMBOLS[:6]:
        features = _features(symbol)
        direct = orch.run(features)
        via_graph = run_research_graph(features)
        assert via_graph.memo.status == direct.memo.status
        assert via_graph.memo.confidence_score == direct.memo.confidence_score
        assert via_graph.net_score == direct.net_score
        assert via_graph.memo.skeptic_view == direct.memo.skeptic_view


def test_graph_runs_to_completion() -> None:
    result = run_research_graph(_features("JPM"))
    assert result.memo is not None
    assert result.memo.skeptic_view.strip() != ""


def test_tiny_state_graph_engine() -> None:
    g = StateGraph()
    g.add_node("a", lambda s: {**s, "x": s["x"] + 1})
    g.add_node("b", lambda s: {**s, "x": s["x"] * 2})
    g.set_entry("a")
    g.add_edge("a", "b")
    g.add_edge("b", END)
    assert g.run({"x": 1}) == {"x": 4}
