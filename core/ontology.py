"""Ontology layer: a formal model of the domain entities and their relations.

This is the "knowledge layer" — it documents every concept the desk works with
(assets, bars, features, memos, signals, orders, positions, risk, accounts),
their fields and validations, and how they relate. It is data-driven so the
admin panel can render it and so it stays a single source of truth.
"""

from __future__ import annotations

from typing import TypedDict


class Field(TypedDict):
    name: str
    type: str
    validation: str


class Entity(TypedDict):
    name: str
    layer: str
    description: str
    fields: list[Field]


class Relation(TypedDict):
    src: str
    dst: str
    kind: str
    description: str


def _f(name: str, type_: str, validation: str = "") -> Field:
    return {"name": name, "type": type_, "validation": validation}


ENTITIES: list[Entity] = [
    {
        "name": "Asset", "layer": "01 Data",
        "description": "A tradable instrument in the MVP universe (US stock or ETF, long-only).",
        "fields": [
            _f("symbol", "str", "uppercase A–Z, in the 21-symbol universe"),
            _f("name", "str", "non-empty"),
            _f("asset_type", "enum", "stock | etf"),
            _f("tradable", "bool", "must be true to trade"),
        ],
    },
    {
        "name": "MarketBar", "layer": "01 Data",
        "description": "One OHLCV bar for a symbol at a timestamp.",
        "fields": [
            _f("symbol", "str", ""),
            _f("timestamp", "datetime", "UTC"),
            _f("open/high/low/close", "float", "> 0; low ≤ open,close ≤ high"),
            _f("volume", "int", "≥ 0"),
        ],
    },
    {
        "name": "FeatureSet", "layer": "05 Features",
        "description": "Computed features for one symbol at the latest bar.",
        "fields": [
            _f("last_price", "float", "> 0"),
            _f("sma20 / sma50", "float?", "None if insufficient history"),
            _f("rsi14", "float?", "0–100 (Wilder); None if < 15 bars"),
            _f("atr14", "float?", "> 0; None if insufficient history"),
            _f("annualized_vol", "float?", "stdev of returns × √252"),
            _f("momentum20", "float?", "20-period return"),
            _f("liquidity", "float?", "0–1 (avg $ volume normalized)"),
            _f("is_complete", "bool", "true only if all features present"),
        ],
    },
    {
        "name": "AgentOpinion", "layer": "07 Agents",
        "description": "One agent's explainable opinion on a symbol.",
        "fields": [
            _f("agent", "str", ""),
            _f("stance", "enum", "bullish | bearish | neutral"),
            _f("confidence", "float", "0–1"),
            _f("rationale", "str", "explainability (required)"),
            _f("model_version / prompt_version", "str", "audit fields (required)"),
        ],
    },
    {
        "name": "InvestmentMemo", "layer": "08 Memo",
        "description": "Structured thesis written by the orchestrator. Advisory only.",
        "fields": [
            _f("symbol / asset_type / direction", "enum/str", "direction long (MVP)"),
            _f("thesis / catalyst / entry_logic / risk_summary", "str", "non-empty"),
            _f("skeptic_view", "str", "MANDATORY — bear case for every memo"),
            _f("confidence_score", "float", "0–1"),
            _f("data_sources", "list[str]", "non-empty"),
            _f("model_version / prompt_version", "str", "required"),
            _f("status", "enum", "draft | complete | rejected"),
        ],
    },
    {
        "name": "TradingSignal", "layer": "09 Signal",
        "description": "Machine-checkable conversion of a COMPLETE memo into levels.",
        "fields": [
            _f("entry_price", "float", "> 0"),
            _f("stop_loss", "float", "> 0; below entry for long"),
            _f("take_profit", "float", "> 0; above entry for long"),
            _f("max_position_pct / max_risk_pct", "float", "0–100"),
            _f("requires_backtest", "bool", "if true, backtest must pass"),
            _f("risk_status", "enum", "pending | approved | blocked"),
        ],
    },
    {
        "name": "BacktestResult", "layer": "10 Backtest",
        "description": "Strategy-replay verdict for a signal.",
        "fields": [
            _f("passed", "bool", "gate: bars≥60, trades≥2, R:R≥1.5, expectancy≥0"),
            _f("reward_risk", "float", ""),
            _f("metrics", "object", "win_rate, profit_factor, expectancy_r, ..."),
        ],
    },
    {
        "name": "RiskPolicy", "layer": "11 Risk",
        "description": "Deterministic limits governing every trade.",
        "fields": [
            _f("max_risk_per_trade_pct", "float", "default 1.0"),
            _f("max_position_size_pct", "float", "default 2.0"),
            _f("max_daily_loss_pct / max_weekly_loss_pct", "float", "2.0 / 5.0"),
            _f("max_open_positions", "int", "default 3"),
            _f("allow_short/options/crypto/leverage", "bool", "all false (MVP, not editable)"),
            _f("live_trading_default", "bool", "false (gated)"),
        ],
    },
    {
        "name": "RiskDecision", "layer": "11 Risk",
        "description": "Deterministic approve/block verdict for a signal.",
        "fields": [
            _f("approved", "bool", "true only if zero block reasons"),
            _f("reasons", "list[BlockReason]", "every failed rule, for audit"),
            _f("sizing", "PositionSizing", "shares/notional, risk-based + capped"),
        ],
    },
    {
        "name": "Order / Fill / Position", "layer": "12 Execution",
        "description": "Paper execution objects. risk_approved set ONLY by the risk engine.",
        "fields": [
            _f("Order.risk_approved", "bool", "execution refuses if false"),
            _f("Order.mode", "enum", "paper (MVP) | live (gated)"),
            _f("Fill.fill_price / commission", "float", "paper fill with slippage"),
            _f("Position.quantity / avg_price", "int/float", "long-only"),
        ],
    },
    {
        "name": "Account", "layer": "00 Config",
        "description": "A trading account: the test (paper) account, or the gated real (live) account.",
        "fields": [
            _f("mode", "enum", "paper | live"),
            _f("status", "enum", "active | disabled"),
            _f("starting_balance", "float", ""),
            _f("broker", "str", "paper-sim | ibkr (gated)"),
        ],
    },
]

RELATIONS: list[Relation] = [
    {"src": "Asset", "dst": "MarketBar", "kind": "has many", "description": "OHLCV history"},
    {"src": "MarketBar", "dst": "FeatureSet", "kind": "computes", "description": "features per symbol"},
    {"src": "FeatureSet", "dst": "AgentOpinion", "kind": "feeds", "description": "agents read features"},
    {"src": "AgentOpinion", "dst": "InvestmentMemo", "kind": "aggregated into", "description": "orchestrator writes memo"},
    {"src": "InvestmentMemo", "dst": "TradingSignal", "kind": "converts to", "description": "only if COMPLETE"},
    {"src": "TradingSignal", "dst": "BacktestResult", "kind": "validated by", "description": "replay gate"},
    {"src": "TradingSignal", "dst": "RiskDecision", "kind": "judged by", "description": "deterministic risk engine"},
    {"src": "RiskPolicy", "dst": "RiskDecision", "kind": "governs", "description": "limits applied"},
    {"src": "RiskDecision", "dst": "Order / Fill / Position", "kind": "authorizes", "description": "only if approved"},
    {"src": "Account", "dst": "Order / Fill / Position", "kind": "books into", "description": "paper account (live gated)"},
]


def get_ontology() -> dict[str, object]:
    return {
        "entities": ENTITIES,
        "relations": RELATIONS,
        "entity_count": len(ENTITIES),
        "relation_count": len(RELATIONS),
    }
