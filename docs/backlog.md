# Product Backlog — Mesa Proprietária com IA

**Project:** Mesa Proprietária com IA — Proprietary AI Trading Desk
**Scope:** Operates ONLY the owner's own capital. NOT a fund or advisory service. No financial advice.
**Method:** BMAD Method (Agile / Scrum)
**Document owner:** Product Owner / Scrum Master
**Last updated:** 2026-06-19

---

## 1. Product Vision

Build a proprietary, single-operator AI trading desk that researches ideas, generates explainable investment memos and validated signals, backtests them, enforces **deterministic risk control**, and simulates execution through paper trading. AI agents **propose**; they **must not execute**. Every order passes deterministic validation → backtest → risk limits → order validation → broker layer. The **risk engine has higher authority than any AI agent**.

### Core Principles (non-negotiable)

| # | Principle |
|---|-----------|
| P1 | AI agents propose; the risk engine and deterministic pipeline decide. AI **never** places an order. |
| P2 | Execution order of authority: deterministic validation → backtest → risk limits → order validation → broker layer. |
| P3 | No live trading first. Research → backtest → paper trading precede everything. |
| P4 | MVP is **long-only US stocks & ETFs**. No leverage, options, crypto, or short selling. |
| P5 | Every trading action is logged; every AI decision is explainable. |
| P6 | A signal is rejected if any required field is missing. |
| P7 | Any data / broker / risk / LLM failure → **no trade**. |
| P8 | `LIVE_TRADING_ENABLED=false` by default; paper trading is the default. |

---

## 2. Epic → Architecture Layer → Phase Mapping

The backlog is organized into Epics aligned to the architecture layers and the 13 development phases (Phase 0–12).

| Epic | Title | Architecture Layer | Phase |
|------|-------|--------------------|-------|
| EP-00 | Foundation & DevOps | Repo / Docker / Config / Logging / Docs | 0 |
| EP-01 | Data Modeling & Ingestion | Data models / DB schema / Asset universe / Mock ingestion | 1 |
| EP-02 | Feature Engineering | Features (returns, volatility, ATR, RSI, MAs, liquidity) | 2 |
| EP-03 | Agent Framework | Multi-agent orchestration with mock LLM | 3 |
| EP-04 | Investment Memo Generation | Memo generation & persistence | 4 |
| EP-05 | Signal Engine & Validation | Signal engine & validation | 5 |
| EP-06 | Backtesting Engine | Custom backtest engine | 6 |
| EP-07 | Deterministic Risk Engine | Risk engine (authority layer) | 7 |
| EP-08 | Paper Execution Simulator | Paper execution simulator | 8 |
| EP-09 | Broker Adapter (IBKR Paper-Only) | IBKR adapter, paper-only | 9 |
| EP-10 | Dashboard | Streamlit dashboard | 10 |
| EP-11 | Tests, Observability & Audit | Tests / observability / audit logs | 11 |
| EP-12 | Live-Trading Readiness (Disabled) | Live-trading readiness checklist | 12 |

> **Priority legend (MoSCoW):** M = Must, S = Should, C = Could, W = Won't (this release).
> **Estimate:** Fibonacci story points (1, 2, 3, 5, 8, 13).

---

## EP-00 — Foundation & DevOps (Phase 0)

**Description:** Establish the repository, Docker Compose environment, configuration management, structured logging, secrets handling, and project documentation. This epic creates the safe scaffolding on which everything else stands, including the hard default `LIVE_TRADING_ENABLED=false`.

| Story ID | Title | As a / I want / so that | Priority | Pts | Phase | Dependencies |
|----------|-------|-------------------------|----------|-----|-------|--------------|
| MP-001 | Repository & project skeleton | As an operator, I want a structured Python 3.12 mono-repo with clear module boundaries so that future code has a clean home. | M | 3 | 0 | — |
| MP-002 | Docker Compose environment | As an operator, I want Docker Compose with Postgres, TimescaleDB, Redis so that the full stack runs locally with one command. | M | 5 | 0 | MP-001 |
| MP-003 | Configuration & settings module | As an operator, I want a typed Pydantic settings module loading from `.env` so that config is centralized and validated. | M | 3 | 0 | MP-001 |
| MP-004 | Secrets management & `.env.example` | As an operator, I want `.env.example` only (no secrets in repo) and `LIVE_TRADING_ENABLED=false` default so that the system is safe and no key leaks. | M | 2 | 0 | MP-003 |
| MP-005 | Structured logging (JSONL + Postgres) | As an operator, I want logs with timestamp/event_type/entity_id/severity so that every action is auditable. | M | 3 | 0 | MP-003 |
| MP-006 | Documentation scaffold & ADRs | As an operator, I want README, architecture docs, and ADRs so that decisions and scope are recorded. | S | 2 | 0 | MP-001 |
| MP-007 | Pre-commit, linting & type checks | As a developer, I want ruff/black/mypy pre-commit hooks so that code quality is enforced from day one. | S | 2 | 0 | MP-001 |
| MP-008 | Early risk-rule test harness (TDD) | As a developer, I want a pytest harness and stub risk-rule tests **before** any execution code so that TDD discipline is enforced. | M | 3 | 0 | MP-001 |

---

## EP-01 — Data Modeling & Ingestion (Phase 1)

**Description:** Define Pydantic data models and the PostgreSQL/TimescaleDB schema, seed the long-only US stock & ETF asset universe, and implement deterministic mock market-data ingestion (no live data dependency in MVP).

| Story ID | Title | As a / I want / so that | Priority | Pts | Phase | Dependencies |
|----------|-------|-------------------------|----------|-----|-------|--------------|
| MP-101 | Core domain Pydantic models | As a developer, I want typed models for Asset, Bar, Memo, Signal so that data is validated everywhere. | M | 5 | 1 | MP-003 |
| MP-102 | DB schema & migrations | As a developer, I want migrated Postgres/TimescaleDB tables (hypertables for bars) so that data persists reliably. | M | 5 | 1 | MP-002, MP-101 |
| MP-103 | Asset universe (long-only US stocks/ETFs) | As an operator, I want a seeded universe restricted to US stocks/ETFs so that scope constraints are enforced at data level. | M | 3 | 1 | MP-102 |
| MP-104 | Mock market-data ingestion | As a developer, I want a deterministic mock OHLCV ingester behind a `MarketDataInterface` so that the pipeline runs without external APIs. | M | 5 | 1 | MP-102, MP-103 |
| MP-105 | Data quality validation | As a risk owner, I want ingestion to flag missing/insufficient history and bad data so that downstream stages can block. | M | 3 | 1 | MP-104 |
| MP-106 | Parquet + DuckDB analytics store | As a developer, I want bars also written to Parquet queried via DuckDB so that backtests read fast columnar data. | S | 3 | 1 | MP-104 |

---

## EP-02 — Feature Engineering (Phase 2)

**Description:** Compute deterministic features used by agents and signals: returns, volatility, ATR, RSI, moving averages, and liquidity metrics.

| Story ID | Title | As a / I want / so that | Priority | Pts | Phase | Dependencies |
|----------|-------|-------------------------|----------|-----|-------|--------------|
| MP-201 | Returns & volatility features | As a quant, I want daily/period returns and rolling volatility so that risk and signals have inputs. | M | 3 | 2 | MP-104 |
| MP-202 | ATR & RSI indicators | As a quant, I want ATR and RSI so that entry/stop logic and momentum are quantifiable. | M | 3 | 2 | MP-201 |
| MP-203 | Moving averages | As a quant, I want SMA/EMA across windows so that trend context is available. | M | 2 | 2 | MP-201 |
| MP-204 | Liquidity & spread metrics | As a risk owner, I want average volume and spread proxies so that the risk engine can block illiquid/wide-spread names. | M | 3 | 2 | MP-201 |
| MP-205 | Feature store & caching | As a developer, I want computed features cached (Redis/Parquet) so that recomputation is avoided. | S | 3 | 2 | MP-201, MP-106 |

---

## EP-03 — Agent Framework (Phase 3)

**Description:** Build the LangGraph multi-agent framework with a **mock LLM** (deterministic, offline). Implements the eight MVP agents. Agents propose only.

| Story ID | Title | As a / I want / so that | Priority | Pts | Phase | Dependencies |
|----------|-------|-------------------------|----------|-----|-------|--------------|
| MP-301 | LLM interface & mock LLM | As a developer, I want an `LLMInterface` with a deterministic mock so that agents run offline and reproducibly. | M | 5 | 3 | MP-003 |
| MP-302 | Agent base & registry | As a developer, I want a base Agent class capturing model_version & prompt_version so that every AI output is traceable. | M | 5 | 3 | MP-301 |
| MP-303 | Eight MVP agents | As an operator, I want Market Scanner, Fundamental Analyst, Technical Quant, News & Sentiment, Macro & Sector, Skeptic/Red Team, Risk Analyst, Orchestrator. | M | 8 | 3 | MP-302, MP-201 |
| MP-304 | Orchestrator (LangGraph) | As an operator, I want the Orchestrator to sequence agents and aggregate output so that a coherent proposal is produced. | M | 5 | 3 | MP-303 |
| MP-305 | Agent memory (pgvector/Qdrant) | As an agent, I want a vector memory store so that prior context can inform proposals. | C | 5 | 3 | MP-302, MP-102 |

---

## EP-04 — Investment Memo Generation (Phase 4)

**Description:** Agents produce a structured, explainable investment memo with all required fields, persisted with model/prompt versioning.

**Memo required fields:** memo_id, symbol, asset_type, direction, thesis, catalyst, time_horizon, entry_logic, risk_summary, skeptic_view, confidence_score, data_sources, created_at, model_version, prompt_version, status.

| Story ID | Title | As a / I want / so that | Priority | Pts | Phase | Dependencies |
|----------|-------|-------------------------|----------|-----|-------|--------------|
| MP-401 | Memo schema & validation | As a developer, I want a Pydantic Memo with all required fields so that incomplete memos are rejected. | M | 5 | 4 | MP-101, MP-303 |
| MP-402 | Memo generation pipeline | As an operator, I want the Orchestrator to assemble a full memo (incl. skeptic_view) so that proposals are explainable. | M | 5 | 4 | MP-401, MP-304 |
| MP-403 | Memo persistence & versioning | As an auditor, I want memos stored with model_version/prompt_version so that every AI decision is reproducible. | M | 3 | 4 | MP-401, MP-102 |
| MP-404 | Memo completeness guard | As a risk owner, I want generation to fail if confidence is low or thesis incomplete so that weak ideas never reach signals. | M | 3 | 4 | MP-402 |

---

## EP-05 — Signal Engine & Validation (Phase 5)

**Description:** Convert an approved memo into a structured, validated signal with explicit entry/stop/target and risk envelope.

**Signal required fields:** signal_id, memo_id, symbol, direction, entry_type, entry_price, stop_loss, take_profit, max_position_pct, max_risk_pct, time_horizon, confidence_score, requires_backtest, risk_status, execution_status, created_at.

| Story ID | Title | As a / I want / so that | Priority | Pts | Phase | Dependencies |
|----------|-------|-------------------------|----------|-----|-------|--------------|
| MP-501 | Signal schema | As a developer, I want a Pydantic Signal with all required fields so that malformed signals are impossible. | M | 5 | 5 | MP-401 |
| MP-502 | Memo→Signal conversion | As an operator, I want a deterministic converter producing entry/stop/target from memo + features so that signals are concrete. | M | 5 | 5 | MP-501, MP-202 |
| MP-503 | Signal field validation | As a risk owner, I want a validator rejecting any signal with missing fields so that incomplete signals are blocked (P6). | M | 5 | 5 | MP-501 |
| MP-504 | `requires_backtest` gating | As a risk owner, I want signals flagged for mandatory backtest so that no untested signal proceeds. | M | 3 | 5 | MP-502 |

---

## EP-06 — Backtesting Engine (Phase 6)

**Description:** Custom deterministic backtester evaluating each signal on historical/mock data before risk approval.

| Story ID | Title | As a / I want / so that | Priority | Pts | Phase | Dependencies |
|----------|-------|-------------------------|----------|-----|-------|--------------|
| MP-601 | Backtest engine core | As a quant, I want an event-driven backtester so that signals are evaluated on history. | M | 8 | 6 | MP-106, MP-502 |
| MP-602 | Backtest metrics | As an operator, I want win-rate, expectancy, max drawdown, R-multiple so that signal quality is measurable. | M | 5 | 6 | MP-601 |
| MP-603 | Backtest result persistence & gate | As a risk owner, I want backtest results stored and a pass/fail gate so that backtest failure blocks the trade (P7). | M | 3 | 6 | MP-601, MP-102 |

---

## EP-07 — Deterministic Risk Engine (Phase 7)

**Description:** The authority layer. Deterministic rules that approve or block. **No AI involved in the decision.** Risk-rule tests are written first (see MP-008).

**Risk policy (MVP):** max_risk_per_trade_pct=1.0; max_position_size_pct=2.0; max_daily_loss_pct=2.0; max_weekly_loss_pct=5.0; max_open_positions=3; max_total_exposure_pct=20.0; allow_short=false; allow_options=false; allow_crypto=false; allow_leverage=false; paper_trading_default=true; live_trading_default=false.

| Story ID | Title | As a / I want / so that | Priority | Pts | Phase | Dependencies |
|----------|-------|-------------------------|----------|-----|-------|--------------|
| MP-701 | Risk policy configuration | As a risk owner, I want a versioned, typed risk-policy config so that limits are explicit and auditable. | M | 3 | 7 | MP-003 |
| MP-702 | Position-size & risk-per-trade rules | As a risk owner, I want blocks when size > 2% or risk/trade > 1% so that no oversized trade passes. | M | 5 | 7 | MP-701, MP-503 |
| MP-703 | Loss-limit rules (daily/weekly) | As a risk owner, I want daily 2% / weekly 5% loss breaches to block so that drawdowns are capped. | M | 5 | 7 | MP-701 |
| MP-704 | Exposure & open-positions rules | As a risk owner, I want max 3 open positions and 20% total exposure enforced so that concentration is limited. | M | 3 | 7 | MP-701 |
| MP-705 | Scope/instrument rules | As a risk owner, I want short/options/crypto/leverage and non-US-stock/ETF blocked so that MVP scope holds. | M | 3 | 7 | MP-701 |
| MP-706 | Data/liquidity/backtest gates | As a risk owner, I want blocks on low liquidity, wide spread, insufficient history, data-quality or backtest failure so that bad inputs never trade. | M | 5 | 7 | MP-204, MP-603 |
| MP-707 | LLM-uncertainty & earnings gate | As a risk owner, I want blocks on incomplete thesis / LLM uncertainty and earnings-event trades so that unexplained or event-risk trades are stopped. | M | 3 | 7 | MP-404 |
| MP-708 | Live-trading & broker-failure gates | As a risk owner, I want unapproved live trading and broker-connection failure to block so that no unsafe order is sent. | M | 3 | 7 | MP-701 |
| MP-709 | Risk decision record & explainability | As an auditor, I want each risk decision logged with reason codes so that every block/approval is explainable. | M | 3 | 7 | MP-705, MP-005 |

---

## EP-08 — Paper Execution Simulator (Phase 8)

**Description:** Simulate order placement and fills for **risk-approved** signals only. Tracks paper positions and P&L.

| Story ID | Title | As a / I want / so that | Priority | Pts | Phase | Dependencies |
|----------|-------|-------------------------|----------|-----|-------|--------------|
| MP-801 | Order model & validation | As a developer, I want an Order model validated before submission so that malformed orders never proceed. | M | 3 | 8 | MP-501 |
| MP-802 | Paper fill simulator | As an operator, I want simulated fills with slippage/spread so that paper P&L is realistic. | M | 5 | 8 | MP-801 |
| MP-803 | Paper portfolio & P&L tracking | As an operator, I want paper positions, exposure, and P&L tracked so that the risk engine's loss rules have live state. | M | 5 | 8 | MP-802, MP-703 |
| MP-804 | Risk-approval enforcement | As a risk owner, I want the simulator to reject any unapproved order so that risk authority is enforced (P1/P2). | M | 3 | 8 | MP-709, MP-801 |

---

## EP-09 — Broker Adapter (IBKR Paper-Only) (Phase 9)

**Description:** Implement `BrokerInterface` with an IBKR paper-trading adapter. Live disabled. Broker-connection failure → no trade.

| Story ID | Title | As a / I want / so that | Priority | Pts | Phase | Dependencies |
|----------|-------|-------------------------|----------|-----|-------|--------------|
| MP-901 | BrokerInterface abstraction | As a developer, I want all broker actions behind `BrokerInterface` so that the engine is broker-agnostic and testable. | M | 3 | 9 | MP-801 |
| MP-902 | IBKR paper adapter | As an operator, I want an IBKR paper-trading adapter so that simulated orders route through a real broker API in paper mode. | M | 8 | 9 | MP-901 |
| MP-903 | Broker connection health & failure gate | As a risk owner, I want broker-connection failure to block all orders so that no trade fires blind (P7). | M | 3 | 9 | MP-902, MP-708 |
| MP-904 | Live-trading hard guard | As a risk owner, I want the adapter to refuse live orders unless `LIVE_TRADING_ENABLED=true` AND explicitly reconfigured so that live is impossible by default. | M | 3 | 9 | MP-902, MP-004 |

---

## EP-10 — Dashboard (Phase 10)

**Description:** Streamlit dashboard surfacing signals, risk status, and paper positions. Read-oriented; no live-trade controls in MVP.

| Story ID | Title | As a / I want / so that | Priority | Pts | Phase | Dependencies |
|----------|-------|-------------------------|----------|-----|-------|--------------|
| MP-1001 | Signals & memo viewer | As an operator, I want to view memos and signals with status so that I can review proposals. | M | 5 | 10 | MP-502 |
| MP-1002 | Risk status panel | As an operator, I want to see risk decisions and reason codes so that I understand blocks/approvals. | M | 5 | 10 | MP-709 |
| MP-1003 | Paper positions & P&L view | As an operator, I want paper positions, exposure, and P&L displayed so that I can monitor the desk. | M | 3 | 10 | MP-803 |
| MP-1004 | Live-trading status indicator | As an operator, I want a clear `LIVE TRADING: DISABLED` banner so that safety state is always visible. | S | 2 | 10 | MP-904 |

---

## EP-11 — Tests, Observability & Audit (Phase 11)

**Description:** Comprehensive test suite (including negative tests), observability hooks (OpenTelemetry-ready), and audit logging.

| Story ID | Title | As a / I want / so that | Priority | Pts | Phase | Dependencies |
|----------|-------|-------------------------|----------|-----|-------|--------------|
| MP-1101 | Risk-rule unit test suite | As a risk owner, I want exhaustive tests proving every MUST-BLOCK condition blocks so that risk authority is verified. | M | 8 | 11 | MP-709 |
| MP-1102 | Negative-test matrix (invalid/oversized/incomplete/risky) | As a risk owner, I want end-to-end tests proving bad trades are blocked so that MVP acceptance passes. | M | 5 | 11 | MP-804 |
| MP-1103 | Integration tests (pipeline) | As a developer, I want memo→signal→backtest→risk→paper integration tests so that the whole flow is verified. | M | 5 | 11 | MP-804 |
| MP-1104 | Audit log completeness | As an auditor, I want every trading action and AI output logged with required fields so that the audit trail is complete. | M | 3 | 11 | MP-005, MP-403 |
| MP-1105 | OpenTelemetry-ready observability | As an operator, I want tracing/metrics hooks so that the system is observable in future. | S | 3 | 11 | MP-005 |

---

## EP-12 — Live-Trading Readiness (Disabled) (Phase 12)

**Description:** Document and codify the live-trading readiness checklist. **Live trading remains disabled.** No live order code path is enabled. Pure governance/documentation epic.

| Story ID | Title | As a / I want / so that | Priority | Pts | Phase | Dependencies |
|----------|-------|-------------------------|----------|-----|-------|--------------|
| MP-1201 | Live-readiness checklist | As an operator, I want a documented checklist of preconditions for live trading so that no live step happens accidentally. | S | 3 | 12 | MP-1102 |
| MP-1202 | Kill-switch & guard verification | As a risk owner, I want a documented and tested kill-switch design so that live can be halted instantly (when ever enabled). | S | 3 | 12 | MP-904 |
| MP-1203 | Live-disabled assertion test | As a risk owner, I want a test asserting `LIVE_TRADING_ENABLED=false` by default so that the default is permanently guarded. | M | 2 | 12 | MP-904 |

---

## 3. Backlog Summary by Epic

| Epic | Stories | Total Points | Must | Should | Could |
|------|---------|--------------|------|--------|-------|
| EP-00 | 8 | 23 | 6 | 2 | 0 |
| EP-01 | 6 | 24 | 5 | 1 | 0 |
| EP-02 | 5 | 14 | 4 | 1 | 0 |
| EP-03 | 5 | 28 | 4 | 0 | 1 |
| EP-04 | 4 | 16 | 4 | 0 | 0 |
| EP-05 | 4 | 18 | 4 | 0 | 0 |
| EP-06 | 3 | 16 | 3 | 0 | 0 |
| EP-07 | 9 | 33 | 9 | 0 | 0 |
| EP-08 | 4 | 16 | 4 | 0 | 0 |
| EP-09 | 4 | 17 | 4 | 0 | 0 |
| EP-10 | 4 | 15 | 3 | 1 | 0 |
| EP-11 | 5 | 24 | 4 | 1 | 0 |
| EP-12 | 3 | 8 | 1 | 2 | 0 |
| **Total** | **64** | **252** | — | — | — |

---

## 4. Definition of Ready (DoR)

A story is **Ready** to enter a sprint when:

1. The story follows the "As a / I want / so that" format and has a unique Story ID.
2. Acceptance criteria are written as testable Given/When/Then scenarios.
3. Story points are estimated by the team.
4. Dependencies are identified and either done or scheduled earlier.
5. The story respects the core principles (P1–P8); any execution-related story confirms risk-approval enforcement.
6. No secrets or hardcoded keys are required; `.env.example` covers any new config.
7. The story is small enough to complete within one sprint.
8. For execution-touching stories, the corresponding **risk-rule tests are identified to be written first (TDD)**.

## 5. Definition of Done (DoD)

A story is **Done** when:

1. Code is written with type hints and Pydantic schemas; module boundaries are clean.
2. Unit tests pass; for risk/execution code, **risk-rule tests were written before execution code** and pass.
3. Negative tests (where applicable) prove invalid/oversized/incomplete/risky inputs are blocked.
4. All external APIs sit behind interfaces; broker actions behind `BrokerInterface`; all orders require risk approval.
5. Logs include timestamp/event_type/entity_id/severity; AI outputs persist model_version & prompt_version.
6. No secrets in the repo; `.env.example` updated; `LIVE_TRADING_ENABLED=false` default preserved.
7. Code reviewed and merged via PR; CI green.
8. Documentation/ADRs updated where relevant.
9. The feature defaults to paper/dry-run; no live order path is enabled.
