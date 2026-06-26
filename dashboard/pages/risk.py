"""Risk dashboard page — shows the deterministic policy and live block stats."""

from __future__ import annotations

import streamlit as st

from risk.policy import MVP_RISK_POLICY


def render(signals: list[dict]) -> None:
    st.subheader("Risk Policy & Decisions")
    st.caption("The deterministic risk engine has final authority over every trade.")

    policy = MVP_RISK_POLICY
    cols = st.columns(3)
    cols[0].metric("Max risk / trade", f"{policy.max_risk_per_trade_pct:.1f}%")
    cols[1].metric("Max position size", f"{policy.max_position_size_pct:.1f}%")
    cols[2].metric("Max open positions", policy.max_open_positions)
    cols = st.columns(3)
    cols[0].metric("Max daily loss", f"{policy.max_daily_loss_pct:.1f}%")
    cols[1].metric("Max weekly loss", f"{policy.max_weekly_loss_pct:.1f}%")
    cols[2].metric("Max total exposure", f"{policy.max_total_exposure_pct:.1f}%")

    st.divider()
    approved = [s for s in signals if s.get("risk_status") == "approved"]
    blocked = [s for s in signals if s.get("risk_status") == "blocked"]
    c1, c2 = st.columns(2)
    c1.metric("Approved signals", len(approved))
    c2.metric("Blocked signals", len(blocked))

    st.markdown(
        "**Disabled capabilities (MVP):** short selling, leverage, options, crypto. "
        "**Live trading:** disabled."
    )
