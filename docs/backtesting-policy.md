# Backtesting Policy — Mesa Proprietária com IA

**Status:** MVP / Authoritative
**Scope:** Hypothesis validation before paper and (future) live trading.
**Classification:** Internal — Single-Owner Operation
**Last reviewed:** 2026-06-19

> Backtesting is a **gate**, not a marketing tool. When a signal sets `requires_backtest=true`, a failed or missing backtest result blocks the trade. No guaranteed-performance claims are made or implied.

---

## 1. Purpose

- Validate trading hypotheses with historical evidence **before** they reach paper or live execution.
- Provide the risk engine with a deterministic pass/fail input (`requires_backtest`, backtest result).
- Quantify expected behavior (return, risk, drawdown) so sizing and exposure decisions rest on evidence, not AI confidence alone.

Backtesting never authorizes a trade by itself; it can only **clear** the backtest gate. All other risk checks still apply.

---

## 2. Engine Approach

| Stage | Engine | Rationale |
|-------|--------|-----------|
| MVP | Custom lightweight engine | Full control, transparency, reproducibility; minimal dependencies. |
| Later | Extended/optimized engine | Only after the lightweight engine is trusted and validated. |

The custom engine operates on Parquet + DuckDB historical data, is deterministic given a seed, and emits a structured report consumed by the risk engine.

---

## 3. Walk-Forward Methodology

To avoid fitting to a single period, the engine uses walk-forward evaluation:

```
|---- in-sample (train/select) ----|-- out-of-sample (test) --|
      window 1 ............................ test 1
              window 2 ............................ test 2
                      window 3 ............................ test 3   (rolling)
```

- Parameters/decisions are formed on the in-sample window only.
- Performance is measured on the **out-of-sample** window the model did not see.
- Windows roll forward to produce a series of out-of-sample results.
- Acceptance is judged primarily on aggregated out-of-sample metrics.

---

## 4. Data Requirements & Minimum History

| Requirement | Rule |
|-------------|------|
| Source | Parquet + DuckDB historical store. |
| Minimum history | Each symbol must have ≥ the configured minimum bars. **Insufficient history → block** (mirrors the risk engine's `insufficient_price_history`). |
| Completeness | No gaps beyond tolerance in the required window. |
| Quality | Passes the same data-quality checks as live (freshness not required for history, but sanity/completeness are). |
| Universe | Restricted to the MVP universe (SPY, QQQ, IWM, DIA, XLK, XLF, XLE, XLI, XLV, XLY, XLP, AAPL, MSFT, NVDA, AMZN, META, GOOGL, TSLA, JPM, V, MA). |

A backtest that cannot meet data requirements **fails closed** — it does not silently proceed on partial data.

---

## 5. Cost Modeling — Slippage & Commission

Realistic frictions are mandatory; ignoring them produces misleading results.

| Cost | Model |
|------|-------|
| Commission | Per-share or per-trade commission consistent with the broker (IBKR-style). |
| Slippage | Modeled adverse fill vs reference price (e.g. a configured bps or spread-based estimate). |
| Spread | Entries/exits cross a modeled bid-ask spread. |

These assumptions must match the paper-trading simulator so paper and backtest results are comparable.

---

## 6. Metrics

| Metric | Definition |
|--------|------------|
| CAGR | Compound annual growth rate of equity. |
| Sharpe | Risk-adjusted return (excess return ÷ volatility). |
| Max Drawdown | Largest peak-to-trough equity decline. |
| Win Rate | Fraction of trades closed profitably. |
| Profit Factor | Gross profit ÷ gross loss. |
| Exposure | Average fraction of capital deployed / time in market. |

Metrics are reported on out-of-sample data and aggregated across walk-forward windows.

---

## 7. Pass/Fail Acceptance Thresholds (Signal Gate)

A strategy/signal **passes** the backtest gate only if it meets the configured acceptance thresholds. Thresholds are configuration-driven and version-controlled; representative MVP floors:

| Metric | Acceptance (representative) |
|--------|-----------------------------|
| Sharpe | ≥ configured minimum (positive, risk-adjusted) |
| Max Drawdown | ≤ configured maximum |
| Profit Factor | > 1.0 by a configured margin |
| Win Rate | ≥ configured minimum |
| Sample size | ≥ minimum number of trades for significance |

Outcomes feeding the risk engine:

| Result | Effect |
|--------|--------|
| Pass | Backtest gate cleared; risk engine continues other checks. |
| Fail | `backtest_failure` → **REJECT** (NO TRADE). |
| Missing while `requires_backtest=true` | **REJECT** (NO TRADE). |

---

## 8. Avoiding Bias

| Bias | Mitigation |
|------|------------|
| **Look-ahead** | Only data available at decision time is used; indicators computed strictly on past bars; no future bar leaks into a decision; signals act on the next bar after they form. |
| **Survivorship** | Use a universe/history that does not silently drop delisted/removed names where applicable; the fixed MVP universe is documented and its constituents declared. |
| **Overfitting** | Walk-forward out-of-sample evaluation; minimum sample size; thresholds judged on unseen data. |
| **Data snooping** | Limit repeated re-tuning on the same out-of-sample window; record parameter/prompt versions. |

---

## 9. Reproducibility & Seeding

- All stochastic components use a fixed, recorded **random seed**.
- Engine version, data snapshot/version, parameters, seed, and cost assumptions are stored with every run.
- Re-running with the same inputs must reproduce the same metrics and pass/fail outcome.
- AI-derived inputs are recorded with `model_version` and `prompt_version` so a result can be traced to the exact thesis that produced it.

---

## 10. Reports

Each backtest emits a structured report containing:

- Run metadata: id, timestamp, engine version, data version, seed, cost model.
- Strategy/signal reference: `signal_id`, `memo_id`, `model_version`, `prompt_version`.
- Per-window and aggregated metrics (Section 6).
- Pass/fail decision and the thresholds applied.
- Equity curve and trade list (artifacts).

Reports are persisted and surfaced in the Streamlit control room and the audit trail.

---

## 11. How Backtest Results Feed the Risk Engine

```
backtest run → report (metrics + pass/fail) → stored result keyed by signal/strategy
                                              │
signal (requires_backtest=true) ─────────────┘
                                              ▼
                                  risk engine reads result
                                  ├─ pass    → continue checks
                                  ├─ fail    → block("backtest_failure")
                                  └─ missing → block("backtest_failure")
```

The risk engine treats the backtest as a **necessary but not sufficient** condition: passing clears one gate; sizing, exposure, drawdown, data-quality, broker-health, earnings, and live gates must all still pass (see risk-policy.md).
