# Observability Policy — Mesa Proprietária com IA

**Status:** MVP / Authoritative
**Scope:** Logging, audit trail, metrics, tracing, health, and alerting.
**Classification:** Internal — Single-Owner Operation
**Last reviewed:** 2026-06-19

> Observability is not just for debugging — it **enforces** the no-trade-on-failure rules. Data, broker, risk-engine, and LLM health are surfaced as gates, and a failed health signal blocks trading.

---

## 1. Logging Contract

Every log entry MUST include at least the following fields:

| Field | Description |
|-------|-------------|
| `timestamp` | ISO-8601 UTC time of the event. |
| `event_type` | Categorical type (e.g. `signal_received`, `risk_decision`, `order_submitted`, `fill`, `data_quality_fail`). |
| `entity_id` | Correlating id (`signal_id`, `order_id`, `memo_id`, symbol). |
| `severity` | `debug` / `info` / `warning` / `error` / `critical`. |

Additional context (mode `paper|live`, reason codes, quantities, prices) is attached as needed.

**Sinks (dual write):**

| Sink | Purpose |
|------|---------|
| JSONL | Append-only, immutable event stream; easy to ship/archive. |
| PostgreSQL | Queryable structured store for dashboards and audit queries. |

Divergence between the two sinks is itself an integrity alert (see security-policy.md §8).

---

## 2. Audit Trail

A complete audit trail is mandatory for **every trading action** and **every AI decision**.

| Record type | Required fields |
|-------------|-----------------|
| Trading action | base contract + order_id, signal_id, mode, side, qty, price, broker_order_id, outcome |
| AI decision | base contract + `model_version`, `prompt_version`, inputs/thesis reference, confidence_score, output |
| Risk decision | base contract + rule evaluated, inputs, `risk_status` outcome (approve/reject:reason) |

Properties:

- **Append-only** — no edits/deletes of trading/AI/risk records.
- **Explainable** — every AI decision is reconstructable; every risk decision reproducible from stored inputs.
- **Traceable** — `model_version` + `prompt_version` link any signal to the exact model/prompt that produced it.

---

## 3. OpenTelemetry-Ready Tracing & Metrics

The system is structured to be OpenTelemetry-ready:

| Signal | Structure |
|--------|-----------|
| Traces | Spans across the pipeline: research → signal → risk → order build → submit → fill → sync → reconcile, correlated by `entity_id`. |
| Metrics | Counters/gauges/histograms emitted via an OTel-compatible interface. |
| Logs | Structured logs correlated to traces via ids. |

Instrumentation is behind a thin interface so the backend (collector/exporter) can be added without code changes to business logic.

---

## 4. Key Metrics

| Metric | Type | Meaning |
|--------|------|---------|
| Data freshness | gauge | Age of latest market data per symbol. |
| Ingestion success rate | counter/ratio | Successful vs failed data ingestions. |
| Agent latency | histogram | Time for AI agents to produce a signal. |
| Signal counts | counter | Signals received / approved / rejected. |
| Risk blocks | counter | Risk rejections by reason code. |
| Paper PnL | gauge | Realized/unrealized PnL in paper mode. |
| Broker health | gauge | Up/down + heartbeat latency. |
| Reconciliation status | gauge | Match / mismatch state. |
| LLM health | gauge | Provider availability + error rate. |

Risk-block counts by reason are first-class signals — a spike in a specific reason (e.g. `data_quality_failure`) indicates an upstream problem.

---

## 5. Health Checks & Alerting

| Check | Healthy when | On failure |
|-------|--------------|------------|
| Data quality/freshness | Latest bars fresh, complete, sane | Block trading (NO TRADE) + alert |
| Broker health | Heartbeat/auth OK | Block trading + alert |
| Risk engine self-check | Config/state confirmed | Block trading + alert |
| LLM provider | Reachable, within error budget | Block dependent signals + alert |
| Reconciliation | Internal == broker truth | Halt new risk + critical alert |

Alerts carry severity and `entity_id` for fast correlation. Critical alerts (kill switch, reconciliation mismatch, live-routing attempt while disabled) are surfaced immediately to the owner.

---

## 6. Dashboards — Streamlit Control Room

The Streamlit control room provides the owner's operational view:

- System status: data / broker / risk / LLM health (red/green gates).
- Trading state: mode (paper/live), kill-switch state, open positions, exposure, daily/weekly PnL.
- Signal flow: received / approved / rejected with reason breakdown.
- Backtest reports and metrics.
- Audit trail browser (read-only).

The dashboard is read/control-only; it never bypasses the risk engine or BrokerInterface.

---

## 7. SLOs (MVP)

| Objective | Target (MVP, indicative) |
|-----------|--------------------------|
| Data freshness | Latest required bar within the configured staleness window during market hours. |
| Ingestion success | ≥ 99% of scheduled ingestions succeed. |
| Health-gate correctness | 100% — any failed gate must block trading (safety SLO; no tolerance). |
| Audit completeness | 100% of trading actions and AI/risk decisions logged. |
| Alert latency | Critical alerts surfaced within seconds of detection. |

The health-gate and audit-completeness SLOs are **safety-critical** and have no error budget — violations are incidents.

---

## 8. Log Retention & Lineage

| Aspect | Policy |
|--------|--------|
| Retention | Trading, AI, and risk records retained long-term (audit value); operational/debug logs retained for a shorter rolling window. |
| Immutability | Append-only; no rewriting history. |
| Lineage | Each signal → memo → AI model/prompt versions → backtest run (engine/data/seed) → risk decision → order → fills are linkable end-to-end via ids. |
| Reproducibility | Stored inputs allow risk decisions and backtests to be re-derived. |

---

## 9. Observability Enforces No-Trade-on-Failure

Observability is the mechanism by which the global fail-closed rule is enforced. Health signals are not advisory — they are **gates** read by the risk engine and order validator:

```
if not data_quality_ok():   block("data_quality_failure")   # NO TRADE
if not broker_healthy():     block("broker_connection_failure") # NO TRADE
if not risk_engine_ok():     block("risk_engine_unavailable")   # NO TRADE
if not llm_healthy():        block("llm_uncertainty")           # NO TRADE for dependent signals
```

If any of data quality, broker, risk engine, or LLM provider is unhealthy, the corresponding gate fails and the trade is blocked. Surfacing these states (metrics, health checks, alerts, dashboard) is therefore a **safety control**, not merely operational tooling.
