# Product Requirements Document (PRD) — Mesa Proprietária com IA

> **BMAD Method Artifact — Product Manager**
> Status: Draft v1.0 · Date: 2026-06-19 · Owner: Owner-Operator (sole stakeholder)

---

## 1. Product Overview

**Mesa Proprietária com IA** is a proprietary AI-powered trading desk that operates **exclusively the owner's own capital**. A multi-agent AI research swarm generates and criticizes market theses; a quantitative signal engine converts theses into structured signals; a backtesting engine validates hypotheses; a deterministic risk engine approves or blocks decisions; and an OMS/execution engine sends **paper** (or, in the distant future, live) orders through a broker API — all with full logging, audit trail, monitoring, and human supervision.

**Core principle:** AI agents may research, analyze, debate, generate memos, and propose signals. **AI agents must never directly execute trades.** All execution passes through deterministic validation, backtesting/simulation, risk limits, order validation, and a broker execution layer.

This is **infrastructure and automation only** — not an investment fund, not advisory, not third-party money management. It provides **no financial advice and no performance guarantees**.

---

## 2. Goals & Non-Goals

### 2.1 Goals

- Provide rigorous, multi-perspective, AI-driven market research.
- Convert research into validated, structured, auditable signals.
- Validate every hypothesis with backtesting/simulation.
- Enforce deterministic, supreme risk control.
- Execute safely via paper trading first, broker-API-mediated.
- Guarantee full logging, explainability, and fail-safe behavior.

### 2.2 Non-Goals

- No live trading at MVP launch (disabled by default).
- No leverage, options, crypto, or short selling in MVP.
- No third-party capital or advisory services.
- No financial advice or guaranteed performance claims.
- No multi-user accounts or role management in MVP.

---

## 3. User Personas & User Journeys

### 3.1 Persona — Owner-Operator (sole user)

Trades only personal capital; is the sole supervisor and the only human who could ever enable live trading. Seeks discipline, evidence, safety, control, and auditability.

### 3.2 Primary User Journey — Research to Paper Order

1. Owner launches the desk (Docker Compose) and opens the Streamlit control room.
2. Market data is ingested (mock or real), normalized, and quality-checked.
3. Features/indicators are computed for the asset universe.
4. The Market Scanner agent surfaces candidates; the analyst agents research them.
5. The Skeptic/Red Team argues against each thesis; the Orchestrator writes a final investment memo.
6. The signal engine converts the memo into a validated structured signal (rejected if fields missing).
7. The backtesting engine validates the signal hypothesis.
8. The deterministic risk engine approves or blocks the signal against hard limits.
9. If approved, the OMS submits a **paper** order; the broker adapter (IBKR paper) simulates fill.
10. The dashboard shows signals, risk status, and paper positions; every action is logged and explainable.

### 3.3 Secondary Journey — Failure Handling

At any step, if data quality, broker API, risk engine, or LLM provider fails, the system halts trading (no trade) and surfaces the condition on the dashboard and in logs.

---

## 4. Functional Requirements (by Architecture Layer)

> FR IDs are namespaced by layer (01–14). Each requirement is testable.

### Layer 01 — Data Sources
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-01.1 | Define configurable market data source connectors (mock first, real later). | Must |
| FR-01.2 | Restrict configured instruments to the MVP asset universe. | Must |

### Layer 02 — Data Ingestion
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-02.1 | Ingest OHLCV data for all universe instruments (mock ingestion in MVP). | Must |
| FR-02.2 | Schedule ingestion jobs via Celery/Temporal. | Should |
| FR-02.3 | Record ingestion provenance and timestamps. | Must |

### Layer 03 — Raw Data Lake
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-03.1 | Persist raw data as Parquet files queryable via DuckDB. | Must |
| FR-03.2 | Preserve immutable raw snapshots for audit/replay. | Should |

### Layer 04 — Data Normalization & Quality Checks
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-04.1 | Normalize raw data into a canonical OHLCV schema. | Must |
| FR-04.2 | Run quality checks (gaps, duplicates, outliers, staleness). | Must |
| FR-04.3 | If data quality fails, mark data unusable and block trading. | Must |

### Layer 05 — Market Database & Feature Store
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-05.1 | Store normalized OHLCV in PostgreSQL (Timescale/optimized schema). | Must |
| FR-05.2 | Compute and store features: returns, volatility, ATR, RSI, moving averages, liquidity. | Must |
| FR-05.3 | Expose features to downstream agents and engines. | Must |

### Layer 06 — Knowledge Layer / RAG
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-06.1 | Maintain a vector store (pgvector or Qdrant) for knowledge retrieval. | Should |
| FR-06.2 | Provide retrieval context to agents for grounded analysis. | Should |

### Layer 07 — Multi-Agent Research Swarm
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-07.1 | Orchestrate 8 agents via LangGraph (mock LLM acceptable in MVP). | Must |
| FR-07.2 | Require the Skeptic/Red Team to argue against every thesis. | Must |
| FR-07.3 | Agents may propose signals but must never execute trades. | Must |
| FR-07.4 | Every agent output must carry an explainable rationale. | Must |

### Layer 08 — Investment Memo Engine
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-08.1 | Generate a structured investment memo from the agent debate. | Must |
| FR-08.2 | Persist memos with full provenance and rationale. | Must |
| FR-08.3 | Conform memos to the Memo Data Contract (see §8). | Must |

### Layer 09 — Signal Engine
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-09.1 | Convert a memo into a structured, machine-readable signal. | Must |
| FR-09.2 | Validate signals against the Signal Data Contract (see §8). | Must |
| FR-09.3 | Reject any signal with missing required fields. | Must |

### Layer 10 — Backtesting & Simulation Engine
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-10.1 | Backtest a signal/strategy over historical data (custom lightweight engine). | Must |
| FR-10.2 | Produce performance/risk statistics for the hypothesis. | Must |
| FR-10.3 | Allow optional Backtrader integration later. | Could |

### Layer 11 — Portfolio & Risk Engine
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-11.1 | Evaluate signals deterministically against the risk policy (see §7). | Must |
| FR-11.2 | Approve or block each signal; risk-engine authority outranks all agents. | Must |
| FR-11.3 | Track portfolio state: open positions, exposure, daily/weekly P&L. | Must |
| FR-11.4 | If the risk engine fails, block all trading. | Must |

### Layer 12 — OMS / Execution Engine
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-12.1 | Validate orders before submission (size, fields, instrument legality). | Must |
| FR-12.2 | Default to paper trading; live trading disabled by default. | Must |
| FR-12.3 | Provide a paper execution simulator. | Must |
| FR-12.4 | Integrate an IBKR paper-only adapter. | Must |
| FR-12.5 | If the broker API fails, place no trade. | Must |

### Layer 13 — Monitoring / Logs / Audit Trail
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-13.1 | Log every trading action to JSONL and PostgreSQL. | Must |
| FR-13.2 | Maintain a complete, queryable audit trail. | Must |
| FR-13.3 | Be OpenTelemetry-ready for traces/metrics. | Should |

### Layer 14 — Dashboard / Control Room
| FR-ID | Requirement | Priority |
|-------|-------------|----------|
| FR-14.1 | Provide a Streamlit dashboard showing signals, risk status, and paper positions. | Must |
| FR-14.2 | Surface failure conditions and the live-trading lock state. | Must |
| FR-14.3 | Provide read access to memos, signals, and audit logs. | Should |

---

## 5. Non-Functional Requirements

| NFR-ID | Category | Requirement |
|--------|----------|-------------|
| NFR-01 | Performance | Feature computation and signal generation complete within interactive timeframes for the MVP universe. |
| NFR-02 | Reliability | Fail-safe by default: any critical-dependency failure halts trading. |
| NFR-03 | Security | Secrets/credentials stored securely; no broker live credentials enabled by default. |
| NFR-04 | Auditability | Every trading action is logged and reconstructable from the audit trail. |
| NFR-05 | Explainability | Every AI decision includes a human-readable rationale. |
| NFR-06 | Determinism | Risk evaluation and order validation are deterministic and reproducible. |
| NFR-07 | Observability | OpenTelemetry-ready instrumentation across pipeline stages. |
| NFR-08 | Portability | Runs locally via Docker Compose for a single operator. |
| NFR-09 | Maintainability | Pydantic-validated data contracts; typed models; modular layers. |
| NFR-10 | Compliance posture | No financial advice, no guarantees; owner's own capital only. |

---

## 6. Safety Constraints as Hard Requirements

| SR-ID | Hard Requirement (must always hold) |
|-------|-------------------------------------|
| SR-01 | Live trading is not implemented first. |
| SR-02 | Start with research, backtesting, paper trading. |
| SR-03 | No leverage in MVP. |
| SR-04 | No options in MVP. |
| SR-05 | No crypto in MVP. |
| SR-06 | No short selling in MVP. |
| SR-07 | MVP is long-only US stocks and ETFs. |
| SR-08 | Every trading action must be logged. |
| SR-09 | Every AI decision must be explainable. |
| SR-10 | Every signal rejected if required fields missing. |
| SR-11 | Risk engine authority is higher than all AI agents. |
| SR-12 | If data quality fails, no trade. |
| SR-13 | If broker API fails, no trade. |
| SR-14 | If risk engine fails, no trade. |
| SR-15 | If LLM provider fails, no trade. |
| SR-16 | Live trading disabled by default. |
| SR-17 | Paper trading is the default execution mode. |
| SR-18 | Infrastructure only — no financial advice or guaranteed performance claims. |

---

## 7. Risk Policy Parameters (MVP)

| Parameter | Value |
|-----------|-------|
| max_risk_per_trade_pct | 1.0 |
| max_position_size_pct | 2.0 |
| max_daily_loss_pct | 2.0 |
| max_weekly_loss_pct | 5.0 |
| max_open_positions | 3 |
| max_total_exposure_pct | 20.0 |
| allow_short | false |
| allow_options | false |
| allow_crypto | false |
| allow_leverage | false |
| paper_trading_default | true |
| live_trading_default | false |

The risk engine evaluates every signal against these parameters deterministically. Any breach results in rejection. **Risk-engine rejection cannot be overridden by any AI agent.**

---

## 8. Agents, Memo & Signal Data Contracts

### 8.1 The 8 MVP Agents

| # | Agent | Responsibility |
|---|-------|----------------|
| 1 | Market Scanner | Finds candidate instruments from the universe. |
| 2 | Fundamental Analyst | Evaluates business quality, valuation, growth, debt, margins, comparables. |
| 3 | Technical Quant | Evaluates price behavior, trend, volatility, volume, support/resistance, ATR, RSI, MAs, risk-reward. |
| 4 | News & Sentiment | Evaluates recent news, event relevance, and whether it is already priced in. |
| 5 | Macro & Sector | Evaluates broad market, sector rotation, rates, inflation, dollar, macro risk. |
| 6 | Skeptic / Red Team | Must argue against every thesis. |
| 7 | Risk Analyst | Suggests risk parameters but cannot approve trades. |
| 8 | Orchestrator | Coordinates the workflow and writes the final memo. |

### 8.2 Memo Data Contract (referenced, Pydantic-validated)

The investment memo is a structured, persisted artifact referencing: instrument(s); thesis summary; per-agent analyses and rationales; Skeptic counter-arguments; proposed direction (long-only in MVP); suggested risk parameters (from Risk Analyst); supporting evidence/backtest references; explainability rationale; provenance and timestamps. A memo failing contract validation is not promoted to a signal.

### 8.3 Signal Data Contract (referenced, Pydantic-validated)

The signal is a structured, machine-readable artifact referencing: instrument; side (long-only); intended size (subject to risk limits); entry/exit/stop parameters; source memo reference; backtest reference; required-field completeness flag; explainability rationale; timestamps. **Any signal with missing required fields is rejected (SR-10).**

---

## 9. Data Requirements

| DR-ID | Requirement |
|-------|-------------|
| DR-01 | OHLCV data for all 21 universe instruments. |
| DR-02 | Canonical normalized schema after quality checks. |
| DR-03 | Computed features: returns, volatility, ATR, RSI, MAs, liquidity. |
| DR-04 | Raw immutable snapshots (Parquet) for replay/audit. |
| DR-05 | Persisted memos, signals, risk decisions, orders, and logs. |
| DR-06 | Knowledge/RAG corpus in the vector store. |

---

## 10. MVP Acceptance Criteria

| AC-ID | Acceptance Criterion |
|-------|----------------------|
| AC-01 | Ingest/mock market data successfully. |
| AC-02 | Compute basic features. |
| AC-03 | Generate a structured investment memo. |
| AC-04 | Convert the memo into a validated signal. |
| AC-05 | Backtest the signal. |
| AC-06 | Approve/block via deterministic risk rules. |
| AC-07 | Simulate a paper order. |
| AC-08 | Show signals, risk status, and paper positions in the dashboard. |
| AC-09 | Cannot place live trades unless explicitly reconfigured. |
| AC-10 | Test suite verifies invalid, oversized, incomplete, and risky trades are blocked. |

---

## 11. Dependencies

| Dependency | Use |
|------------|-----|
| Python 3.12, FastAPI, Pydantic | Core services and validation. |
| PostgreSQL + TimescaleDB / OHLCV schema | Market DB and feature store. |
| Redis | Cache/queue. |
| Celery or Temporal | Job orchestration. |
| Parquet + DuckDB | Raw data lake and file analytics. |
| LangGraph | Agent orchestration. |
| pgvector or Qdrant | Vector store / RAG. |
| Custom backtest engine (Backtrader optional later) | Simulation. |
| Interactive Brokers (paper) | Broker adapter, paper-only first. |
| Streamlit | MVP dashboard. |
| JSONL + PostgreSQL logs, OpenTelemetry | Logging, audit, observability. |
| Docker Compose | Local MVP deployment. |

---

## 12. Release Criteria

The MVP is releasable when: all **Must** functional requirements are met; all 18 safety hard requirements (SR-01..SR-18) hold; all MVP acceptance criteria (AC-01..AC-10) pass; the test suite confirms blocking of invalid/oversized/incomplete/risky trades; live trading is confirmed disabled by default; and audit/explainability coverage is complete. Live-trading readiness (Phase 12) is documented as a gated checklist but remains **disabled**.
