# Mesa Proprietária com IA

**Proprietary AI-powered trading desk** — research, signal generation, backtesting,
and **paper trading** for the **owner's own capital only**.

> This is **not** an investment fund, advisory service, or third-party money
> manager. It provides **no financial advice** and makes **no performance
> guarantees**. It is software architecture and automation infrastructure.

## Safety model (read this first)

- **AI proposes, deterministic code disposes.** AI agents may research, debate,
  and produce investment memos and proposed signals. They **never** execute
  trades.
- **The risk engine has final authority** — higher than any AI agent. A trade is
  allowed only if the deterministic risk engine approves it.
- **Live trading is disabled by default** (`LIVE_TRADING_ENABLED=false`) and is
  **not implemented** in this MVP. The default and only execution mode is
  **paper**.
- **Fail closed.** If data quality, the broker, the risk engine, or the LLM
  provider fails, the system does **not** trade.
- **MVP scope is long-only US stocks & ETFs.** No leverage, options, crypto, or
  short selling.

## What's in this Sprint 1 foundation

| Area | Module(s) |
|------|-----------|
| Config & safety flags | `app/config.py`, `.env.example` |
| Structured JSONL audit logging | `core/logging.py`, `core/events.py` |
| Domain schemas (Pydantic) | `data/market_schema.py`, `memos/memo_schema.py`, `signals/signal_schema.py`, `execution/order_schema.py`, `portfolio/positions.py`, `risk/policy.py` |
| Repository interfaces + in-memory impls | `data/storage/base.py`, `data/storage/memory.py`, `data/storage/postgres.py` (stub) |
| Mock market-data ingestion | `data/ingestion/prices.py` |
| Features | `features/technical_indicators.py`, `features/volatility.py`, `features/momentum.py`, `features/liquidity.py` |
| **Deterministic risk engine** | `risk/policy.py`, `risk/rules.py`, `risk/position_sizing.py`, `risk/risk_engine.py`, `risk/kill_switch.py` |
| FastAPI app | `app/main.py`, `api/routes/*` |
| Tests | `tests/unit/*`, `tests/integration/*` |
| BMAD planning docs | `docs/*.md` |

> **Not yet implemented (by design):** real broker execution, Interactive Brokers
> connection, live trading, the paper-fill simulator, the agent LLM calls, and
> the backtesting engine. Those arrive in later phases (see `docs/mvp-roadmap.md`).

## Requirements

- Python **3.12** (the code also runs on 3.11 for local development)
- No database or broker required for the MVP — it runs on in-memory repositories.

## Local setup

```bash
# 1. (recommended) create a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. install the project + dev tools
pip install -e ".[dev]"

# 3. create your local env file (never commit .env)
cp .env.example .env
#   LIVE_TRADING_ENABLED stays false. EXECUTION_MODE stays paper.
```

## Run the tests

```bash
pytest                 # full suite
pytest -v              # verbose
pytest tests/unit/test_risk_rules.py   # just the risk-engine guarantees
```

The suite proves, among other things, that **invalid, incomplete, oversized, and
otherwise risky signals are blocked** by the deterministic risk engine, and that
schema validation rejects malformed signals before they ever reach it.

## Run the API locally

```bash
uvicorn app.main:app --reload
```

Then open:

- http://127.0.0.1:8000/        — root + safety status
- http://127.0.0.1:8000/health  — liveness + `live_trading_enabled` readout
- http://127.0.0.1:8000/docs    — interactive OpenAPI docs

Key endpoints: `GET /health`, `GET/POST /memos`, `GET/POST /signals`,
`GET /risk/policy`, `POST /risk/evaluate` (deterministic approve/block with
reasons), `GET /orders` & `GET /portfolio` (safety-forward placeholders).

## Run mock ingestion

```bash
python scripts/run_ingestion.py --days 120 --seed 42
# or:  python -m scripts.run_ingestion
```

Generates deterministic synthetic OHLCV for the 21-symbol universe and prints
SMA20 / RSI14 / ATR14 / liquidity per symbol. **No network or broker is
contacted.**

## Run the managed cycle (entry → manage → exit)

```bash
python scripts/run_managed_cycle.py --seed 42 --days 180 --holdout 30
```

Enters paper positions on a warmup window, then manages each to its stop,
target, or time stop over a held-out window, printing a trade journal (round
trips, PnL, R-multiples) and an equity-curve summary (total return, max
drawdown). Paper only — live trading is disabled.

## Run the multi-day simulation (with drawdown halting)

```bash
python scripts/run_simulation.py --seed 42 --days 180 --warmup 60
```

Walks day-by-day over the whole period: marks and manages open positions,
**halts new entries when the daily (2%) or weekly (5%) loss limit is breached**
(engaging the kill switch), and enters approved signals otherwise — using only
data available up to each day (no look-ahead). Reports entries/exits, halt days,
total return, and max drawdown. Paper only.

## Docker (optional, Phase 1+)

`docker-compose.yml` defines PostgreSQL/TimescaleDB and Redis for when the
PostgreSQL backend is enabled. The MVP does **not** require them.

## Planning documents

The full BMAD planning set lives in [`docs/`](./docs): project brief, PRD,
system/technical/data/agent architecture, risk/execution/backtesting/security/
observability policies, MVP roadmap, backlog, Sprint 1 stories, acceptance
criteria, and the development plan.
