"""Full research-to-paper-order pipeline orchestration.

Wires every Sprint 2 component into one auditable cycle:

    data -> agents -> memo -> signal -> backtest -> risk review -> paper order

Everything is paper/dry-run. No live trading, no real broker. The cycle is
deterministic given a seed, so runs are reproducible.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict

from agents.orchestrator import OrchestratorAgent, SwarmResult
from backtest.engine import BacktestEngine, BacktestResult
from core.events import EventType
from core.logging import StructuredLogger, get_logger
from data.ingestion.prices import MockPriceFeed
from data.market_schema import MarketBar
from execution.order_manager import ExecutionResult, OrderManager
from execution.paper_trading import PaperBroker
from features.pipeline import FeatureSet, build_feature_set
from memos.memo_repository import MemoRepository
from memos.memo_schema import InvestmentMemo, MemoStatus
from portfolio.paper_portfolio import PaperPortfolio, PortfolioSnapshot
from risk.policy import RiskPolicy
from risk.risk_engine import RiskDecision, RiskEngine
from risk.rules import RiskContext
from signals.signal_engine import SignalEngine
from signals.signal_repository import SignalRepository
from signals.signal_schema import RiskStatus, TradingSignal

Stage = Literal[
    "memo_rejected", "signal_created", "backtest_blocked",
    "risk_blocked", "paper_filled",
]


class CycleRecord(BaseModel):
    """Outcome for a single symbol through the full cycle."""

    model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)

    symbol: str
    stage: Stage
    memo: InvestmentMemo
    swarm: SwarmResult | None = None  # per-agent decision trail
    signal: TradingSignal | None = None
    backtest: BacktestResult | None = None
    decision: RiskDecision | None = None
    execution: ExecutionResult | None = None
    notes: str = ""


class CycleSummary(BaseModel):
    model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)

    records: list[CycleRecord]

    @property
    def counts(self) -> dict[str, int]:
        out: dict[str, int] = {}
        for r in self.records:
            out[r.stage] = out.get(r.stage, 0) + 1
        return out

    @property
    def paper_orders(self) -> list[CycleRecord]:
        return [r for r in self.records if r.stage == "paper_filled"]


class TradingDeskPipeline:
    """Runs the full mock cycle and persists memos/signals for the dashboard."""

    def __init__(
        self,
        *,
        seed: int = 42,
        days: int = 180,
        account_equity: float = 100_000.0,
        live_trading_enabled: bool = False,
        policy: "RiskPolicy | None" = None,
        enabled_agents: set[str] | None = None,
        confidence_threshold: float | None = None,
        memo_repo: MemoRepository | None = None,
        signal_repo: SignalRepository | None = None,
        logger: StructuredLogger | None = None,
    ) -> None:
        self.feed = MockPriceFeed(seed=seed)
        self.days = days
        self.account_equity = account_equity
        self.orchestrator = OrchestratorAgent(
            enabled_agents=enabled_agents, confidence_threshold=confidence_threshold
        )
        self.signal_engine = SignalEngine()
        self.backtester = BacktestEngine()
        self.risk_engine = RiskEngine(policy)
        self.broker = PaperBroker()
        self.order_manager = OrderManager(self.broker, live_trading_enabled=live_trading_enabled)
        self.memo_repo = memo_repo or MemoRepository()
        self.signal_repo = signal_repo or SignalRepository()
        self.logger = logger or get_logger("pipeline")
        # Paper portfolio + latest marks make the risk engine portfolio-aware
        # (open positions, gross exposure) across the cycle.
        self.portfolio = PaperPortfolio(starting_cash=account_equity)
        self._marks: dict[str, float] = {}

    def _bars(self, symbol: str) -> list[MarketBar]:
        return self.feed.fetch_bars(symbol, days=self.days)

    def _context(self, features: FeatureSet, backtest: BacktestResult) -> RiskContext:
        snapshot = self.portfolio.snapshot(self._marks)
        return RiskContext(
            account_equity=self.account_equity,
            open_positions=snapshot.open_positions,
            current_exposure_pct=snapshot.gross_exposure_pct,
            price_history_bars=features.history_len,
            liquidity_score=features.liquidity if features.liquidity is not None else 0.0,
            data_quality_ok=features.is_complete,
            backtest_passed=backtest.passed,
            broker_connected=self.broker.is_connected(),
            live_trading_requested=False,
            live_trading_enabled=False,
        )

    def portfolio_snapshot(self) -> PortfolioSnapshot:
        return self.portfolio.snapshot(self._marks)

    def run_symbol(self, symbol: str) -> CycleRecord:
        bars = self._bars(symbol)
        features = build_feature_set(symbol, bars)
        self._marks[symbol] = features.last_price

        # 1) Agents -> memo
        swarm = self.orchestrator.run(features)
        memo = swarm.memo
        self.memo_repo.add(memo)
        self.logger.info(
            EventType.MEMO_CREATED, entity_id=memo.memo_id, symbol=symbol,
            status=memo.status.value, confidence=memo.confidence_score,
        )
        if memo.status is not MemoStatus.COMPLETE:
            return CycleRecord(
                symbol=symbol, stage="memo_rejected", memo=memo, swarm=swarm,
                notes="memo not COMPLETE; no signal generated",
            )

        # 2) Memo -> signal (incomplete memos already filtered above)
        signal = self.signal_engine.from_memo(memo, swarm.risk_proposal)
        self.signal_repo.add(signal)
        self.logger.info(
            EventType.SIGNAL_CREATED, entity_id=signal.signal_id,
            symbol=symbol, memo_id=memo.memo_id,
        )

        # 3) Backtest
        backtest = self.backtester.run(signal, bars)
        self.logger.info(
            EventType.BACKTEST_COMPLETED, entity_id=signal.signal_id,
            symbol=symbol, passed=backtest.passed, reason=backtest.reason,
        )

        # 4) Risk review (deterministic)
        context = self._context(features, backtest)
        decision = self.risk_engine.evaluate(signal, context)
        marked = signal.model_copy(
            update={"risk_status": RiskStatus.APPROVED if decision.approved else RiskStatus.BLOCKED}
        )
        self.signal_repo.update(marked)
        self.logger.log(
            EventType.RISK_APPROVED if decision.approved else EventType.RISK_BLOCKED,
            entity_id=signal.signal_id, symbol=symbol,
            approved=decision.approved, reasons=decision.reason_values,
        )

        if not backtest.passed and not decision.approved:
            return CycleRecord(
                symbol=symbol, stage="backtest_blocked", memo=memo, swarm=swarm,
                signal=marked, backtest=backtest, decision=decision,
                notes=f"backtest failed: {backtest.reason}",
            )
        if not decision.approved:
            return CycleRecord(
                symbol=symbol, stage="risk_blocked", memo=memo, swarm=swarm,
                signal=marked, backtest=backtest, decision=decision,
                notes="risk engine blocked: " + ", ".join(decision.reason_values),
            )

        # 5) Paper order simulation -> book into the paper portfolio
        execution = self.order_manager.execute(marked, decision)
        self.portfolio.apply_fill(execution.fill)
        self.logger.info(
            EventType.ORDER_FILLED, entity_id=execution.order.order_id,
            symbol=symbol, qty=execution.fill.quantity, price=execution.fill.fill_price,
            mode=execution.fill.mode.value,
        )
        return CycleRecord(
            symbol=symbol, stage="paper_filled", memo=memo, swarm=swarm,
            signal=marked, backtest=backtest, decision=decision, execution=execution,
            notes="paper order filled",
        )

    def run(self, symbols: list[str]) -> CycleSummary:
        records = [self.run_symbol(s) for s in symbols]
        return CycleSummary(records=records)

    def persist_artifacts(self, directory: str = "./artifacts") -> dict[str, str]:
        """Write memos and signals to JSONL so the dashboard can read them."""
        out = Path(directory)
        out.mkdir(parents=True, exist_ok=True)
        memo_path = out / "memos.jsonl"
        signal_path = out / "signals.jsonl"
        with memo_path.open("w", encoding="utf-8") as fh:
            for memo in self.memo_repo.list():
                fh.write(memo.model_dump_json() + "\n")
        with signal_path.open("w", encoding="utf-8") as fh:
            for signal in self.signal_repo.list():
                fh.write(signal.model_dump_json() + "\n")
        portfolio_path = out / "portfolio.json"
        portfolio_path.write_text(self.portfolio_snapshot().model_dump_json(indent=2))
        return {
            "memos": str(memo_path),
            "signals": str(signal_path),
            "portfolio": str(portfolio_path),
        }
