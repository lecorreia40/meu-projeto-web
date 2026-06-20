"""Managed paper-trading simulation (entry -> manage -> exit).

Extends the Sprint 2 pipeline with a real position lifecycle:

  * Phase 1 (entry): generate memo/signal, backtest, risk-review, and enter paper
    positions using a *warmup* window of bars.
  * Phase 2 (manage): step through a held-out window of subsequent bars and exit
    each position at its stop, target, or time stop.
  * Phase 3 (close): force-close anything still open at the last price.

It records a trade journal and an equity curve (with max drawdown). Everything is
paper/dry-run; long-only; live trading disabled.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from agents.orchestrator import OrchestratorAgent
from backtest.engine import BacktestEngine
from core.logging import StructuredLogger, get_logger
from data.ingestion.prices import MockPriceFeed
from execution.order_manager import OrderManager
from execution.paper_trading import PaperBroker
from features.pipeline import build_feature_set
from memos.memo_schema import MemoStatus
from portfolio.equity_curve import EquityCurve
from portfolio.journal import RoundTrip, TradeJournal
from portfolio.paper_portfolio import PaperPortfolio
from portfolio.position_manager import ManagedPosition, PositionManager
from risk.risk_engine import RiskEngine
from risk.rules import RiskContext
from signals.signal_engine import SignalEngine


class ManagedCycleResult(BaseModel):
    model_config = ConfigDict(frozen=True)

    n_entries: int
    journal_stats: dict[str, float]
    total_return_pct: float
    max_drawdown_pct: float
    final_equity: float
    open_remaining: int
    trips: list[RoundTrip] = Field(default_factory=list)


class ManagedCycle:
    def __init__(
        self,
        *,
        seed: int = 42,
        days: int = 180,
        holdout: int = 30,
        account_equity: float = 100_000.0,
        live_trading_enabled: bool = False,
        logger: StructuredLogger | None = None,
    ) -> None:
        self.feed = MockPriceFeed(seed=seed)
        self.days = days
        self.holdout = holdout
        self.account_equity = account_equity
        self.orchestrator = OrchestratorAgent()
        self.signal_engine = SignalEngine()
        self.backtester = BacktestEngine()
        self.risk_engine = RiskEngine()
        self.broker = PaperBroker()
        self.order_manager = OrderManager(self.broker, live_trading_enabled=live_trading_enabled)
        self.portfolio = PaperPortfolio(starting_cash=account_equity)
        self.journal = TradeJournal()
        self.position_manager = PositionManager(
            self.portfolio, self.broker, self.journal,
            live_trading_enabled=live_trading_enabled,
        )
        self.equity = EquityCurve(account_equity)
        self.logger = logger or get_logger("managed_cycle")
        self._marks: dict[str, float] = {}

    def _risk_context(self, history_len: int, liquidity: float, backtest_passed: bool) -> RiskContext:
        snap = self.portfolio.snapshot(self._marks)
        return RiskContext(
            account_equity=self.account_equity,
            open_positions=snap.open_positions,
            current_exposure_pct=snap.gross_exposure_pct,
            price_history_bars=history_len,
            liquidity_score=liquidity,
            data_quality_ok=True,
            backtest_passed=backtest_passed,
            broker_connected=self.broker.is_connected(),
        )

    def run(self, symbols: list[str]) -> ManagedCycleResult:
        holdout_bars: dict[str, list] = {}
        n_entries = 0

        # --- Phase 1: entry on the warmup window ---
        for symbol in symbols:
            bars = self.feed.fetch_bars(symbol, days=self.days)
            warmup, future = bars[: -self.holdout], bars[-self.holdout :]
            if len(warmup) < 60:
                continue
            features = build_feature_set(symbol, warmup)
            self._marks[symbol] = features.last_price

            swarm = self.orchestrator.run(features)
            if swarm.memo.status is not MemoStatus.COMPLETE:
                continue
            signal = self.signal_engine.from_memo(swarm.memo, swarm.risk_proposal)
            backtest = self.backtester.run(signal, warmup)
            context = self._risk_context(
                features.history_len,
                features.liquidity if features.liquidity is not None else 0.0,
                backtest.passed,
            )
            decision = self.risk_engine.evaluate(signal, context)
            if not decision.approved:
                continue

            execution = self.order_manager.execute(signal, decision)
            self.portfolio.apply_fill(execution.fill)
            self.position_manager.open(
                ManagedPosition(
                    symbol=symbol,
                    signal_id=signal.signal_id,
                    quantity=execution.fill.quantity,
                    entry_price=execution.fill.fill_price,
                    stop_loss=signal.stop_loss,
                    take_profit=signal.take_profit,
                    max_holding=self.holdout,
                )
            )
            holdout_bars[symbol] = future
            n_entries += 1

        # --- Phase 2: manage over the held-out window ---
        self.equity.record(self.portfolio.equity(self._marks), label="entry")
        for step in range(self.holdout):
            for symbol, future in holdout_bars.items():
                if step >= len(future):
                    continue
                bar = future[step]
                self._marks[symbol] = bar.close
                self.position_manager.on_bar(symbol, bar, step=step)
            self.equity.record(self.portfolio.equity(self._marks), label=f"step{step}")

        # --- Phase 3: force-close any remainder ---
        last_prices = {s: f[-1].close for s, f in holdout_bars.items() if f}
        self.position_manager.force_close_all(last_prices, step=self.holdout)
        self._marks.update(last_prices)
        self.equity.record(self.portfolio.equity(self._marks), label="final")

        return ManagedCycleResult(
            n_entries=n_entries,
            journal_stats=self.journal.stats(),
            total_return_pct=round(self.equity.total_return_pct(), 4),
            max_drawdown_pct=self.equity.max_drawdown_pct(),
            final_equity=round(self.equity.last_equity, 2),
            open_remaining=len(self.position_manager.open_symbols),
            trips=self.journal.trips,
        )

    def persist(self, directory: str = "./artifacts") -> dict[str, str]:
        return {"trades": self.journal.persist(f"{directory}/trades.jsonl")}
