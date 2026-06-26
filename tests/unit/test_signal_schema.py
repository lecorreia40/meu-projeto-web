"""Signal & memo schema validation tests.

Proves that the Pydantic layer rejects structurally invalid signals *before*
they can reach the risk engine — the first line of "reject if required fields
are missing".
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from core.enums import AssetType, Direction, TimeHorizon
from memos.memo_schema import InvestmentMemo
from signals.signal_schema import EntryType, TradingSignal
from tests.conftest import make_signal


def _valid_kwargs() -> dict[str, object]:
    return dict(
        memo_id="memo_1",
        symbol="AAPL",
        direction=Direction.LONG,
        entry_type=EntryType.LIMIT,
        entry_price=100.0,
        stop_loss=98.0,
        take_profit=106.0,
        max_position_pct=2.0,
        max_risk_pct=1.0,
        time_horizon=TimeHorizon.SWING,
        confidence_score=0.7,
    )


def test_valid_signal_constructs() -> None:
    sig = make_signal()
    assert sig.signal_id.startswith("sig_")
    assert sig.per_unit_risk == pytest.approx(2.0)


@pytest.mark.parametrize(
    "missing",
    ["memo_id", "symbol", "entry_price", "stop_loss", "take_profit",
     "max_position_pct", "max_risk_pct", "confidence_score"],
)
def test_missing_required_field_raises(missing: str) -> None:
    kwargs = _valid_kwargs()
    kwargs.pop(missing)
    with pytest.raises(ValidationError):
        TradingSignal(**kwargs)  # type: ignore[arg-type]


def test_negative_entry_price_raises() -> None:
    kwargs = _valid_kwargs()
    kwargs["entry_price"] = -5.0
    with pytest.raises(ValidationError):
        TradingSignal(**kwargs)  # type: ignore[arg-type]


def test_confidence_out_of_range_raises() -> None:
    kwargs = _valid_kwargs()
    kwargs["confidence_score"] = 1.5
    with pytest.raises(ValidationError):
        TradingSignal(**kwargs)  # type: ignore[arg-type]


def test_long_signal_with_stop_above_entry_raises() -> None:
    kwargs = _valid_kwargs()
    kwargs["stop_loss"] = 105.0  # above entry for a LONG -> invalid geometry
    with pytest.raises(ValidationError):
        TradingSignal(**kwargs)  # type: ignore[arg-type]


def test_long_signal_with_target_below_entry_raises() -> None:
    kwargs = _valid_kwargs()
    kwargs["take_profit"] = 95.0  # below entry for a LONG -> invalid geometry
    with pytest.raises(ValidationError):
        TradingSignal(**kwargs)  # type: ignore[arg-type]


def test_memo_requires_all_explainability_fields() -> None:
    # Missing skeptic_view should fail (every thesis must include a skeptic view).
    with pytest.raises(ValidationError):
        InvestmentMemo(
            symbol="AAPL",
            asset_type=AssetType.STOCK,
            direction=Direction.LONG,
            thesis="x",
            catalyst="x",
            time_horizon=TimeHorizon.SWING,
            entry_logic="x",
            risk_summary="x",
            # skeptic_view intentionally omitted
            confidence_score=0.5,
            data_sources=["mock"],
            model_version="v1",
            prompt_version="v1",
        )  # type: ignore[call-arg]


def test_memo_requires_data_sources() -> None:
    with pytest.raises(ValidationError):
        InvestmentMemo(
            symbol="AAPL",
            asset_type=AssetType.STOCK,
            direction=Direction.LONG,
            thesis="x",
            catalyst="x",
            time_horizon=TimeHorizon.SWING,
            entry_logic="x",
            risk_summary="x",
            skeptic_view="x",
            confidence_score=0.5,
            data_sources=[],  # must be non-empty
            model_version="v1",
            prompt_version="v1",
        )
