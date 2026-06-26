# Risk Policy — Mesa Proprietária com IA

**Status:** MVP / Authoritative
**Scope:** Proprietary AI trading desk operating ONLY the owner's own capital.
**Classification:** Internal — Single-Owner Operation
**Last reviewed:** 2026-06-19

> This is not a fund, advisory, or managed-account service. Nothing here constitutes financial advice or a guarantee of performance. The desk trades exclusively the owner's own capital.

---

## 1. Governing Principles

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Risk Engine Supremacy** | The deterministic Risk Engine has authority **higher than all AI agents**. No agent, prompt, or model output can override, bypass, or relax a risk decision. |
| 2 | **AI proposes, never executes** | AI agents may research, generate theses, and emit signals. They MUST NOT place, modify, or cancel orders. Execution only happens after the deterministic pipeline approves. |
| 3 | **Deterministic, not probabilistic** | Risk checks are rule-based, reproducible, and explainable. The same inputs always produce the same risk decision. No LLM is in the risk-decision path. |
| 4 | **Fail closed → NO TRADE** | If data quality, broker, risk engine, or LLM provider fails, the system blocks the trade. Absence of a positive approval is a rejection. |
| 5 | **Paper-first, live-disabled** | Paper trading is the default. Live trading is disabled by default and gated behind explicit, governed override. |
| 6 | **Total auditability** | Every signal carries a `risk_status`. Every risk decision is logged with inputs, the rule that fired, and the outcome. |

The execution pipeline is strictly ordered and each stage can only **reduce** permission, never grant beyond the prior stage:

```
AI signal → deterministic validation → backtest/simulation → risk limits → order validation → broker layer
```

---

## 2. Risk Parameter Table (MVP)

All values are configuration-driven and version-controlled. Changing any value is a governed action (Section 11).

| Parameter | Value | Unit | Rationale |
|-----------|-------|------|-----------|
| `max_risk_per_trade_pct` | 1.0 | % of equity | Caps loss on any single idea so no one trade is materially damaging. |
| `max_position_size_pct` | 2.0 | % of equity | Limits concentration in a single symbol regardless of stop distance. |
| `max_daily_loss_pct` | 2.0 | % of equity | Daily circuit breaker; halts new risk after a bad day. |
| `max_weekly_loss_pct` | 5.0 | % of equity | Weekly circuit breaker; protects against sustained drawdown. |
| `max_open_positions` | 3 | count | Keeps the book small and supervisable in MVP. |
| `max_total_exposure_pct` | 20.0 | % of equity | Caps aggregate market exposure; keeps most capital in cash early. |
| `allow_short` | false | bool | No shorting in MVP. |
| `allow_options` | false | bool | No options in MVP. |
| `allow_crypto` | false | bool | No crypto in MVP. |
| `allow_leverage` | false | bool | Cash, long-only; no margin amplification. |
| `paper_trading_default` | true | bool | Default execution mode. |
| `live_trading_default` | false | bool | Live disabled until governed enablement (Phase 12). |

### Asset Universe (MVP)

Long-only US stocks & ETFs:

`SPY, QQQ, IWM, DIA, XLK, XLF, XLE, XLI, XLV, XLY, XLP, AAPL, MSFT, NVDA, AMZN, META, GOOGL, TSLA, JPM, V, MA`

Any symbol outside this list is rejected at validation.

---

## 3. Position Sizing Methodology

Sizing is **risk-first**: the stop defines how much capital is at risk, then size is derived and capped.

```
risk_capital      = equity * max_risk_per_trade_pct        # e.g. 1.0%
stop_distance      = abs(entry_price - stop_loss)
raw_shares         = floor(risk_capital / stop_distance)
position_value     = raw_shares * entry_price

# Hard cap by position size
max_position_value = equity * max_position_size_pct        # e.g. 2.0%
if position_value > max_position_value:
    raw_shares     = floor(max_position_value / entry_price)

final_shares       = raw_shares
```

Rules:

- A signal **must** include a valid `stop_loss`. No stop → reject (cannot compute risk).
- `stop_distance` of zero or negative → reject.
- The **smaller** of the risk-based and size-based limits always wins.
- Final position must also respect `max_total_exposure_pct` and `max_open_positions` (Section 4).
- Fractional shares are not used in MVP; round down.

---

## 4. Exposure Limits & Max Open Positions

| Control | Limit | Check |
|---------|-------|-------|
| Single-position size | ≤ `max_position_size_pct` (2.0%) | New position value ÷ equity |
| Total exposure | ≤ `max_total_exposure_pct` (20.0%) | (Sum of open positions + new) ÷ equity |
| Open position count | ≤ `max_open_positions` (3) | Count of distinct open positions + 1 |

A new trade is blocked if it would breach **any** of the above. Adding to an existing position counts toward both single-position and total-exposure limits.

---

## 5. Drawdown Controls & Kill Switch

### 5.1 Loss Limits

| Window | Limit | Behavior on breach |
|--------|-------|--------------------|
| Daily | `max_daily_loss_pct` = 2.0% | Block all **new** risk for the remainder of the session. Existing stops remain active. |
| Weekly | `max_weekly_loss_pct` = 5.0% | Block all new risk for the remainder of the week; require human review before resuming. |

Loss is measured against the equity baseline at the start of the window (realized + unrealized mark-to-market).

### 5.2 Kill Switch

The kill switch is a hard, deterministic control that immediately:

1. Sets the system to **NO-TRADE** (no new orders accepted by the order layer).
2. Cancels working (unfilled) orders via the broker interface where possible.
3. Leaves existing protective stops in place (does not blindly flatten in MVP).
4. Emits a high-severity audit event and surfaces an alert.

Triggers: weekly loss breach, broker health failure, risk-engine self-check failure, data-quality collapse, or manual owner activation. The kill switch **fails closed**: if its own state cannot be confirmed, the system behaves as if engaged.

---

## 6. Risk Engine Block-List

The Risk Engine **must block** any signal/order matching the following. This list is exhaustive for MVP; any condition not provably clear results in a block.

| Condition | Check | Action |
|-----------|-------|--------|
| Missing signal fields | All required fields present & typed (Section 9) | REJECT |
| Low liquidity | Avg volume / ADV below threshold | REJECT |
| High spread | Bid-ask spread above threshold | REJECT |
| Insufficient price history | History length < minimum bars required | REJECT |
| Data quality failure | Freshness/completeness/sanity checks fail | REJECT (NO TRADE) |
| Backtest failure | `requires_backtest` true and backtest not passed | REJECT |
| Position size above limit | size > `max_position_size_pct` | REJECT |
| Daily loss limit breach | session loss ≥ `max_daily_loss_pct` | REJECT (halt new risk) |
| Weekly loss limit breach | week loss ≥ `max_weekly_loss_pct` | REJECT + human review |
| Max open positions breach | open count ≥ `max_open_positions` | REJECT |
| Total exposure breach | exposure > `max_total_exposure_pct` | REJECT |
| Broker connection failure | broker health check fails | REJECT (NO TRADE) |
| Unapproved live trading | `LIVE_TRADING_ENABLED` false but order routed live | REJECT + alert |
| LLM uncertainty / incomplete thesis | `confidence_score` below floor or thesis incomplete | REJECT |
| Disallowed instrument | short / options / crypto / leverage requested | REJECT |
| Out-of-universe symbol | symbol not in MVP universe | REJECT |
| Earnings-event trading | symbol within earnings window, not explicitly allowed | REJECT |

---

## 7. Pre-Trade / Intra-Day / Post-Trade Checks

| Phase | Checks |
|-------|--------|
| **Pre-trade** | Required fields present; symbol in universe; instrument allowed; data quality OK; price history sufficient; liquidity & spread OK; backtest passed (if required); LLM confidence ≥ floor; sizing computed; exposure/position/count limits OK; not in earnings window; broker healthy; live-trading gate satisfied. |
| **Intra-day** | Daily loss monitor; total exposure monitor; broker health heartbeat; data freshness heartbeat; stop-loss integrity (every open position has an active protective stop). |
| **Post-trade** | Fill reconciliation vs intended order; realized/unrealized PnL update; exposure recomputation; risk-state refresh; audit record of decision and outcome. |

---

## 8. Data-Quality & Broker-Health Gates

These are **gates**, not advisories. A failed gate means NO TRADE.

| Gate | Failing condition |
|------|-------------------|
| Data freshness | Latest bar older than allowed staleness window |
| Data completeness | Missing bars / gaps in required history |
| Data sanity | NaNs, non-positive prices, impossible jumps |
| Broker health | Heartbeat/auth/session check fails |
| Risk-engine self-check | Engine cannot confirm its own configuration & state |

---

## 9. Signal Required Fields

A signal is rejected if **any** field is missing or invalid:

`signal_id, memo_id, symbol, direction, entry_type, entry_price, stop_loss, take_profit, max_position_pct, max_risk_pct, time_horizon, confidence_score, requires_backtest, risk_status, execution_status, created_at`

`direction` must be `long` in MVP. `max_risk_pct` and `max_position_pct` from the signal may only be **stricter** than policy defaults, never looser.

---

## 10. Earnings-Event Restriction

Trading a symbol inside its earnings window is **blocked by default** in MVP. It may only be permitted later via an explicit, governed configuration change, and even then remains subject to all other risk checks.

---

## 11. Live-Trading Prohibition & Override Governance

- Live trading is **disabled by default** (`LIVE_TRADING_ENABLED=false`, `live_trading_default=false`).
- Enabling live trading is a Phase-12 milestone and **remains disabled in MVP**.
- Override governance: enabling live requires (a) completing the execution readiness checklist (see execution-policy.md), (b) an explicit owner decision recorded in the audit log, and (c) the risk engine confirming all gates green. Any single failure reverts to paper.
- The risk engine independently re-verifies the live gate on **every** order; a stale or inconsistent gate state blocks the order.

---

## 12. Escalation & Human Supervision

| Event | Escalation |
|-------|------------|
| Weekly loss breach | Halt + owner review before resuming |
| Kill switch engaged | Owner notification (high severity) |
| Repeated data/broker gate failures | Owner notification; system stays in NO-TRADE |
| Any attempt to route live while disabled | High-severity alert + audit |

The owner is the single human supervisor and final authority over configuration; the owner cannot, however, retroactively un-block a logged risk decision — overrides are forward-looking config changes only.

---

## 13. Auditability of Risk Decisions

- Every signal terminates with a definitive `risk_status` (e.g. `approved`, `rejected:<reason>`).
- Every risk decision logs: timestamp, event_type, entity_id (signal_id/order_id), severity, the rule evaluated, inputs, and outcome.
- Risk decisions are append-only and reproducible. Given the stored inputs, re-running the engine must yield the same decision.

---

## 14. Risk-Decision Flow (Pseudocode)

```python
def evaluate(signal, market, portfolio, system):
    # 0. Health gates — fail closed
    if not system.data_quality_ok(signal.symbol):   return block("data_quality_failure")
    if not system.broker_healthy():                  return block("broker_connection_failure")
    if not system.risk_engine_self_check():          return block("risk_engine_unavailable")

    # 1. Structural validation
    if missing_required_fields(signal):              return block("missing_signal_fields")
    if signal.symbol not in MVP_UNIVERSE:            return block("out_of_universe")
    if signal.direction != "long":                   return block("disallowed_instrument")
    if requests_disallowed_instrument(signal):       return block("disallowed_instrument")

    # 2. Market-quality gates
    if market.history_bars(signal.symbol) < MIN_BARS: return block("insufficient_price_history")
    if market.liquidity_low(signal.symbol):          return block("low_liquidity")
    if market.spread_high(signal.symbol):            return block("high_spread")
    if market.in_earnings_window(signal.symbol) and not EARNINGS_ALLOWED:
        return block("earnings_event")

    # 3. AI-confidence gate (deterministic threshold on AI output)
    if signal.confidence_score < CONFIDENCE_FLOOR or thesis_incomplete(signal):
        return block("llm_uncertainty")

    # 4. Backtest gate
    if signal.requires_backtest and not backtest_passed(signal):
        return block("backtest_failure")

    # 5. Sizing + limits
    shares = position_size(signal, portfolio.equity)
    if shares <= 0:                                  return block("position_size_invalid")
    if position_pct(shares, signal, portfolio) > MAX_POSITION_SIZE_PCT:
        return block("position_size_above_limit")
    if portfolio.open_count + 1 > MAX_OPEN_POSITIONS: return block("max_open_positions")
    if projected_exposure(shares, signal, portfolio) > MAX_TOTAL_EXPOSURE_PCT:
        return block("total_exposure_breach")

    # 6. Drawdown circuit breakers
    if portfolio.daily_loss_pct >= MAX_DAILY_LOSS_PCT:   return block("daily_loss_limit")
    if portfolio.weekly_loss_pct >= MAX_WEEKLY_LOSS_PCT: return block("weekly_loss_limit")

    # 7. Live gate
    if signal.target_mode == "live" and not system.LIVE_TRADING_ENABLED:
        return block("unapproved_live_trading")

    return approve(shares)   # only path that grants execution permission
```

`block(reason)` sets `risk_status = "rejected:<reason>"`, logs the decision, and returns NO TRADE. `approve(...)` is the **only** path that authorizes the order layer.
