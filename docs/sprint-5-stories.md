# Sprint 5 Stories — Multi-Day Simulation with Drawdown Halting

**Sprint goal:** Make the deterministic risk engine's drawdown controls operate
end-to-end in a realistic day-by-day loop: the desk manages positions over time
and **stops trading automatically** when daily/weekly loss limits are breached.
Paper-only; live trading disabled.

**BMAD roles exercised:** Developer, QA, SRE, Architect.

| Story | Title | Description | Acceptance | Points |
|-------|-------|-------------|------------|--------|
| MP-501 | Deterministic drawdown module | `risk/drawdown.py`: daily/weekly loss vs. day/week opening equity → halt status | Loss ≥ limit halts; gains clamp to 0; zero open equity is safe | 3 |
| MP-502 | Multi-day simulation engine | `app/multi_day.py`: walk days, mark/manage, drawdown-halt, enter with no look-ahead | Runs over a calendar; every entry exits; metrics reported | 5 |
| MP-503 | Kill-switch integration | Engage the kill switch on a drawdown breach; clear it on a fresh day/week without breach | Tight policy engages the kill switch; halt days counted | 3 |
| MP-504 | No look-ahead entries | Features/backtest/risk on data up to day *t* only | Entry on day *t* uses `bars[:t+1]` | 2 |
| MP-505 | Runner + docs | `scripts/run_simulation.py`; README section | Script prints entries/exits, halt days, return, drawdown | 2 |
| MP-506 | Tests | Drawdown unit tests + multi-day integration tests | Full suite green (163 tests) | 3 |

**Definition of Done:** all acceptance criteria met; full suite green; the
multi-day simulation runs end-to-end, closes every position, and halts new
entries (engaging the kill switch) when a tight drawdown policy is applied; no
look-ahead; no live trading; no secrets.

**Demonstration:** with the MVP policy (2% daily / 5% weekly) over 120 trading
days, the desk turns over ~24 round trips and never breaches the limits
(halt days = 0). With a deliberately tight policy (0.01% daily/weekly), the desk
halts on ~33 days and the kill switch engages — proving the fail-safe fires.

**Out of scope (future):** real PostgreSQL/TimescaleDB, real market data, real
LLM wired into the agents, real IBKR connection, and any enabling of live
trading (stays disabled).
