# Sprint 4 Stories — Trade Lifecycle, LLM Provider, Live-Readiness Gate

**Sprint goal:** Complete the trade loop (manage and exit positions), add a
real LLM provider behind the existing abstraction, and make the live-trading
readiness gate explicit — all still paper/dry-run with live trading disabled.

**BMAD roles exercised:** Developer, QA, SRE, Architect.

| Story | Title | Description | Acceptance | Points |
|-------|-------|-------------|------------|--------|
| MP-401 | Close-order support | `Order.is_close`; validator allows SELL only to close a long (no shorting) | SELL-to-open rejected; SELL-to-close accepted; paper broker fills it | 2 |
| MP-402 | Position lifecycle | `PositionManager` exits open positions at stop/target/time via reduce-only closes | A bar through the stop closes the position with reason `stop`; target/time likewise | 5 |
| MP-403 | Trade journal | `RoundTrip` records + `TradeJournal` with stats and persistence | Each exit records a round trip; stats report win rate and expectancy | 3 |
| MP-404 | Equity curve | `EquityCurve` with total return and max drawdown | Drawdown computed from a peak/trough series; monotonic series → 0 | 2 |
| MP-405 | Managed cycle | `ManagedCycle`: warmup entry → manage over holdout → force-close | Cycle enters >0 positions and closes all; journal matches entries | 5 |
| MP-406 | LLM provider abstraction | `AnthropicLLMClient` behind `LLMClient`; `build_llm_client` factory | Defaults to mock; anthropic without key falls back to mock; empty key raises | 3 |
| MP-407 | IBKR adapter (already scaffolded) | Confirm fail-closed behavior carries into lifecycle | Disconnected; cannot satisfy the live-broker readiness check | 1 |
| MP-408 | Live-readiness gate | `evaluate_readiness` + `assert_live_trading_allowed` (Phase 12) | Always NOT READY in the MVP; assert raises even with flags flipped | 3 |
| MP-409 | Tests & docs | Coverage for all of the above + readiness doc | Full suite green (150 tests) | 3 |

**Definition of Done:** all acceptance criteria met; full suite green; the
managed cycle runs end-to-end and books a trade journal + equity curve; no live
trading path exists and the readiness gate refuses to authorize it; no secrets
committed (LLM key from env only).

**Out of scope (future):** real PostgreSQL/TimescaleDB connection, real LLM
calls wired into the agents, real IBKR connection, and any enabling of live
trading (stays disabled).
