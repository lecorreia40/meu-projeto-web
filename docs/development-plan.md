# Development Plan — Mesa Proprietária com IA

**Project:** Mesa Proprietária com IA — Proprietary AI Trading Desk
**Scope:** Owner's own capital only. NOT a fund/advisory. No financial advice.
**Document owner:** Scrum Master / Lead Engineer
**Last updated:** 2026-06-19

> **Prime safety directive:** No code that can place live orders by default will be written. **All execution defaults to paper/dry-run with `LIVE_TRADING_ENABLED=false`.** AI agents propose; the deterministic pipeline and risk engine decide. The risk engine has higher authority than any AI agent.

---

## 1. Implementation Sequencing

Work proceeds strictly bottom-up through the 13 phases so that each layer rests on a validated layer beneath it. Execution-capable code is the **last** thing built, and only in paper mode.

| Order | Phase | Deliverable | Gate before proceeding |
|-------|-------|-------------|------------------------|
| 1 | 0 | Repo, Docker, config, logging, docs, **risk-rule TDD harness** | Stack healthy; live disabled; secrets safe |
| 2 | 1 | Data models, DB schema, asset universe, mock ingestion | Deterministic ingestion persists bars |
| 3 | 2 | Features (returns, vol, ATR, RSI, MAs, liquidity) | Features computed & stored |
| 4 | 3 | Agent framework + mock LLM (8 agents) | Agents run offline, versioned outputs |
| 5 | 4 | Investment memo generation & persistence | Complete memos; incomplete blocked |
| 6 | 5 | Signal engine & validation | Missing-field signals rejected |
| 7 | 6 | Backtesting engine | Metrics + pass/fail gate |
| 8 | 7 | **Deterministic risk engine** (authority) | All MUST-BLOCK conditions enforced |
| 9 | 8 | Paper execution simulator | Only approved signals fill |
| 10 | 9 | IBKR adapter (paper-only) | Broker behind interface; live hard-guarded |
| 11 | 10 | Streamlit dashboard | Signals/risk/positions visible |
| 12 | 11 | Tests, observability, audit | Negative matrix green; audit complete |
| 13 | 12 | Live-readiness checklist (disabled) | Documented; live remains off |

**Critical rule:** Per coding standards, **risk-rule tests are written before execution code.** Phase 0 seeds these tests (Sprint 1 story MP-008); Phase 7/8 implementation must make them pass. No order/execution code merges without its guarding test already present.

---

## 2. Branch & PR Strategy

| Aspect | Convention |
|--------|------------|
| Default branch | `main` — always green, always deployable to paper |
| Branch naming | `phase-<n>/<MP-id>-<slug>` (e.g., `phase-1/MP-104-mock-ingestion`) |
| One PR per story | Small, reviewable; references its Story ID and acceptance criteria |
| PR requirements | CI green, lint/type checks pass, tests added, acceptance criteria checked off |
| Protected `main` | No direct pushes; PR + review required |
| Risk/execution PRs | Must show that the corresponding risk-rule test existed first (TDD) and now passes |
| Live-trading code | Prohibited in MVP; any PR enabling a live path is rejected |

Each PR description restates the story's Given/When/Then and ticks the boxes. Commits are conventional and scoped to a single concern.

---

## 3. Environment Setup (Docker Compose Services)

| Service | Purpose | Notes |
|---------|---------|-------|
| `postgres` (TimescaleDB) | Relational + time-series store (bars hypertable, memos, signals, audit_log) | Healthcheck gates app start |
| `redis` | Caching, Celery/Temporal broker, feature cache | Healthcheck |
| `app` | FastAPI service + pipeline runners | Built from project Dockerfile |
| `worker` | Celery/Temporal worker (async tasks: ingestion, backtest) | Shares app image |
| `dashboard` | Streamlit dashboard (Phase 10) | Read-oriented; live-disabled banner |

**Supporting stores (introduced by phase):** Parquet + DuckDB for columnar backtest data (Phase 1/6); pgvector/Qdrant for agent memory (Phase 3, optional).

**Config & secrets:** All sensitive values come from `.env` (git-ignored). Only `.env.example` is committed. `LIVE_TRADING_ENABLED=false` and `PAPER_TRADING_DEFAULT=true` are hardcoded defaults in the typed `Settings` model. No API keys in the repo. External APIs (market data, broker) sit behind interfaces.

Bring-up: `make up` starts the stack with healthchecks; the app waits for Postgres/Redis to be healthy before running migrations.

---

## 4. How Phase 0 Then Phase 1 Will Be Built

### Phase 0 — Foundation (Sprint 1, first half)
1. **MP-001** Repo skeleton with per-layer packages and mirrored `tests/`.
2. **MP-002** Docker Compose (Postgres/TimescaleDB, Redis, app) with healthchecks and volumes.
3. **MP-003** Typed `Settings` (pydantic-settings); safety flags default safe.
4. **MP-004** `.env.example` only; secret-scan hook; `LIVE_TRADING_ENABLED=false` documented.
5. **MP-005** Structured logging (JSONL + Postgres `audit_log`) with canonical record shape.
6. **MP-008** **Risk-rule TDD harness** — failing/pending tests encoding every MUST-BLOCK condition and the risk policy constants, written **before** any execution code.

**Phase 0 exit:** stack healthy; settings load with live disabled; secrets safe; structured logging works; risk-rule tests collected and pending.

### Phase 1 — Data (Sprint 1, second half)
1. **MP-101** Core Pydantic models (Asset, Bar, Memo, Signal) declaring all required fields.
2. **MP-102** Migrations: assets, bars (hypertable), memos, signals, audit_log.
3. **MP-103** Seed long-only US stock/ETF universe; reject out-of-scope instruments.
4. **MP-104** `MarketDataInterface` + deterministic `MockMarketDataProvider`; persist bars; audit ingestion.
5. **MP-105 / MP-106** (stretch) Data-quality validation; Parquet+DuckDB store.

**Phase 1 exit:** models validate; migrations apply; universe seeded; deterministic mock ingestion persists bars (acceptance AC-01).

---

## 5. Testing Strategy

| Test layer | Scope | When |
|------------|-------|------|
| **Risk-rule tests (first)** | Every MUST-BLOCK condition + risk policy constants | Written in Phase 0 (MP-008), satisfied in Phase 7/8 |
| Unit tests | Models, settings, features, converters, individual rules | Every phase, alongside code |
| Integration tests | memo → signal → backtest → risk → paper pipeline | Phase 11 (and incremental seams earlier) |
| Backtest validation tests | Determinism, metric correctness, gate behavior | Phase 6 |
| Negative-test matrix | invalid / oversized / incomplete / risky trades blocked | Phase 11 (NEG-01…NEG-20) |
| Safety assertions | `LIVE_TRADING_ENABLED=false`, paper default, no-trade on failure | Phase 0 onward, locked in Phase 12 |

**Principles:** determinism via seeded mock data and mock LLM; external APIs and broker mocked behind interfaces; the risk engine is tested independently of any AI; no test ever places a live order.

---

## 6. CI Considerations

| Check | Gate |
|-------|------|
| Lint & format (ruff/black) | Block merge on failure |
| Type check (mypy) | Block merge on failure |
| Unit + risk-rule tests | Block merge on failure |
| Secret scan | Block merge if any secret detected |
| Live-disabled assertion | A CI test asserts `LIVE_TRADING_ENABLED=false` by default |
| Migrations up/down | Verified in CI against ephemeral Postgres/TimescaleDB |
| Coverage (risk module) | Risk rules require high coverage before Phase 8 |

CI runs against an ephemeral Compose-style DB so migrations and integration seams are exercised. `main` stays green and paper-only.

---

## 7. Definition of Done Per Phase

| Phase | Done when |
|-------|-----------|
| 0 | Stack healthy; settings safe-by-default; secrets handled; logging works; risk-rule TDD harness present; CI green. |
| 1 | Models validate; migrations apply; universe seeded (US stocks/ETFs only); deterministic ingestion persists bars; audit events logged. |
| 2 | All features computed/stored with unit tests. |
| 3 | 8 agents run on mock LLM; outputs carry model_version & prompt_version; agents propose only. |
| 4 | Complete memos persisted; incomplete/low-confidence blocked. |
| 5 | Validated signals produced; missing-field signals rejected. |
| 6 | Backtester deterministic; metrics + pass/fail gate persisted. |
| 7 | All MUST-BLOCK conditions enforced with reason codes; risk-rule tests pass; risk authority supreme. |
| 8 | Paper simulator fills approved signals only; unapproved orders rejected; portfolio/P&L tracked. |
| 9 | Broker behind `BrokerInterface`; IBKR paper adapter; broker-failure blocks; live hard-guarded. |
| 10 | Signals/risk/positions shown; live-disabled banner visible. |
| 11 | Negative matrix passes; integration tests green; audit trail complete. |
| 12 | Live-readiness checklist documented; live-disabled assertion test passes; **live remains disabled**. |

Every phase additionally satisfies the global DoD: type hints, Pydantic schemas, clean module boundaries, interfaces for external APIs, all orders require risk approval, complete audit logging, no secrets, paper/dry-run default.

---

## 8. Immediate Next Steps (After Planning)

1. **Start Phase 0 (Sprint 1):** create repo skeleton (MP-001), then Docker Compose (MP-002).
2. Implement typed settings + safety defaults (MP-003) and secrets/`.env.example` with `LIVE_TRADING_ENABLED=false` (MP-004).
3. Add structured logging (MP-005).
4. **Write the risk-rule TDD harness (MP-008) before any execution code** — encode every MUST-BLOCK condition and the risk policy constants as pending tests.
5. **Move into Phase 1:** core models (MP-101), migrations (MP-102), seed the long-only US stock/ETF universe (MP-103), and deterministic mock ingestion (MP-104).
6. Confirm Phase 0 and Phase 1 exit criteria, demo deterministic ingestion (AC-01), then plan Sprint 2 (Phase 2 features).

> Throughout, no live-order code path is built or enabled. Execution is paper/dry-run only, and the risk engine's authority over AI proposals is preserved at every step.
