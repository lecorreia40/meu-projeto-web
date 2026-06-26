# Execution Policy — Mesa Proprietária com IA

**Status:** MVP / Authoritative
**Scope:** Order routing and broker execution for the owner's own capital.
**Classification:** Internal — Single-Owner Operation
**Last reviewed:** 2026-06-19

> AI agents propose; they MUST NOT execute. The order layer only acts on a risk-approved signal. No order is ever built or sent without a positive `risk_status = approved`.

---

## 1. Execution Modes

| Mode | Default | Description |
|------|---------|-------------|
| **Paper** | ✅ `paper_trading_default=true` | Simulated fills against live/market data. The only mode used in MVP. |
| **Live** | ❌ `live_trading_default=false`, `LIVE_TRADING_ENABLED=false` | Real money. Disabled by default; gated by readiness checklist (Phase 12). Stays disabled in MVP. |

The execution layer reads the target mode from configuration and re-validates it against the risk engine on every order. A mismatch (e.g. order targets live while disabled) is blocked and alerted.

---

## 2. BrokerInterface Abstraction

**Every** broker action — connect, get account, get positions, submit order, cancel order, get fills, reconcile — goes through a single `BrokerInterface` abstraction. No code calls a broker SDK directly.

Why:

| Reason | Benefit |
|--------|---------|
| Uniform contract | Paper and live adapters are interchangeable; the rest of the system is mode-agnostic. |
| Single choke point | One place to enforce logging, idempotency, the live gate, and the kill switch. |
| Testability | Paper/mock adapters allow deterministic testing without a real broker. |
| Safety | External broker calls are isolated behind an interface (coding/security standard). |

Adapters in MVP:

- `PaperTradingAdapter` — default; internal simulator.
- `IBKRPaperAdapter` — Interactive Brokers paper account.
- (`IBKRLiveAdapter` — exists only behind the disabled live gate; not used in MVP.)

```
BrokerInterface
  ├─ connect() / health_check()
  ├─ get_account() / get_positions()
  ├─ submit_order(order) -> broker_order_id
  ├─ cancel_order(broker_order_id)
  └─ get_fills(broker_order_id)
```

---

## 3. Order Lifecycle

```
signal approved → order build → order_validator → submit → fill_handler → portfolio_sync → reconciliation
```

| Stage | Responsibility | Failure behavior |
|-------|----------------|------------------|
| **Signal approved** | Risk engine returned `approved` with computed share count. | If not approved → no order. |
| **Order build** | Construct a normalized order from the approved signal (symbol, side=buy, qty, type, stop). Attach idempotency key. | Build error → abort, log, no submit. |
| **order_validator** | Final deterministic checks (Section 6) before any broker call. | Any failure → reject, NO TRADE. |
| **Submit** | Send via BrokerInterface in the configured mode. | Broker error/down → NO TRADE, log, alert. |
| **fill_handler** | Process fills/partials; update order state. | Reconciliation discrepancy → flag. |
| **portfolio_sync** | Update positions, exposure, realized/unrealized PnL, risk state. | Sync error → flag, halt new risk. |
| **reconciliation** | Compare intended vs broker truth (orders, positions, cash). | Mismatch → flag + alert; block further trading until resolved. |

---

## 4. Order Types (MVP)

| Allowed | Disallowed |
|---------|------------|
| Long-only buys (open) and corresponding sells (close) | Short selling |
| Market & limit entries | Options |
| Protective stop-loss orders | Crypto |
| — | Leverage / margin |

Every open position must carry a protective stop derived from the signal's `stop_loss`. Orders that would create or rely on a disallowed instrument are rejected upstream by the risk engine and again by the order validator.

---

## 5. Paper-Trading Simulator Behavior

The default `PaperTradingAdapter`:

- Prices fills against current market data (last/bid/ask) with modeled slippage and commission consistent with the backtesting assumptions.
- Supports partial fills and realistic latency where feasible.
- Maintains a simulated cash and position ledger reconciled the same way as live.
- Never touches real funds; clearly tagged `mode=paper` in every log and order record.

### IBKR Paper Adapter

`IBKRPaperAdapter` routes to an Interactive Brokers **paper** account through the same `BrokerInterface`. It exercises the real broker API path (auth, session, order submission, fills) without real-money risk, validating integration before any future live consideration.

---

## 6. Order Validation Rules

Performed by `order_validator` immediately before submission:

| Rule | Reject if |
|------|-----------|
| Approval present | `risk_status != approved` |
| Side | side is not `buy`/`sell-to-close` (no short) |
| Symbol | symbol not in MVP universe |
| Quantity | qty ≤ 0 or non-integer |
| Notional vs sizing | notional ≠ approved size (tamper check) |
| Stop attached | opening order without protective stop |
| Mode gate | target=live while `LIVE_TRADING_ENABLED=false` |
| Broker health | broker health check not green |
| Idempotency | idempotency key already seen (duplicate) |
| Kill switch | system in NO-TRADE state |

---

## 7. Failure Handling — Broker Down → No Trade

If the broker is unreachable, unauthenticated, or fails its health check:

1. No order is submitted (**NO TRADE**).
2. A high-severity event is logged and an alert is surfaced.
3. The system remains in NO-TRADE until broker health is restored and confirmed.
4. In-flight orders are reconciled on recovery before new risk is accepted.

This mirrors the global fail-closed rule: data quality, broker, risk engine, or LLM failure ⇒ no trade.

---

## 8. Reconciliation & Fill Handling

| Activity | Description |
|----------|-------------|
| Fill handling | Apply full/partial fills to order and position state; compute realized PnL on closes. |
| Position reconciliation | Compare internal positions to broker-reported positions each cycle and after every fill. |
| Cash reconciliation | Compare internal cash to broker-reported balance. |
| Discrepancy handling | On any mismatch: flag, log high severity, block new trading, require human review. |

Broker state is treated as the source of truth for what actually executed; internal state is corrected to match and the discrepancy is recorded.

---

## 9. Idempotency & Duplicate-Order Prevention

- Every order carries a deterministic **idempotency key** derived from `signal_id` + intended action.
- The order validator and BrokerInterface reject any order whose key has already been submitted.
- Retries reuse the same key so a retry never creates a second position.
- Fill events are deduplicated by broker order id + fill id.

This prevents the classic double-submit on timeout/retry, which is critical with real-money risk later.

---

## 10. LIVE_TRADING_ENABLED Gating & Readiness Checklist

`LIVE_TRADING_ENABLED` is a global, default-`false` flag. It is checked by the risk engine, the order validator, and the BrokerInterface independently (defense in depth). Live trading is a **Phase 12** milestone and **remains disabled in MVP**.

### Readiness Checklist (all must be true to even consider enabling live — still disabled in MVP)

| # | Item |
|---|------|
| 1 | Extended paper-trading track record reviewed by the owner. |
| 2 | Reconciliation proven exact over the paper period (no unresolved discrepancies). |
| 3 | Kill switch tested and verified to halt trading. |
| 4 | All risk gates verified green and reproducible. |
| 5 | Broker live credentials stored only via secrets management (no repo, no hardcoding). |
| 6 | Idempotency/duplicate-prevention verified under retry/timeout. |
| 7 | Backtest acceptance thresholds met for active strategies. |
| 8 | Observability/alerting confirmed for broker, data, risk, and LLM health. |
| 9 | Explicit owner decision recorded in the audit log. |
| 10 | Risk engine confirms the live gate consistent on every order at enablement. |

Any single failed item ⇒ live stays disabled and the system reverts to paper.

---

## 11. Logging of Every Trading Action

Per the coding/observability standard, every trading action is logged with at least: `timestamp, event_type, entity_id (signal_id/order_id), severity`, plus mode (`paper`/`live`), broker order id, quantities, prices, and outcome. Logs are written to JSONL and PostgreSQL and are append-only. See observability-policy.md for the full logging contract and audit trail.
