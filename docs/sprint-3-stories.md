# Sprint 3 Stories — Durability, Portfolio/PnL, Hardened Indicators, Agent Graph

**Sprint goal:** Make the pipeline durable and portfolio-aware, harden the
technical indicators, and formalize the agent workflow as an explicit graph —
all while remaining paper/dry-run only with live trading disabled.

**BMAD roles exercised:** Developer (implementation), QA (tests), SRE
(persistence/observability), Architect (graph + repository interfaces).

| Story | Title | Description | Acceptance | Points |
|-------|-------|-------------|------------|--------|
| MP-301 | Wilder RSI/ATR | Replace placeholder RSI/ATR with Wilder-smoothed implementations | Given a known Wilder series, RSI ≈ 70.46; ATR > 0; `None` on insufficient history | 3 |
| MP-302 | Durable repositories | SQLite-backed repos implementing the existing `Repository` interface; backend factory | Memo/signal round-trip persists across instances; factory selects memory/sqlite; Postgres raises NotImplemented | 5 |
| MP-303 | Portfolio & PnL | `PaperPortfolio` (cash, positions, realized/unrealized PnL, exposure), `pnl`/`allocation`/`reconciliation` | Buys reduce cash and open/average positions; snapshot reports equity/exposure; reconciliation detects mismatches | 5 |
| MP-304 | Portfolio-aware risk | Pipeline books paper fills and feeds `open_positions`/`exposure` into the risk engine | After 3 fills, further candidates are blocked with `max_open_positions` | 3 |
| MP-305 | Explicit research graph | LangGraph-style `StateGraph` engine + research graph wired from orchestrator steps | Graph output memo equals `OrchestratorAgent.run` for the same features | 5 |
| MP-306 | IBKR paper scaffold | `IBKRPaperBroker` behind `BrokerInterface`, disconnected and fail-closed | Not connected by default; `connect()` raises NotImplemented; `submit_order` raises BrokerError | 2 |
| MP-307 | API & dashboard wiring | Real `/portfolio`; Risk and Orders/Portfolio dashboard pages | `/portfolio` returns paper snapshot; dashboard renders memos/signals/risk/portfolio | 3 |
| MP-308 | Tests | Coverage for all of the above | Full suite green (126 tests) | 3 |

**Definition of Done:** all stories' acceptance criteria met; full test suite
green; full mock cycle runs end-to-end and books a paper portfolio; no live
trading path exists; no secrets committed.

**Out of scope (future):** real PostgreSQL/TimescaleDB connection, real LLM
provider, real IBKR connection, live trading (Phase 12, stays disabled).
