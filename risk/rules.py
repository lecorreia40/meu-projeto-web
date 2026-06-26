"""Deterministic risk rules.

Each rule is a pure function: given the signal, the runtime context, the policy,
and the computed sizing, it returns a :class:`BlockReason` if the trade must be
blocked, or ``None`` if the rule passes. The risk engine runs every rule and
collects all reasons (so the audit trail shows *every* problem, not just the
first).

These rules are the single source of truth for the specification's
"risk engine must block" list. They contain NO AI and NO randomness.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from core.enums import Direction
from data.universe import is_in_universe
from risk.policy import RiskPolicy
from risk.position_sizing import PositionSizing
from signals.signal_schema import TradingSignal

# Required signal fields whose absence/emptiness is an automatic block.
REQUIRED_SIGNAL_FIELDS: tuple[str, ...] = (
    "signal_id", "memo_id", "symbol", "direction", "entry_type",
    "entry_price", "stop_loss", "take_profit", "max_position_pct",
    "max_risk_pct", "time_horizon", "confidence_score",
    "requires_backtest", "risk_status", "execution_status", "created_at",
)


class BlockReason(str, Enum):
    MISSING_REQUIRED_FIELDS = "missing_required_fields"
    NOT_IN_UNIVERSE = "not_in_universe"
    SHORT_NOT_ALLOWED = "short_selling_not_allowed"
    LEVERAGE_NOT_ALLOWED = "leverage_not_allowed"
    OPTIONS_NOT_ALLOWED = "options_not_allowed"
    CRYPTO_NOT_ALLOWED = "crypto_not_allowed"
    LOW_LIQUIDITY = "low_liquidity"
    HIGH_SPREAD = "high_spread"
    INSUFFICIENT_HISTORY = "insufficient_price_history"
    DATA_QUALITY_FAILURE = "data_quality_failure"
    BACKTEST_FAILURE = "backtest_failure"
    POSITION_SIZE_EXCEEDED = "position_size_above_limit"
    RISK_PER_TRADE_EXCEEDED = "risk_per_trade_above_limit"
    ZERO_SIZE = "computed_position_size_zero"
    DAILY_LOSS_LIMIT = "daily_loss_limit_breach"
    WEEKLY_LOSS_LIMIT = "weekly_loss_limit_breach"
    MAX_OPEN_POSITIONS = "max_open_positions_breach"
    MAX_TOTAL_EXPOSURE = "max_total_exposure_breach"
    BROKER_DISCONNECTED = "broker_connection_failure"
    LIVE_TRADING_NOT_APPROVED = "unapproved_live_trading"
    LLM_UNCERTAIN = "llm_uncertain_or_incomplete_thesis"
    EARNINGS_WINDOW = "earnings_event_not_allowed"


class RiskContext(BaseModel):
    """Runtime state the risk engine needs beyond the signal itself.

    Defaults describe a *healthy* environment so tests override only the single
    field they exercise. In production these come from the data, portfolio,
    broker-health, and LLM layers.
    """

    model_config = ConfigDict(frozen=True)

    account_equity: float = Field(default=100_000.0, gt=0)
    open_positions: int = 0
    current_exposure_pct: float = 0.0

    # Drawdown state (positive number = a loss of that magnitude, in %).
    daily_loss_pct: float = 0.0
    weekly_loss_pct: float = 0.0

    # Data quality / market microstructure
    price_history_bars: int = 120
    liquidity_score: float = 1.0
    spread_pct: float = 0.05
    data_quality_ok: bool = True

    # Backtest gate
    backtest_passed: bool = True

    # Broker / execution health
    broker_connected: bool = True

    # Live-trading gate
    live_trading_requested: bool = False
    live_trading_enabled: bool = False

    # AI plane health
    llm_confident: bool = True

    # Event risk
    in_earnings_window: bool = False

    # Instrument-class flags (MVP signals are long stock/ETF only; these exist
    # so the engine can explicitly reject anything else).
    is_leveraged: bool = False
    is_option: bool = False
    is_crypto: bool = False


def _missing_required_fields(signal: object) -> bool:
    for field in REQUIRED_SIGNAL_FIELDS:
        value = getattr(signal, field, None)
        if value is None:
            return True
        if isinstance(value, str) and value.strip() == "":
            return True
    return False


def check_required_fields(signal: TradingSignal) -> BlockReason | None:
    return BlockReason.MISSING_REQUIRED_FIELDS if _missing_required_fields(signal) else None


def check_universe(signal: TradingSignal) -> BlockReason | None:
    return None if is_in_universe(signal.symbol) else BlockReason.NOT_IN_UNIVERSE


def check_direction(signal: TradingSignal, policy: RiskPolicy) -> BlockReason | None:
    if signal.direction is Direction.SHORT and not policy.allow_short:
        return BlockReason.SHORT_NOT_ALLOWED
    return None


def check_instrument_flags(ctx: RiskContext, policy: RiskPolicy) -> list[BlockReason]:
    reasons: list[BlockReason] = []
    if ctx.is_leveraged and not policy.allow_leverage:
        reasons.append(BlockReason.LEVERAGE_NOT_ALLOWED)
    if ctx.is_option and not policy.allow_options:
        reasons.append(BlockReason.OPTIONS_NOT_ALLOWED)
    if ctx.is_crypto and not policy.allow_crypto:
        reasons.append(BlockReason.CRYPTO_NOT_ALLOWED)
    return reasons


def check_liquidity(ctx: RiskContext, policy: RiskPolicy) -> BlockReason | None:
    if ctx.liquidity_score < policy.min_liquidity_score:
        return BlockReason.LOW_LIQUIDITY
    return None


def check_spread(ctx: RiskContext, policy: RiskPolicy) -> BlockReason | None:
    if ctx.spread_pct > policy.max_spread_pct:
        return BlockReason.HIGH_SPREAD
    return None


def check_history(ctx: RiskContext, policy: RiskPolicy) -> BlockReason | None:
    if ctx.price_history_bars < policy.min_price_history_bars:
        return BlockReason.INSUFFICIENT_HISTORY
    return None


def check_data_quality(ctx: RiskContext) -> BlockReason | None:
    return None if ctx.data_quality_ok else BlockReason.DATA_QUALITY_FAILURE


def check_backtest(signal: TradingSignal, ctx: RiskContext) -> BlockReason | None:
    if signal.requires_backtest and not ctx.backtest_passed:
        return BlockReason.BACKTEST_FAILURE
    return None


def check_risk_per_trade(signal: TradingSignal, policy: RiskPolicy) -> BlockReason | None:
    if signal.max_risk_pct > policy.max_risk_per_trade_pct:
        return BlockReason.RISK_PER_TRADE_EXCEEDED
    return None


def check_position_size(
    signal: TradingSignal, sizing: PositionSizing, policy: RiskPolicy
) -> list[BlockReason]:
    reasons: list[BlockReason] = []
    # The signal's *requested* position cap may not exceed the policy cap.
    if signal.max_position_pct > policy.max_position_size_pct:
        reasons.append(BlockReason.POSITION_SIZE_EXCEEDED)
    # Defense in depth: the computed notional must also respect the policy.
    if sizing.position_pct > policy.max_position_size_pct + 1e-9:
        reasons.append(BlockReason.POSITION_SIZE_EXCEEDED)
    if sizing.shares <= 0:
        reasons.append(BlockReason.ZERO_SIZE)
    return reasons


def check_drawdown(ctx: RiskContext, policy: RiskPolicy) -> list[BlockReason]:
    reasons: list[BlockReason] = []
    if ctx.daily_loss_pct >= policy.max_daily_loss_pct:
        reasons.append(BlockReason.DAILY_LOSS_LIMIT)
    if ctx.weekly_loss_pct >= policy.max_weekly_loss_pct:
        reasons.append(BlockReason.WEEKLY_LOSS_LIMIT)
    return reasons


def check_open_positions(ctx: RiskContext, policy: RiskPolicy) -> BlockReason | None:
    if ctx.open_positions >= policy.max_open_positions:
        return BlockReason.MAX_OPEN_POSITIONS
    return None


def check_exposure(
    ctx: RiskContext, sizing: PositionSizing, policy: RiskPolicy
) -> BlockReason | None:
    projected = ctx.current_exposure_pct + sizing.position_pct
    if projected > policy.max_total_exposure_pct + 1e-9:
        return BlockReason.MAX_TOTAL_EXPOSURE
    return None


def check_broker(ctx: RiskContext) -> BlockReason | None:
    return None if ctx.broker_connected else BlockReason.BROKER_DISCONNECTED


def check_live_trading(ctx: RiskContext) -> BlockReason | None:
    # Any live-trading request is blocked unless explicitly enabled.
    if ctx.live_trading_requested and not ctx.live_trading_enabled:
        return BlockReason.LIVE_TRADING_NOT_APPROVED
    return None


def check_llm_confidence(ctx: RiskContext) -> BlockReason | None:
    return None if ctx.llm_confident else BlockReason.LLM_UNCERTAIN


def check_earnings(ctx: RiskContext, policy: RiskPolicy) -> BlockReason | None:
    if ctx.in_earnings_window and not policy.allow_earnings_trades:
        return BlockReason.EARNINGS_WINDOW
    return None
