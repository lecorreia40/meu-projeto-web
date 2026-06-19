# MVP Acceptance Criteria — Mesa Proprietária com IA

**Project:** Mesa Proprietária com IA — Proprietary AI Trading Desk
**Scope:** Owner's own capital only. NOT a fund/advisory. No financial advice.
**Document owner:** Product Owner / Scrum Master
**Last updated:** 2026-06-19

This document consolidates the MVP acceptance criteria as testable Given/When/Then scenarios, the full negative-test matrix (every RISK ENGINE MUST-BLOCK condition), safety-constraint acceptance, per-phase exit criteria, and a traceability table mapping criteria to architecture layers/phases.

---

## 1. MVP Acceptance Scenarios (Happy & Core Path)

| ID | Capability | Scenario |
|----|------------|----------|
| AC-01 | Ingest mock market data | **Given** the seeded US stock/ETF universe, **When** mock ingestion runs with a fixed seed, **Then** deterministic OHLCV bars are persisted and an audit event is logged. |
| AC-02 | Compute basic features | **Given** persisted bars, **When** feature computation runs, **Then** returns, volatility, ATR, RSI, moving averages, and liquidity metrics are produced and stored. |
| AC-03 | Generate structured memo | **Given** features for a symbol, **When** the agent pipeline runs (mock LLM), **Then** a memo with **all** required fields (incl. skeptic_view, confidence_score, model_version, prompt_version) is produced. |
| AC-04 | Convert memo into validated signal | **Given** a complete approved memo, **When** the signal engine runs, **Then** a signal with all required fields and explicit entry/stop/target is produced and validated. |
| AC-05 | Backtest the signal | **Given** a validated signal flagged `requires_backtest`, **When** the backtester runs, **Then** metrics (win-rate, expectancy, drawdown) are produced and a pass/fail gate is recorded. |
| AC-06 | Approve/block via deterministic risk rules | **Given** a backtested signal, **When** the risk engine evaluates it, **Then** it returns APPROVED or BLOCKED with explicit reason codes, independent of any AI agent. |
| AC-07 | Simulate a paper order | **Given** a risk-APPROVED signal, **When** the paper simulator runs, **Then** a simulated fill is produced and the paper portfolio/P&L updates. |
| AC-08 | Dashboard surfaces state | **Given** signals, risk decisions, and paper positions exist, **When** I open the Streamlit dashboard, **Then** signals, risk status, and paper positions are displayed. |
| AC-09 | Cannot place live trades by default | **Given** default configuration, **When** any order is attempted, **Then** it routes to paper only and live execution is refused. |
| AC-10 | Test suite blocks bad trades | **Given** the test suite, **When** it runs, **Then** it verifies invalid, oversized, incomplete, and risky trades are blocked. |

---

## 2. Negative-Test Matrix — RISK ENGINE MUST BLOCK

Each RISK ENGINE MUST-BLOCK condition maps to an acceptance scenario. In every case the expected outcome is **BLOCKED → no trade**, an audit log entry with the reason code, and no order reaching the broker layer.

| ID | Block condition | Given / When / Then | Maps to |
|----|-----------------|---------------------|---------|
| NEG-01 | Missing signal fields | **Given** a signal missing a required field, **When** the validator runs, **Then** the signal is rejected and no order is created. | MP-503 |
| NEG-02 | Low liquidity | **Given** a symbol below the minimum liquidity threshold, **When** risk evaluates it, **Then** it is BLOCKED with `LOW_LIQUIDITY`. | MP-706 |
| NEG-03 | High spread | **Given** a symbol with spread above threshold, **When** risk evaluates it, **Then** it is BLOCKED with `WIDE_SPREAD`. | MP-706 |
| NEG-04 | Insufficient price history | **Given** a symbol with too few bars, **When** risk evaluates it, **Then** it is BLOCKED with `INSUFFICIENT_HISTORY`. | MP-706 |
| NEG-05 | Data quality failure | **Given** bars failing data-quality checks, **When** risk evaluates the signal, **Then** it is BLOCKED with `DATA_QUALITY_FAILURE`. | MP-105, MP-706 |
| NEG-06 | Backtest failure | **Given** a signal whose backtest failed, **When** risk evaluates it, **Then** it is BLOCKED with `BACKTEST_FAILURE`. | MP-603, MP-706 |
| NEG-07 | Position size above limit | **Given** a position size > 2% of capital, **When** risk evaluates it, **Then** it is BLOCKED with `POSITION_SIZE_EXCEEDED`. | MP-702 |
| NEG-08 | Risk per trade above limit | **Given** risk/trade > 1%, **When** risk evaluates it, **Then** it is BLOCKED with `RISK_PER_TRADE_EXCEEDED`. | MP-702 |
| NEG-09 | Daily loss limit breach | **Given** realized daily loss ≥ 2%, **When** a new trade is evaluated, **Then** it is BLOCKED with `DAILY_LOSS_LIMIT`. | MP-703 |
| NEG-10 | Weekly loss limit breach | **Given** realized weekly loss ≥ 5%, **When** a new trade is evaluated, **Then** it is BLOCKED with `WEEKLY_LOSS_LIMIT`. | MP-703 |
| NEG-11 | Max open positions breach | **Given** 3 open positions already, **When** a 4th is evaluated, **Then** it is BLOCKED with `MAX_OPEN_POSITIONS`. | MP-704 |
| NEG-12 | Max total exposure breach | **Given** total exposure would exceed 20%, **When** a trade is evaluated, **Then** it is BLOCKED with `MAX_EXPOSURE`. | MP-704 |
| NEG-13 | Short selling | **Given** a short-direction signal, **When** risk evaluates it, **Then** it is BLOCKED with `SHORT_NOT_ALLOWED`. | MP-705 |
| NEG-14 | Options | **Given** an options instrument, **When** risk evaluates it, **Then** it is BLOCKED with `OPTIONS_NOT_ALLOWED`. | MP-705 |
| NEG-15 | Crypto | **Given** a crypto instrument, **When** risk evaluates it, **Then** it is BLOCKED with `CRYPTO_NOT_ALLOWED`. | MP-705 |
| NEG-16 | Leverage | **Given** a leveraged order, **When** risk evaluates it, **Then** it is BLOCKED with `LEVERAGE_NOT_ALLOWED`. | MP-705 |
| NEG-17 | Broker connection failure | **Given** the broker connection is down, **When** an order is attempted, **Then** it is BLOCKED with `BROKER_UNAVAILABLE` and no trade fires. | MP-903 |
| NEG-18 | Unapproved live trading | **Given** `LIVE_TRADING_ENABLED=false`, **When** a live order is attempted, **Then** it is BLOCKED with `LIVE_NOT_APPROVED`. | MP-904 |
| NEG-19 | LLM uncertainty / incomplete thesis | **Given** a memo with low confidence or incomplete thesis, **When** risk evaluates the signal, **Then** it is BLOCKED with `LLM_UNCERTAINTY`. | MP-404, MP-707 |
| NEG-20 | Earnings-event trading | **Given** a symbol within an earnings window (not explicitly allowed), **When** risk evaluates it, **Then** it is BLOCKED with `EARNINGS_EVENT`. | MP-707 |

---

## 3. Safety-Constraint Acceptance

| ID | Constraint | Given / When / Then |
|----|------------|---------------------|
| SAFE-01 | No live trade by default | **Given** default config, **When** the system starts, **Then** `LIVE_TRADING_ENABLED` is `false` and no live order path is active. |
| SAFE-02 | Paper trading is default | **Given** default config, **When** an approved order is executed, **Then** it executes in paper mode only. |
| SAFE-03 | No trade on data failure | **Given** a data/data-quality failure, **When** the pipeline runs, **Then** no trade occurs. |
| SAFE-04 | No trade on broker failure | **Given** a broker failure, **When** an order is attempted, **Then** no trade occurs. |
| SAFE-05 | No trade on risk failure | **Given** any risk-engine block, **When** evaluated, **Then** no trade occurs. |
| SAFE-06 | No trade on LLM failure | **Given** an LLM failure or uncertainty, **When** the pipeline runs, **Then** no trade occurs. |
| SAFE-07 | AI proposes, never executes | **Given** any AI agent output, **When** inspected, **Then** it is a proposal only and cannot reach the broker without deterministic validation, backtest, and risk approval. |
| SAFE-08 | Risk authority supremacy | **Given** an AI agent recommending a trade, **When** the risk engine blocks it, **Then** the block is final and the AI cannot override it. |
| SAFE-09 | Full auditability | **Given** any trading action or AI output, **When** it occurs, **Then** it is logged with timestamp/event_type/entity_id/severity, and AI outputs carry model_version & prompt_version. |
| SAFE-10 | Explicit reconfiguration required for live | **Given** a desire to trade live, **When** no explicit reconfiguration is done, **Then** live trades remain impossible. |

---

## 4. Per-Phase Exit Criteria

| Phase | Exit criteria |
|-------|---------------|
| 0 — Foundation | Docker Compose stack healthy; typed settings load with `LIVE_TRADING_ENABLED=false`; `.env.example` only; structured logging works; risk-rule TDD harness present. |
| 1 — Data | Core models validate; migrations apply; bars are a TimescaleDB hypertable; universe seeded (US stocks/ETFs only); deterministic mock ingestion persists bars (AC-01). |
| 2 — Features | Returns, volatility, ATR, RSI, MAs, liquidity computed and stored (AC-02). |
| 3 — Agents | LangGraph framework runs all 8 agents with deterministic mock LLM; outputs carry model_version & prompt_version. |
| 4 — Memo | Memo with all required fields generated and persisted; incomplete/low-confidence memos blocked (AC-03, NEG-19). |
| 5 — Signal | Memo→signal conversion produces validated signal; missing-field signals rejected (AC-04, NEG-01). |
| 6 — Backtest | Backtester produces metrics; pass/fail gate persisted; backtest failure blocks (AC-05, NEG-06). |
| 7 — Risk | Deterministic engine approves/blocks with reason codes; all MUST-BLOCK conditions enforced (AC-06, NEG-02…NEG-20). |
| 8 — Paper exec | Paper simulator fills approved signals only; portfolio/P&L tracked; unapproved orders rejected (AC-07, SAFE-07/08). |
| 9 — Broker | IBKR paper adapter behind `BrokerInterface`; broker-failure blocks; live hard-guarded (NEG-17, NEG-18, SAFE-01). |
| 10 — Dashboard | Signals, risk status, paper positions displayed; live-disabled indicator visible (AC-08). |
| 11 — Tests/Audit | Negative-test matrix passes; integration tests green; audit trail complete (AC-10, SAFE-09). |
| 12 — Live readiness | Readiness checklist documented; live-disabled assertion test passes; **live remains disabled**. |

---

## 5. Traceability Matrix (Acceptance → Layer/Phase → Stories)

| Acceptance | Architecture Layer | Phase | Primary Stories |
|-----------|--------------------|-------|-----------------|
| AC-01 | Data / Mock ingestion | 1 | MP-104, MP-105 |
| AC-02 | Feature engineering | 2 | MP-201…MP-204 |
| AC-03, NEG-19 | Memo generation | 4 | MP-401, MP-402, MP-404 |
| AC-04, NEG-01 | Signal engine & validation | 5 | MP-501, MP-502, MP-503 |
| AC-05, NEG-06 | Backtesting engine | 6 | MP-601, MP-603 |
| AC-06, NEG-02…NEG-20 | Deterministic risk engine | 7 | MP-701…MP-709 |
| AC-07, SAFE-07/08 | Paper execution simulator | 8 | MP-801…MP-804 |
| NEG-17/18, SAFE-01/10 | Broker adapter (IBKR paper) | 9 | MP-901…MP-904 |
| AC-08 | Dashboard | 10 | MP-1001…MP-1004 |
| AC-09, SAFE-01/02 | Config / Broker guard | 0, 9 | MP-003, MP-004, MP-904 |
| AC-10 | Tests & audit | 11 | MP-1101, MP-1102, MP-1103 |
| SAFE-09 | Logging / Audit | 0, 11 | MP-005, MP-1104 |
| SAFE-03/04/05/06 | Data / Broker / Risk / LLM gates | 1,7,9 | MP-105, MP-706, MP-708, MP-903 |

---

## 6. Global Pass/Fail Definition

The MVP **passes** when: AC-01…AC-10 all pass, every NEG-01…NEG-20 scenario blocks with the correct reason code and no order reaches the broker, every SAFE-01…SAFE-10 constraint holds, and the automated test suite verifying invalid/oversized/incomplete/risky trades are blocked is green — all with `LIVE_TRADING_ENABLED=false`.
