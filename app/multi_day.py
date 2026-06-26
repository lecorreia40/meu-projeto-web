"""Multi-day paper-trading simulation with drawdown halting.

Walks a calendar of trading days. Each day it:

  1. Marks open positions to that day's close and manages exits (stop/target/time).
  2. Evaluates drawdown vs. the day's and week's opening equity. If the daily or
     weekly loss limit is breached, it HALTS: the kill switch engages and no new
     positions are opened (open positions are still managed to their exits).
  3. If not halted and capacity allows, it runs the full research pipeline on
     data available *up to that day* (no look-ahead) and enters approved signals.

Everything is paper/dry-run; long-only; live trading disabled. Deterministic
given a seed.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from agents.orchestrator import OrchestratorAgent
from backtest.engine import BacktestEngine
from core.events import EventType, Severity
from core.logging import StructuredLogger, get_logger
from data.ingestion.feed_factory import build_price_feed
from data.ingestion.prices import PriceFeed
from data.market_schema import MarketBar
from data.universe import SYMBOLS
from execution.order_manager import OrderManager
from execution.paper_trading import PaperBroker
from features.pipeline import build_feature_set
from memos.memo_schema import MemoStatus
from portfolio.equity_curve import EquityCurve
from portfolio.journal import RoundTrip, TradeJournal
from portfolio.paper_portfolio import PaperPortfolio
from portfolio.position_manager import ManagedPosition, PositionManager
from risk.drawdown import evaluate_drawdown
from risk.kill_switch import KillSwitch
from risk.policy import MVP_RISK_POLICY, RiskPolicy
from risk.risk_engine import RiskEngine
from risk.rules import RiskContext
from signals.signal_engine import SignalEngine

TRADING_DAYS_PER_WEEK = 5


class MultiDayResult(BaseModel):
    model_config = ConfigDict(frozen=True)

    days_traded: int
    n_entries: int
    n_exits: int
    halt_days: int
    final_equity: float
    total_return_pct: float
    max_drawdown_pct: float
    open_remaining: int
    journal_stats: dict[str, float]
    trips: list[RoundTrip] = Field(default_factory=list)


class MultiDaySimulation:
    def __init__(
        self,
        *,
        seed: int = 42,
        days: int = 180,
        warmup: int = 60,
        account_equity: float = 100_000.0,
        max_new_entries_per_day: int = 1,
        max_holding_days: int = 20,
        policy: RiskPolicy | None = None,
        live_trading_enabled: bool = False,
        feed: PriceFeed | None = None,
        logger: StructuredLogger | None = None,
    ) -> None:
        self.feed = feed or build_price_feed(seed=seed)
        self.days = days
        self.warmup = warmup
        self.account_equity = account_equity
        self.max_new_entries_per_day = max_new_entries_per_day
        self.max_holding_days = max_holding_days
        self.policy = policy or MVP_RISK_POLICY
        self.orchestrator = OrchestratorAgent()
        self.signal_engine = SignalEngine()
        self.backtester = BacktestEngine()
        self.risk_engine = RiskEngine(self.policy)
        self.broker = PaperBroker()
        self.order_manager = OrderManager(self.broker, live_trading_enabled=live_trading_enabled)
        self.portfolio = PaperPortfolio(starting_cash=account_equity)
        self.journal = TradeJournal()
        self.position_manager = PositionManager(
            self.portfolio, self.broker, self.journal,
            live_trading_enabled=live_trading_enabled,
        )
        self.equity = EquityCurve(account_equity)
        self.kill_switch = KillSwitch()
        self.logger = logger or get_logger("multi_day")
        self._marks: dict[str, float] = {}
        # Per-day audit log: (day_index, equity, halted) — used for charts/reports.
        self.daily_log: list[tuple[int, float, bool]] = []

    def _risk_context(self, history_len: int, liquidity: float, backtest_passed: bool,
                      daily_loss: float, weekly_loss: float) -> RiskContext:
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
            daily_loss_pct=daily_loss,
            weekly_loss_pct=weekly_loss,
        )

    def run(self, symbols: list[str] | None = None) -> MultiDayResult:
        symbols = symbols or SYMBOLS
        bars: dict[str, list[MarketBar]] = {
            s: self.feed.fetch_bars(s, days=self.days) for s in symbols
        }

        n_entries = 0
        halt_days = 0
        days_traded = 0
        week_open_equity = self.account_equity
        prev_week = -1

        for t in range(self.warmup, self.days):
            days_traded += 1
            equity_open = self.portfolio.equity(self._marks)

            week_index = t // TRADING_DAYS_PER_WEEK
            if week_index != prev_week:
                week_open_equity = equity_open
                prev_week = week_index
            day_open_equity = equity_open

            # 1) Mark to today's close and manage exits.
            for s in symbols:
                self._marks[s] = bars[s][t].close
            for s in list(self.position_manager.open_symbols):
                self.position_manager.on_bar(s, bars[s][t], step=t)

            equity_now = self.portfolio.equity(self._marks)

            # 2) Drawdown evaluation.
            status = evaluate_drawdown(
                day_open_equity=day_open_equity,
                week_open_equity=week_open_equity,
                current_equity=equity_now,
                policy=self.policy,
            )
            if status.halted:
                halt_days += 1
                if not self.kill_switch.engaged:
                    self.kill_switch.engage(
                        f"drawdown halt on day {t}: {', '.join(status.reasons)}"
                    )
                self.logger.log(
                    EventType.RISK_BLOCKED, entity_id=f"day_{t}",
                    severity=Severity.WARNING, reasons=status.reasons,
                    daily_loss_pct=status.daily_loss_pct,
                    weekly_loss_pct=status.weekly_loss_pct,
                )
            else:
                # New day/week without a breach clears the halt.
                if self.kill_switch.engaged:
                    self.kill_switch.reset()

            # 3) New entries (only when not halted and capacity remains).
            if not status.halted:
                n_entries += self._try_entries(symbols, bars, t, status.daily_loss_pct,
                                               status.weekly_loss_pct)

            end_equity = self.portfolio.equity(self._marks)
            self.equity.record(end_equity, label=f"day{t}")
            self.daily_log.append((t, round(end_equity, 2), status.halted))

        # Force-close anything still open at the last close.
        last_prices = {s: bars[s][-1].close for s in symbols}
        self.position_manager.force_close_all(last_prices, step=self.days)
        self._marks.update(last_prices)
        self.equity.record(self.portfolio.equity(self._marks), label="final")

        return MultiDayResult(
            days_traded=days_traded,
            n_entries=n_entries,
            n_exits=len(self.journal.trips),
            halt_days=halt_days,
            final_equity=round(self.equity.last_equity, 2),
            total_return_pct=round(self.equity.total_return_pct(), 4),
            max_drawdown_pct=self.equity.max_drawdown_pct(),
            open_remaining=len(self.position_manager.open_symbols),
            journal_stats=self.journal.stats(),
            trips=self.journal.trips,
        )

    def _try_entries(self, symbols: list[str], bars: dict[str, list[MarketBar]],
                     t: int, daily_loss: float, weekly_loss: float) -> int:
        entered = 0
        for s in symbols:
            if entered >= self.max_new_entries_per_day:
                break
            snap = self.portfolio.snapshot(self._marks)
            if snap.open_positions >= self.policy.max_open_positions:
                break
            if s in self.position_manager.open_symbols:
                continue

            history = bars[s][: t + 1]
            if len(history) < self.warmup:
                continue
            features = build_feature_set(s, history)
            swarm = self.orchestrator.run(features)
            if swarm.memo.status is not MemoStatus.COMPLETE:
                continue

            signal = self.signal_engine.from_memo(swarm.memo, swarm.risk_proposal)
            backtest = self.backtester.run(signal, history)
            context = self._risk_context(
                features.history_len,
                features.liquidity if features.liquidity is not None else 0.0,
                backtest.passed, daily_loss, weekly_loss,
            )
            decision = self.risk_engine.evaluate(signal, context)
            if not decision.approved:
                continue

            execution = self.order_manager.execute(signal, decision)
            self.portfolio.apply_fill(execution.fill)
            self.position_manager.open(ManagedPosition(
                symbol=s, signal_id=signal.signal_id,
                quantity=execution.fill.quantity, entry_price=execution.fill.fill_price,
                stop_loss=signal.stop_loss, take_profit=signal.take_profit,
                max_holding=self.max_holding_days,
            ))
            self.logger.info(
                EventType.ORDER_FILLED, entity_id=execution.order.order_id,
                symbol=s, qty=execution.fill.quantity, price=execution.fill.fill_price,
            )
            entered += 1
        return entered
