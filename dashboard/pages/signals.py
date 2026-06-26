"""Signals dashboard page."""

from __future__ import annotations

import streamlit as st


def render(signals: list[dict]) -> None:
    st.subheader("Trading Signals")
    if not signals:
        st.info("No signals yet. Run the full mock cycle from the sidebar.")
        return

    table = [
        {
            "symbol": s.get("symbol"),
            "direction": s.get("direction"),
            "entry": s.get("entry_price"),
            "stop": s.get("stop_loss"),
            "target": s.get("take_profit"),
            "max_pos_%": s.get("max_position_pct"),
            "max_risk_%": s.get("max_risk_pct"),
            "horizon": s.get("time_horizon"),
            "risk_status": s.get("risk_status"),
            "exec_status": s.get("execution_status"),
        }
        for s in signals
    ]
    st.dataframe(table, use_container_width=True)

    approved = [s for s in signals if s.get("risk_status") == "approved"]
    blocked = [s for s in signals if s.get("risk_status") == "blocked"]
    col1, col2 = st.columns(2)
    col1.metric("Approved by risk engine", len(approved))
    col2.metric("Blocked by risk engine", len(blocked))
