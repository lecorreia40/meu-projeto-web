"""Overview / safety-status dashboard page."""

from __future__ import annotations

import streamlit as st


def render(memos: list[dict], signals: list[dict]) -> None:
    st.subheader("Overview")

    complete = [m for m in memos if m.get("status") == "complete"]
    approved = [s for s in signals if s.get("risk_status") == "approved"]

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Memos", len(memos))
    c2.metric("COMPLETE memos", len(complete))
    c3.metric("Signals", len(signals))
    c4.metric("Risk-approved signals", len(approved))

    st.divider()
    st.markdown(
        "**Safety posture**\n\n"
        "- Execution mode: **paper** (live trading disabled)\n"
        "- AI agents propose; the deterministic risk engine disposes\n"
        "- Every memo includes a mandatory skeptic view\n"
        "- Every signal carries stop_loss, take_profit, max_position_pct, "
        "max_risk_pct, and time_horizon"
    )
