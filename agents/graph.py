"""Explicit research orchestration graph.

A minimal, dependency-free state-graph engine that mirrors LangGraph's
``StateGraph`` API (nodes, edges, conditional edges, entry/finish). It formalizes
the swarm workflow as an inspectable graph and is the migration target for
LangGraph in production — the node functions stay the same, only the runner
changes.

The research graph wires the orchestrator's composable steps as nodes:

    analysts -> skeptic -> risk_analyst -> aggregate --(router)--> complete | rejected

Because the nodes delegate to the same :class:`OrchestratorAgent` helpers that
``OrchestratorAgent.run`` uses, the graph produces identical memos — it is a
formalization, not a re-implementation.
"""

from __future__ import annotations

from typing import Any, Callable

from agents.orchestrator import OrchestratorAgent, SwarmResult
from core.enums import Direction
from data.universe import UNIVERSE
from features.pipeline import FeatureSet
from memos.memo_schema import MemoStatus

State = dict[str, Any]
NodeFn = Callable[[State], State]
RouterFn = Callable[[State], str]

END = "__end__"


class StateGraph:
    """A tiny deterministic state graph (LangGraph-compatible shape)."""

    def __init__(self) -> None:
        self._nodes: dict[str, NodeFn] = {}
        self._edges: dict[str, str] = {}
        self._conditional: dict[str, tuple[RouterFn, dict[str, str]]] = {}
        self._entry: str | None = None

    def add_node(self, name: str, fn: NodeFn) -> "StateGraph":
        if name in self._nodes:
            raise ValueError(f"duplicate node {name!r}")
        self._nodes[name] = fn
        return self

    def add_edge(self, src: str, dst: str) -> "StateGraph":
        self._edges[src] = dst
        return self

    def add_conditional_edges(
        self, src: str, router: RouterFn, mapping: dict[str, str]
    ) -> "StateGraph":
        self._conditional[src] = (router, mapping)
        return self

    def set_entry(self, name: str) -> "StateGraph":
        self._entry = name
        return self

    @property
    def nodes(self) -> list[str]:
        return list(self._nodes)

    def run(self, state: State, *, max_steps: int = 100) -> State:
        if self._entry is None:
            raise ValueError("graph has no entry node")
        current = self._entry
        steps = 0
        while current != END:
            if steps > max_steps:
                raise RuntimeError("graph exceeded max_steps (possible cycle)")
            steps += 1
            state = self._nodes[current](state)
            if current in self._conditional:
                router, mapping = self._conditional[current]
                current = mapping[router(state)]
            elif current in self._edges:
                current = self._edges[current]
            else:
                current = END
        return state


def build_research_graph(orchestrator: OrchestratorAgent | None = None) -> tuple[StateGraph, OrchestratorAgent]:
    """Build the research graph and return it with its orchestrator."""
    orch = orchestrator or OrchestratorAgent()

    def analysts_node(state: State) -> State:
        features: FeatureSet = state["features"]
        state["opinions"] = orch.run_analysts(features)
        return state

    def skeptic_node(state: State) -> State:
        view, strength = orch.skeptic.skeptic_view(state["features"])
        state["skeptic_view"] = view
        state["skeptic_strength"] = strength
        return state

    def risk_node(state: State) -> State:
        state["risk_proposal"] = orch.risk_analyst.propose(
            state["features"], direction=Direction.LONG
        )
        return state

    def aggregate_node(state: State) -> State:
        net, conf = orch.aggregate(state["opinions"], state["skeptic_strength"])
        state["net_score"] = net
        state["aggregate_confidence"] = conf
        state["status"] = orch.decide_status(net, conf, state["features"])
        return state

    def complete_node(state: State) -> State:
        return _finalize(state, orch)

    def rejected_node(state: State) -> State:
        return _finalize(state, orch)

    graph = StateGraph()
    graph.add_node("analysts", analysts_node)
    graph.add_node("skeptic", skeptic_node)
    graph.add_node("risk_analyst", risk_node)
    graph.add_node("aggregate", aggregate_node)
    graph.add_node("complete", complete_node)
    graph.add_node("rejected", rejected_node)
    graph.set_entry("analysts")
    graph.add_edge("analysts", "skeptic")
    graph.add_edge("skeptic", "risk_analyst")
    graph.add_edge("risk_analyst", "aggregate")
    graph.add_conditional_edges(
        "aggregate",
        lambda s: "complete" if s["status"] is MemoStatus.COMPLETE else "rejected",
        {"complete": "complete", "rejected": "rejected"},
    )
    return graph, orch


def _finalize(state: State, orch: OrchestratorAgent) -> State:
    features: FeatureSet = state["features"]
    memo = orch.generator.build(
        symbol=features.symbol,
        asset_type=UNIVERSE[features.symbol].asset_type,
        direction=Direction.LONG,
        opinions=state["opinions"],
        skeptic_view=state["skeptic_view"],
        risk_proposal=state["risk_proposal"],
        confidence=state["aggregate_confidence"],
        model_version=orch.model_version,
        prompt_version=orch.prompt_version,
        status=state["status"],
    )
    state["memo"] = memo
    return state


def run_research_graph(features: FeatureSet, orchestrator: OrchestratorAgent | None = None) -> SwarmResult:
    """Run the graph and return a :class:`SwarmResult` (same shape as the orchestrator)."""
    graph, orch = build_research_graph(orchestrator)
    final = graph.run({"features": features})
    return SwarmResult(
        symbol=features.symbol,
        opinions=final["opinions"],
        skeptic_view=final["skeptic_view"],
        skeptic_strength=final["skeptic_strength"],
        risk_proposal=final["risk_proposal"],
        net_score=final["net_score"],
        aggregate_confidence=final["aggregate_confidence"],
        memo=final["memo"],
    )
