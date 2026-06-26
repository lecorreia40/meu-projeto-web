# Sprint 1 — Foundation & Data (Phase 0 + Phase 1)

**Project:** Mesa Proprietária com IA — Proprietary AI Trading Desk
**Sprint:** Sprint 1
**Phases covered:** Phase 0 (Repo / Docker / Config / Logging / Docs) + Phase 1 (Data models / DB schema / Asset universe / Mock ingestion)
**Document owner:** Scrum Master / Product Owner
**Last updated:** 2026-06-19

---

## 1. Sprint Goal

> **Stand up a safe, reproducible foundation and a validated data layer.** By the end of Sprint 1 the team can run the entire stack via Docker Compose, load typed configuration with `LIVE_TRADING_ENABLED=false` by default, emit structured audit logs, persist core domain models in PostgreSQL/TimescaleDB, seed a long-only US stock/ETF universe, and ingest deterministic mock market data — with the **first risk-rule tests written (TDD) before any execution code exists.**

This sprint deliberately establishes the safety scaffolding (no secrets in repo, live trading disabled, every action auditable) and the data backbone every later phase depends on.

---

## 2. Capacity Assumptions

| Assumption | Value |
|------------|-------|
| Sprint length | 2 weeks (10 working days) |
| Team | 1 operator-developer (solo proprietary desk) + AI pair |
| Focus factor | ~70% (meetings, planning, research overhead) |
| Estimated capacity | ~34 story points |
| Committed this sprint | 33 story points (10 stories) |
| Velocity basis | First sprint — capacity is an estimate, to be recalibrated |

> **Note:** Since this is a single-operator proprietary desk, "team" ceremonies are lightweight. Capacity is intentionally conservative for the first sprint.

---

## 3. Sprint Backlog (Selected Stories)

| Story ID | Title | Pts | Priority | Epic |
|----------|-------|-----|----------|------|
| MP-001 | Repository & project skeleton | 3 | Must | EP-00 |
| MP-002 | Docker Compose environment | 5 | Must | EP-00 |
| MP-003 | Configuration & settings module | 3 | Must | EP-00 |
| MP-004 | Secrets management & `.env.example` | 2 | Must | EP-00 |
| MP-005 | Structured logging (JSONL + Postgres) | 3 | Must | EP-00 |
| MP-008 | Early risk-rule test harness (TDD) | 3 | Must | EP-00 |
| MP-101 | Core domain Pydantic models | 5 | Must | EP-01 |
| MP-102 | DB schema & migrations | 5 | Must | EP-01 |
| MP-103 | Asset universe (long-only US stocks/ETFs) | 3 | Must | EP-01 |
| MP-104 | Mock market-data ingestion | 5 | Must | EP-01 |
| **Total** | | **37** | | |

> Committed scope is 33 pts (MP-006/MP-007 from Phase 0 and MP-105/MP-106 are stretch/next-sprint). The table lists the full candidate set; the team commits to the 10 stories below with MP-104 as the sprint's last pull if capacity allows.

---

## 4. Detailed Stories

---

### MP-001 — Repository & project skeleton
**Priority:** Must · **Points:** 3 · **Dependencies:** none

**User story**
> As an operator, I want a structured Python 3.12 mono-repo with clear module boundaries so that all future code has a clean, predictable home.

**Description**
Create the repository layout with separated packages for data, features, agents, signals, backtest, risk, execution, broker, dashboard, and shared utilities. Establish `pyproject.toml`, dependency management, and a `src/` layout with `tests/` mirrored.

**Tasks / Subtasks**
- [ ] Initialize `pyproject.toml` (Python 3.12, FastAPI, Pydantic, etc.)
- [ ] Create package skeleton: `src/mesa/{data,features,agents,memos,signals,backtest,risk,execution,broker,dashboard,common}`
- [ ] Create mirrored `tests/` tree
- [ ] Add `Makefile`/task runner targets (`make up`, `make test`, `make lint`)
- [ ] Add `.gitignore` (ensure `.env` ignored)

**Acceptance criteria**
- **Given** a fresh clone, **When** I run the install command, **Then** the project installs without errors on Python 3.12.
- **Given** the repo, **When** I inspect the tree, **Then** each architecture layer has its own package with `__init__.py` and a matching test package.
- **Given** `.gitignore`, **When** I create a local `.env`, **Then** it is not tracked by git.

---

### MP-002 — Docker Compose environment
**Priority:** Must · **Points:** 5 · **Dependencies:** MP-001

**User story**
> As an operator, I want Docker Compose orchestrating PostgreSQL, TimescaleDB, and Redis so that the full local stack starts with one command.

**Description**
Provide `docker-compose.yml` with services for Postgres (with TimescaleDB extension), Redis, and an app container. Include healthchecks and named volumes for persistence.

**Tasks / Subtasks**
- [ ] Define `postgres` service with TimescaleDB image and healthcheck
- [ ] Define `redis` service with healthcheck
- [ ] Define `app` service building from project Dockerfile
- [ ] Wire env from `.env` (never bake secrets into the image)
- [ ] Add named volumes for Postgres data
- [ ] Document `make up` / `make down`

**Acceptance criteria**
- **Given** Docker installed, **When** I run `make up`, **Then** Postgres, TimescaleDB, and Redis start and report healthy.
- **Given** the running stack, **When** I connect to Postgres, **Then** the TimescaleDB extension is available.
- **Given** the compose file, **When** I inspect it, **Then** no secret values are hardcoded — all sensitive values come from `.env`.
- **Given** `make down` then `make up`, **When** the stack restarts, **Then** Postgres data persists via the named volume.

---

### MP-003 — Configuration & settings module
**Priority:** Must · **Points:** 3 · **Dependencies:** MP-001

**User story**
> As an operator, I want a typed Pydantic settings module that loads from `.env` so that configuration is centralized, validated, and fails fast on misconfiguration.

**Description**
Implement a `Settings` class (pydantic-settings) covering DB/Redis URLs, environment, log level, and the critical safety flags `PAPER_TRADING_DEFAULT=true` and `LIVE_TRADING_ENABLED=false`.

**Tasks / Subtasks**
- [ ] Create `Settings` model with typed fields and defaults
- [ ] Default `LIVE_TRADING_ENABLED=false` and `PAPER_TRADING_DEFAULT=true`
- [ ] Validate required fields at startup (fail fast)
- [ ] Provide a cached `get_settings()` accessor
- [ ] Unit test default values

**Acceptance criteria**
- **Given** no override, **When** settings load, **Then** `LIVE_TRADING_ENABLED` is `false` and `PAPER_TRADING_DEFAULT` is `true`.
- **Given** a missing required variable, **When** settings load, **Then** startup fails with a clear validation error.
- **Given** a `.env` value, **When** settings load, **Then** the typed field reflects the value with correct type coercion.

---

### MP-004 — Secrets management & `.env.example`
**Priority:** Must · **Points:** 2 · **Dependencies:** MP-003

**User story**
> As an operator, I want only a `.env.example` committed (never real secrets) and `LIVE_TRADING_ENABLED=false` documented as default so that the system is safe and no API key ever leaks into the repo.

**Description**
Create `.env.example` enumerating every config key with safe placeholder values. Ensure no real key can be committed; document the safety defaults prominently.

**Tasks / Subtasks**
- [ ] Author `.env.example` with all keys and placeholder values
- [ ] Include `LIVE_TRADING_ENABLED=false` and `PAPER_TRADING_DEFAULT=true` with comments
- [ ] Confirm `.env` is git-ignored
- [ ] Add a secret-scan check (pre-commit / CI) to block committed secrets
- [ ] Document setup steps in README

**Acceptance criteria**
- **Given** the repo, **When** I list tracked files, **Then** `.env.example` exists and no real `.env` is tracked.
- **Given** `.env.example`, **When** I read it, **Then** every configuration key is present with a non-secret placeholder and `LIVE_TRADING_ENABLED=false`.
- **Given** an accidental secret in a staged file, **When** I commit, **Then** the secret-scan hook blocks the commit.

---

### MP-005 — Structured logging (JSONL + Postgres)
**Priority:** Must · **Points:** 3 · **Dependencies:** MP-003

**User story**
> As an operator/auditor, I want structured logs containing timestamp, event_type, entity_id, and severity (to JSONL and PostgreSQL) so that every action in the desk is auditable.

**Description**
Implement a logging utility emitting structured JSONL to disk and persisting audit-grade events to a Postgres `audit_log` table. Establish the canonical log record shape used across all phases.

**Tasks / Subtasks**
- [ ] Define `LogEvent` schema: `timestamp`, `event_type`, `entity_id`, `severity`, `payload`
- [ ] JSONL file sink
- [ ] Postgres `audit_log` sink (via MP-102 table once available; stub table for now)
- [ ] Helper `log_event(...)` used by all modules
- [ ] Unit test that a logged event contains all required fields

**Acceptance criteria**
- **Given** any `log_event` call, **When** the event is written, **Then** it includes `timestamp`, `event_type`, `entity_id`, and `severity`.
- **Given** a logged event, **When** I read the JSONL file, **Then** each line is valid JSON with the canonical shape.
- **Given** the audit sink is configured, **When** an audit event is logged, **Then** it is persisted to the `audit_log` table.

---

### MP-008 — Early risk-rule test harness (TDD)
**Priority:** Must · **Points:** 3 · **Dependencies:** MP-001

**User story**
> As a risk owner/developer, I want a pytest harness with the first failing risk-rule tests written **before** any risk engine or execution code so that TDD discipline (tests before execution code) is enforced from Sprint 1.

**Description**
Although the risk engine is Phase 7, the coding standards require **risk-rule tests before execution code**. This story seeds `tests/risk/` with executable specifications (currently failing or `xfail`/skip-with-reason) encoding the MUST-BLOCK conditions and the risk policy constants. This locks in intent and prevents any execution code from being written without a guarding test.

> **TDD intent:** These tests are written now, deliberately ahead of the implementation. They serve as the executable contract for Phase 7 (MP-701…MP-709) and Phase 8 (MP-804). No execution/order code may be merged until its corresponding test here exists and passes.

**Tasks / Subtasks**
- [ ] Create `tests/risk/` package and shared fixtures (sample signals, policy config)
- [ ] Encode risk policy constants as a fixture (1% risk/trade, 2% size, 2% daily, 5% weekly, 3 positions, 20% exposure)
- [ ] Write `xfail`/skip-marked tests for each MUST-BLOCK condition (missing fields, oversized position, daily/weekly loss, max positions, exposure, short/options/crypto/leverage, low liquidity, wide spread, insufficient history, data-quality failure, backtest failure, broker failure, unapproved live trading, LLM uncertainty, earnings event)
- [ ] Add a test asserting `LIVE_TRADING_ENABLED=false` by default
- [ ] Document the TDD policy in `tests/risk/README` note

**Acceptance criteria**
- **Given** the test suite, **When** I run `pytest tests/risk`, **Then** the harness collects one test per MUST-BLOCK condition, each clearly marked pending implementation.
- **Given** the risk policy fixture, **When** tests read it, **Then** the constants exactly match the MVP risk policy.
- **Given** the default settings, **When** the live-trading test runs, **Then** it asserts `LIVE_TRADING_ENABLED` is `false`.
- **Given** the coding standards, **When** a reviewer inspects history, **Then** these risk-rule tests pre-date any execution-code commit.

---

### MP-101 — Core domain Pydantic models
**Priority:** Must · **Points:** 5 · **Dependencies:** MP-003

**User story**
> As a developer, I want typed Pydantic models for Asset, Bar (OHLCV), Memo, and Signal so that all data is validated at every boundary.

**Description**
Define the core domain models. Memo and Signal must declare **all** required fields from the specification (even if downstream phases populate them), so schemas reject incomplete records early.

**Tasks / Subtasks**
- [ ] `Asset` model (symbol, asset_type∈{stock, etf}, exchange, currency=USD)
- [ ] `Bar` model (symbol, ts, open, high, low, close, volume)
- [ ] `Memo` model with all required fields (memo_id … status)
- [ ] `Signal` model with all required fields (signal_id … created_at)
- [ ] Enums for direction, asset_type, statuses
- [ ] Unit tests: model rejects missing required fields

**Acceptance criteria**
- **Given** the `Memo` model, **When** I instantiate it without `skeptic_view` or `confidence_score`, **Then** validation raises an error.
- **Given** the `Signal` model, **When** I instantiate it without `stop_loss` or `max_risk_pct`, **Then** validation raises an error.
- **Given** an `Asset` with `asset_type="crypto"`, **When** validated, **Then** it is rejected (only stock/etf allowed).
- **Given** a `Bar`, **When** `high < low`, **Then** validation raises an error.

---

### MP-102 — DB schema & migrations
**Priority:** Must · **Points:** 5 · **Dependencies:** MP-002, MP-101

**User story**
> As a developer, I want migrated PostgreSQL/TimescaleDB tables (with hypertables for bars) so that domain data and audit logs persist reliably.

**Description**
Create migrations for assets, bars (TimescaleDB hypertable), memos, signals, and audit_log. Establish the migration tooling (e.g., Alembic).

**Tasks / Subtasks**
- [ ] Configure migration tool (Alembic)
- [ ] `assets` table
- [ ] `bars` hypertable (TimescaleDB `create_hypertable`)
- [ ] `memos` table (with model_version, prompt_version)
- [ ] `signals` table (FK to memos)
- [ ] `audit_log` table (timestamp, event_type, entity_id, severity, payload)
- [ ] Migration up/down tests

**Acceptance criteria**
- **Given** a clean DB, **When** I run migrations, **Then** all tables are created without error.
- **Given** the `bars` table, **When** I inspect it, **Then** it is a TimescaleDB hypertable partitioned on time.
- **Given** a `signal` row, **When** I insert it with a non-existent `memo_id`, **Then** the foreign key constraint rejects it.
- **Given** migrations, **When** I run downgrade then upgrade, **Then** the schema is restored identically.

---

### MP-103 — Asset universe (long-only US stocks/ETFs)
**Priority:** Must · **Points:** 3 · **Dependencies:** MP-102

**User story**
> As an operator, I want a seeded asset universe restricted to US stocks and ETFs so that scope constraints (long-only, no crypto/options) are enforced at the data layer.

**Description**
Seed a curated list of liquid US stocks and ETFs into the `assets` table. Provide a loader that rejects any non-US or non-stock/ETF instrument.

**Tasks / Subtasks**
- [ ] Define seed list (e.g., large-cap US stocks + major ETFs)
- [ ] Seed loader idempotent (re-runnable)
- [ ] Validation: reject asset_type ∉ {stock, etf} and non-USD
- [ ] Unit test for rejection of out-of-scope instruments

**Acceptance criteria**
- **Given** the seed loader, **When** I run it, **Then** the `assets` table contains only US stocks and ETFs.
- **Given** the loader, **When** I attempt to seed a crypto or option instrument, **Then** it is rejected.
- **Given** the loader run twice, **When** I count rows, **Then** there are no duplicates (idempotent).

---

### MP-104 — Mock market-data ingestion
**Priority:** Must · **Points:** 5 · **Dependencies:** MP-102, MP-103

**User story**
> As a developer, I want a deterministic mock OHLCV ingester behind a `MarketDataInterface` so that the entire pipeline runs reproducibly without any external API.

**Description**
Implement `MarketDataInterface` and a `MockMarketDataProvider` that generates deterministic OHLCV bars (seeded) for the seeded universe and persists them to the `bars` hypertable. This satisfies "external APIs behind interfaces."

**Tasks / Subtasks**
- [ ] Define `MarketDataInterface` (abstract)
- [ ] Implement `MockMarketDataProvider` (seeded, deterministic)
- [ ] Generate N days of OHLCV per seeded symbol
- [ ] Persist bars to hypertable
- [ ] Emit audit log events for ingestion runs
- [ ] Unit test: deterministic output for a fixed seed

**Acceptance criteria**
- **Given** a fixed seed, **When** I run ingestion twice, **Then** the generated bars are identical (deterministic).
- **Given** ingestion completes, **When** I query the `bars` table, **Then** each seeded symbol has the expected number of bars.
- **Given** the provider, **When** code references it, **Then** it is consumed only through `MarketDataInterface` (no direct coupling).
- **Given** an ingestion run, **When** it finishes, **Then** an audit-log event with `event_type="ingestion"` is recorded.

---

## 5. Sprint Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| TimescaleDB setup friction in Docker | Blocks MP-102/104 | Use official TimescaleDB image; healthcheck before app starts |
| Over-committing in first sprint | Carryover | MP-104 is the last pull; MP-105/106 explicitly deferred |
| Schema churn after agents start | Rework | Memo/Signal models declare all required fields now (MP-101) |
| Accidental secret commit | Security | MP-004 secret-scan hook + `.env` ignored |

## 6. Sprint Definition of Done

- All committed stories meet their Given/When/Then acceptance criteria.
- `make up` brings the full stack healthy; migrations apply cleanly.
- Risk-rule TDD harness (MP-008) is in place and pre-dates any execution code.
- `LIVE_TRADING_ENABLED=false` verified by an automated test.
- No secrets in the repo; `.env.example` complete.
- CI is green; structured audit logging works end-to-end for ingestion.
