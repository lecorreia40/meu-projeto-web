# Project Brief — Mesa Proprietária com IA (Proprietary AI-Powered Trading Desk)

> **BMAD Method Artifact — Business Analyst**
> Status: Draft v1.0 · Date: 2026-06-19 · Owner: Owner-Operator (sole stakeholder)

---

## 1. Executive Summary

**Mesa Proprietária com IA** is a proprietary, AI-assisted trading desk built to research, analyze, simulate, and (eventually, under strict controls) execute trades using **exclusively the owner's own capital**. The system orchestrates a swarm of specialized AI agents that research markets, debate theses, and propose trade signals. Crucially, **AI agents never execute trades directly**. Every proposed action flows through a deterministic pipeline of signal validation, backtesting/simulation, hard risk limits, order validation, and a broker execution layer — with full logging, auditability, and human supervision.

The product is **automation and decision-support infrastructure for a single operator's personal capital**. It is explicitly **not** an investment fund, **not** an advisory service, **not** third-party money management, and it provides **no financial advice and no performance guarantees**.

The MVP focuses on the safest possible scope: research, backtesting, and **paper trading** on a curated universe of liquid, long-only US stocks and ETFs — with **live trading disabled by default** and gated behind an explicit readiness checklist.

---

## 2. Problem Statement

An individual operator managing personal capital faces several structural problems:

1. **Cognitive bandwidth limits.** A single person cannot continuously monitor markets, news, fundamentals, technicals, and macro conditions across many instruments.
2. **Behavioral and emotional bias.** Discretionary trading is prone to overconfidence, anchoring, recency bias, fear, and greed — leading to inconsistent and unvalidated decisions.
3. **Lack of rigor.** Theses are often acted on without structured criticism, without backtesting, and without deterministic risk control.
4. **Weak auditability.** Manual trading produces little explainable record of *why* a decision was made, making post-mortems and improvement difficult.
5. **Unbounded risk.** Without hard, machine-enforced limits, a single bad day or a runaway automation can cause outsized losses.
6. **Dangerous automation.** Naively letting an LLM "trade" directly is unsafe: models hallucinate, lack determinism, and cannot be trusted with execution authority.

**The core problem:** How can a single owner-operator harness AI for rigorous, multi-perspective market research and signal generation while guaranteeing that **no AI ever executes a trade**, that **deterministic risk controls are supreme**, and that **every decision is logged and explainable**?

---

## 3. Project Vision & Goals

### 3.1 Vision

A disciplined, auditable, AI-augmented trading desk that thinks like a research team and acts like a risk officer — where intelligence proposes, deterministic logic disposes, and the human supervises. The owner gains the leverage of a tireless multi-analyst research swarm without surrendering control or safety.

### 3.2 Goals

| Goal ID | Goal | Description |
|---------|------|-------------|
| G-01 | Multi-agent research | Run a swarm of specialized AI agents that research, debate, and criticize market theses. |
| G-02 | Structured signals | Convert qualitative theses into structured, validated, machine-readable signals. |
| G-03 | Evidence before action | Backtest and simulate every hypothesis before any (paper) execution. |
| G-04 | Deterministic risk supremacy | Enforce hard, deterministic risk limits that outrank all AI agents. |
| G-05 | Safe execution | Execute only through paper trading first, via a broker API layer, with live trading disabled by default. |
| G-06 | Full auditability | Log every trading action and make every AI decision explainable. |
| G-07 | Fail-safe operation | Halt all trading whenever data, broker, risk engine, or LLM provider fails. |
| G-08 | Owner-only operation | Operate exclusively the owner's own capital — never third-party money. |

---

## 4. Scope

### 4.1 In Scope (MVP)

- Research and signal generation for **long-only US-listed stocks and ETFs** (curated universe of 21 instruments).
- Mock/real market data ingestion, normalization, and quality checks.
- Feature/indicator computation (returns, volatility, ATR, RSI, moving averages, liquidity).
- Multi-agent research swarm (8 agents) producing investment memos.
- Signal engine converting memos into validated structured signals.
- Custom lightweight backtesting and simulation engine.
- Deterministic portfolio & risk engine with hard limits.
- Paper execution simulator and Interactive Brokers **paper-only** adapter.
- Streamlit control-room dashboard.
- Monitoring, structured logs, and an audit trail.
- A live-trading readiness checklist (kept disabled).

### 4.2 Out of Scope (MVP)

| Excluded | Rationale |
|----------|-----------|
| Live trading at launch | Safety: research → backtest → paper first. Disabled by default. |
| Leverage / margin | No leverage in MVP risk policy. |
| Options | Out of MVP asset scope. |
| Crypto | Out of MVP asset scope. |
| Short selling | Long-only MVP. |
| Non-US / illiquid assets | Universe restricted to liquid US stocks & ETFs. |
| Third-party capital | System operates the owner's own capital only. |
| Financial advice / advisory features | Infrastructure only; no advice, no guarantees. |
| Multi-user / accounts / roles | Single owner-operator only. |
| Next.js production UI | Deferred; Streamlit is the MVP dashboard. |

---

## 5. Stakeholders & Personas

| Stakeholder | Role | Interest |
|-------------|------|----------|
| Owner-Operator | Sole user, capital owner, supervisor, final human authority | Wants rigorous, safe, auditable augmentation of personal trading decisions. |
| (System) Risk Engine | Non-human deterministic authority | Holds final veto power over all signals; outranks every AI agent. |
| (System) AI Agent Swarm | Non-human advisors | Research, debate, and propose — never execute. |

### 5.1 Primary Persona — "The Owner-Operator"

- **Who:** A single individual trading **their own capital** (no clients, no fund, no third parties).
- **Goals:** Make disciplined, evidence-backed decisions; reduce emotional/behavioral bias; retain full control and a clear audit trail.
- **Needs:** Multi-perspective research, structured signals, backtests, hard risk limits, paper trading before any live risk, and explainability.
- **Pain points:** Limited time/attention, susceptibility to bias, fear of runaway automation, desire for safety and reversibility.
- **Authority:** Supervises the system, reconfigures it deliberately, and is the only human who can ever enable live trading (and only after the readiness checklist passes).

---

## 6. Success Metrics / KPIs

| KPI ID | Metric | Target (MVP) |
|--------|--------|--------------|
| K-01 | Pipeline completeness | 100% of the end-to-end flow (ingest → features → memo → signal → backtest → risk → paper order → dashboard) operational. |
| K-02 | Safety enforcement | 100% of invalid, oversized, incomplete, or risky trades blocked by tests. |
| K-03 | Explainability coverage | 100% of AI decisions carry an explainable rationale. |
| K-04 | Audit coverage | 100% of trading actions logged with full audit trail. |
| K-05 | Fail-safe correctness | 100% of induced failures (data/broker/risk/LLM) halt trading. |
| K-06 | Live-trading lockout | Live trading remains disabled unless explicitly reconfigured. |
| K-07 | Signal validity | 0 signals accepted with missing required fields. |
| K-08 | Risk authority integrity | 0 trades executed against risk-engine rejection. |

> Note: KPIs measure **system correctness, safety, and discipline** — not financial returns. No performance or profitability guarantees are made or implied.

---

## 7. Key Risks & Mitigations

| Risk ID | Risk | Impact | Mitigation |
|---------|------|--------|------------|
| R-01 | AI hallucination drives bad decisions | High | AI cannot execute; deterministic validation, backtest, and risk gates; Skeptic/Red Team agent. |
| R-02 | Runaway automation / unintended live trade | Critical | Live trading disabled by default; paper default; explicit reconfiguration required; hard limits. |
| R-03 | Risk limits bypassed | Critical | Risk engine authority is supreme and deterministic; rejection blocks execution unconditionally. |
| R-04 | Poor data quality | High | Quality checks; "if data quality fails, no trade." |
| R-05 | Broker API failure mid-flow | High | "If broker API fails, no trade"; fail-safe halt. |
| R-06 | LLM provider outage | Medium | "If LLM provider fails, no trade"; mock-LLM development path. |
| R-07 | Over-fitting in backtests | Medium | Treat backtests as evidence, not proof; conservative interpretation; no performance guarantees. |
| R-08 | Regulatory misperception | High | Strictly owner's own capital; no advice; no third-party money; documentation makes scope explicit. |
| R-09 | Incomplete/oversized signals | High | Required-field validation; reject if fields missing; size caps enforced. |
| R-10 | Audit gaps | Medium | Every action logged (JSONL + PostgreSQL); OpenTelemetry-ready. |

---

## 8. Assumptions & Constraints

### 8.1 Assumptions

- The owner operates **only their own capital**.
- The MVP runs locally via Docker Compose for a single operator.
- Mock data and a mock LLM are acceptable for early phases.
- Interactive Brokers paper trading is the first broker integration.
- The owner is the sole human supervisor and decision authority.

### 8.2 Constraints (Hard Safety & Scope Rules)

1. Do not implement live trading first.
2. Start with research, backtesting, paper trading.
3. No leverage in MVP.
4. No options in MVP.
5. No crypto in MVP.
6. No short selling in MVP.
7. MVP is long-only US stocks and ETFs.
8. Every trading action must be logged.
9. Every AI decision must be explainable.
10. Every signal rejected if required fields missing.
11. Risk engine authority is higher than all AI agents.
12. If data quality fails, no trade.
13. If broker API fails, no trade.
14. If risk engine fails, no trade.
15. If LLM provider fails, no trade.
16. Live trading disabled by default.
17. Paper trading is default execution mode.
18. Software architecture/automation infrastructure only — must not provide financial advice or guaranteed performance claims.

### 8.3 Technology Constraints

Python 3.12; FastAPI; Pydantic; PostgreSQL; TimescaleDB or PG schema optimized for OHLCV; Redis; Celery or Temporal; Parquet + DuckDB; LangGraph; pgvector or Qdrant; custom lightweight backtest engine first (Backtrader optional later); Interactive Brokers paper trading; Streamlit (MVP), Next.js + FastAPI later; JSONL + PostgreSQL logs; OpenTelemetry-ready; Docker Compose for MVP.

---

## 9. MVP Asset Universe

Long-only, US-listed, liquid stocks and ETFs:

`SPY, QQQ, IWM, DIA, XLK, XLF, XLE, XLI, XLV, XLY, XLP, AAPL, MSFT, NVDA, AMZN, META, GOOGL, TSLA, JPM, V, MA`

---

## 10. Glossary of Domain Terms

| Term | Definition |
|------|------------|
| Proprietary trading desk | A setup that trades only the owner's own capital. |
| Investment memo | Structured document summarizing a thesis, agent debate, and rationale. |
| Signal | A structured, machine-readable trade proposal derived from a memo. |
| Backtesting | Simulating a strategy/signal over historical data to validate a hypothesis. |
| Paper trading | Simulated execution with no real capital at risk; the MVP default. |
| Risk engine | Deterministic component enforcing hard limits; supreme authority over AI. |
| OMS | Order Management System; manages order lifecycle and execution. |
| OHLCV | Open, High, Low, Close, Volume — core market data fields. |
| ATR | Average True Range — a volatility measure. |
| RSI | Relative Strength Index — a momentum oscillator. |
| Feature store | Repository of computed indicators/features for instruments. |
| RAG | Retrieval-Augmented Generation — grounding LLM output in retrieved knowledge. |
| Agent swarm | A coordinated set of specialized AI agents. |
| Skeptic / Red Team | Agent that argues against every thesis. |
| Orchestrator | Agent that coordinates the workflow and writes the final memo. |
| Readiness checklist | Gate that must pass before live trading could ever be enabled. |
| Fail-safe | Default-to-no-trade behavior on any critical failure. |
