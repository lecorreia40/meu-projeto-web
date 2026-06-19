# MVP Roadmap — Mesa Proprietária com IA

> **BMAD Method Artifact — Product Manager**
> Status: Draft v1.0 · Date: 2026-06-19 · Owner: Owner-Operator (sole stakeholder)

---

## 1. Roadmap Overview

This roadmap sequences the 13 development phases (Phase 0–12) into a safety-first delivery plan. The guiding rule: **research → backtesting → paper trading first; live trading last, disabled by default, and gated behind a readiness checklist.** Each phase has objectives, key deliverables, and exit criteria. No phase may begin until its predecessor's exit criteria are met (except where explicitly parallelizable).

---

## 2. Phase Roadmap (Phase 0–12)

### Phase 0 — Foundation
- **Objective:** Establish repository, containerization, configuration, logging, and documentation.
- **Key deliverables:** Repo scaffold; Docker Compose; config management; structured logging (JSONL + PostgreSQL); base docs.
- **Exit criteria:** Project boots via Docker Compose; logging operational; docs present.

### Phase 1 — Data Models & Schema
- **Objective:** Define data models, DB schema, asset universe, and mock ingestion.
- **Key deliverables:** Pydantic models; PostgreSQL/OHLCV schema; encoded 21-instrument universe; mock ingestion job.
- **Exit criteria:** Mock OHLCV ingested and persisted for all universe instruments.

### Phase 2 — Features
- **Objective:** Compute core features/indicators.
- **Key deliverables:** Returns, volatility, ATR, RSI, moving averages, liquidity; feature store.
- **Exit criteria:** Features computed and queryable for the universe (AC-02).

### Phase 3 — Agent Framework (Mock LLM)
- **Objective:** Stand up the multi-agent swarm with a mock LLM.
- **Key deliverables:** LangGraph orchestration of all 8 agents; Skeptic argues against every thesis; explainable outputs; agents cannot execute.
- **Exit criteria:** End-to-end agent debate runs with mock LLM; rationales captured.

### Phase 4 — Memo Generation & Persistence
- **Objective:** Produce and persist structured investment memos.
- **Key deliverables:** Memo engine conforming to the Memo Data Contract; persistence with provenance.
- **Exit criteria:** Structured memo generated and stored (AC-03).

### Phase 5 — Signal Engine & Validation
- **Objective:** Convert memos into validated structured signals.
- **Key deliverables:** Signal engine; Signal Data Contract validation; required-field rejection.
- **Exit criteria:** Memo converts to a validated signal; incomplete signals rejected (AC-04, SR-10).

### Phase 6 — Backtesting Engine
- **Objective:** Validate signal hypotheses over historical data.
- **Key deliverables:** Custom lightweight backtest engine; performance/risk statistics.
- **Exit criteria:** Signal backtested with reported statistics (AC-05).

### Phase 7 — Deterministic Risk Engine
- **Objective:** Approve or block signals deterministically; enforce supreme risk authority.
- **Key deliverables:** Risk policy enforcement (all MVP parameters); portfolio state tracking; risk-fail = no trade.
- **Exit criteria:** Risk engine approves/blocks per policy; authority outranks agents (AC-06, SR-11, SR-14).

### Phase 8 — Paper Execution Simulator
- **Objective:** Simulate order execution with no real capital.
- **Key deliverables:** Order validation; paper execution simulator; paper-trading default.
- **Exit criteria:** Paper order simulated end-to-end (AC-07, SR-17).

### Phase 9 — IBKR Adapter (Paper-Only)
- **Objective:** Integrate Interactive Brokers in paper-only mode.
- **Key deliverables:** IBKR paper adapter; broker-fail = no trade; live disabled by default.
- **Exit criteria:** Paper orders routed through IBKR adapter; broker failure halts trading (SR-13, SR-16).

### Phase 10 — Streamlit Dashboard
- **Objective:** Provide the control-room dashboard.
- **Key deliverables:** Streamlit views for signals, risk status, paper positions; failure/lock indicators.
- **Exit criteria:** Dashboard displays signals, risk status, and paper positions (AC-08).

### Phase 11 — Tests, Observability & Audit Logs
- **Objective:** Harden correctness, safety, and auditability.
- **Key deliverables:** Test suite blocking invalid/oversized/incomplete/risky trades; OpenTelemetry instrumentation; complete audit trail.
- **Exit criteria:** All safety tests pass; full audit coverage (AC-10, SR-08, SR-09).

### Phase 12 — Live-Trading Readiness Checklist (Disabled)
- **Objective:** Document a gated readiness checklist for any future live trading.
- **Key deliverables:** Readiness checklist; configuration gate; explicit-reconfiguration requirement.
- **Exit criteria:** Checklist documented; live trading confirmed **disabled by default** and not enabled (AC-09, SR-01, SR-16). **No live trading is activated in MVP.**

---

## 3. Phase Timeline Table

| Phase | Name | Primary Outcome | Maps to Acceptance / Safety |
|-------|------|-----------------|------------------------------|
| 0 | Foundation | Repo, Docker, config, logging, docs | SR-08 |
| 1 | Data Models & Schema | Models, schema, universe, mock ingestion | AC-01, SR-07 |
| 2 | Features | Core indicators computed | AC-02 |
| 3 | Agent Framework | 8 agents via mock LLM | SR-09, SR-11 |
| 4 | Memo Engine | Structured memos persisted | AC-03 |
| 5 | Signal Engine | Validated signals | AC-04, SR-10 |
| 6 | Backtesting | Hypotheses validated | AC-05 |
| 7 | Risk Engine | Deterministic approve/block | AC-06, SR-11, SR-14 |
| 8 | Paper Simulator | Paper order simulated | AC-07, SR-17 |
| 9 | IBKR Adapter | Paper-only broker routing | SR-13, SR-16 |
| 10 | Dashboard | Control-room views | AC-08 |
| 11 | Tests & Audit | Safety tests, audit, observability | AC-10, SR-08, SR-09 |
| 12 | Live Readiness | Gated checklist (disabled) | AC-09, SR-01, SR-16 |

---

## 4. Sequencing Dependencies

- **Data before intelligence:** Phases 1–2 (data, features) precede Phase 3 (agents).
- **Intelligence before signals:** Phases 3–4 (agents, memos) precede Phase 5 (signals).
- **Evidence before risk:** Phase 6 (backtesting) precedes Phase 7 (risk) for hypothesis validation.
- **Risk before execution:** Phase 7 (risk engine) precedes Phases 8–9 (any execution path). **No execution layer may bypass the risk engine.**
- **Execution before broker:** Phase 8 (paper simulator) precedes Phase 9 (IBKR adapter).
- **Everything before visibility:** Phases 1–9 precede meaningful Phase 10 dashboard content.
- **Hardening last (pre-readiness):** Phase 11 precedes Phase 12.
- **Live trading gated:** Phase 12 is documentation/gating only — **never enabled in MVP**.

```
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12(disabled)
                         (6 feeds 7; 7 gates 8/9)
```

---

## 5. Milestones

| Milestone | Definition | Phases |
|-----------|------------|--------|
| M1 — Data Ready | Mock data ingested; features computed. | 0–2 |
| M2 — Research Ready | Agent swarm and memos operational. | 3–4 |
| M3 — Decision Ready | Signals validated and backtested. | 5–6 |
| M4 — Risk & Execution Ready | Risk engine + paper execution (incl. IBKR paper). | 7–9 |
| M5 — Operable MVP | Dashboard live; tests, audit, observability complete. | 10–11 |
| M6 — Readiness Documented | Live-trading checklist documented, live disabled. | 12 |

---

## 6. MVP Definition of Done

The MVP is **done** when all of the following hold:

1. Market data is ingested (mock acceptable) — **AC-01**.
2. Basic features are computed — **AC-02**.
3. A structured investment memo is generated — **AC-03**.
4. The memo is converted into a validated signal — **AC-04**.
5. The signal is backtested — **AC-05**.
6. Deterministic risk rules approve/block decisions — **AC-06**.
7. A paper order is simulated — **AC-07**.
8. The dashboard shows signals, risk status, and paper positions — **AC-08**.
9. Live trades cannot be placed unless explicitly reconfigured — **AC-09**.
10. The test suite verifies invalid, oversized, incomplete, and risky trades are blocked — **AC-10**.
11. All 18 safety hard requirements (SR-01..SR-18) hold.
12. Every trading action is logged; every AI decision is explainable.

**Live trading (Phase 12) remains disabled by default** and is gated behind the readiness checklist. It is not enabled as part of the MVP under any circumstance.
