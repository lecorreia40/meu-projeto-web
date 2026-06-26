# Live-Trading Readiness Checklist (Phase 12)

> **Status: DISABLED.** Live trading is off by default and is intentionally not
> enabled anywhere in this system. This document and the matching code gate
> (`execution/live_readiness.py`) exist to make the conditions explicit and
> auditable — they are a safety control, **not** an on-switch.

Live trading may only ever be considered after **every** condition below is
satisfied. `assert_live_trading_allowed()` is the single chokepoint any future
live path must call; in the MVP it always raises `LiveTradingDisabledError`.

## Checklist

| # | Check | MVP status | Requirement |
|---|-------|-----------|-------------|
| 1 | `live_flag_enabled` | ❌ | `LIVE_TRADING_ENABLED=true` set deliberately |
| 2 | `execution_mode_live` | ❌ | `EXECUTION_MODE=live` |
| 3 | `live_capable_broker_connected` | ❌ | A live-capable broker connected (the paper broker structurally cannot) |
| 4 | `deterministic_risk_engine` | ✅ | Risk engine present and authoritative over all orders |
| 5 | `backtest_gate` | ✅ | Backtest pass/fail gate enforced for `requires_backtest` signals |
| 6 | `kill_switch` | ✅ | Global kill switch present |
| 7 | `audit_logging` | ✅ | Structured JSONL audit trail for every action |
| 8 | `reconciliation` | ✅ | Position reconciliation present |
| 9 | `paper_track_record` | ❌ | A reviewed paper-trading track record established |
| 10 | `human_signoff` | ❌ | Explicit human sign-off recorded |
| 11 | `compliance_review` | ❌ | Broker/regulatory review (owner capital only; not a fund) |

The infrastructure controls (4–8) are already in place. The remaining checks are
deliberate process/human gates plus a live broker — none of which exist in the
MVP, so the overall verdict is **NOT READY** and live trading cannot be
authorized.

## How the gate is enforced

```python
from execution.live_readiness import assert_live_trading_allowed
assert_live_trading_allowed(settings, broker)  # raises LiveTradingDisabledError in the MVP
```

Even flipping `LIVE_TRADING_ENABLED` and `EXECUTION_MODE` is insufficient: the
human sign-off, compliance review, paper track record, and a live-capable broker
remain unmet, so the gate still refuses. Enabling live trading is therefore a
deliberate, multi-step, human-in-the-loop process — never a single flag.
