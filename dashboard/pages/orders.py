"""Orders / portfolio dashboard page (paper)."""

from __future__ import annotations

import streamlit as st


def render(portfolio: dict | None) -> None:
    st.subheader("Paper Portfolio")
    st.caption("Paper trading only — no live orders are ever placed.")

    if not portfolio:
        st.info("No portfolio snapshot yet. Run the full mock cycle from the sidebar.")
        return

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Equity", f"${portfolio.get('equity', 0):,.0f}")
    c2.metric("Cash", f"${portfolio.get('cash', 0):,.0f}")
    c3.metric("Open positions", portfolio.get("open_positions", 0))
    c4.metric("Total return", f"{portfolio.get('total_return_pct', 0):.2f}%")

    c1, c2, c3 = st.columns(3)
    c1.metric("Unrealized PnL", f"${portfolio.get('unrealized_pnl', 0):,.2f}")
    c2.metric("Gross exposure", f"{portfolio.get('gross_exposure_pct', 0):.1f}%")
    c3.metric("Commissions", f"${portfolio.get('commissions_paid', 0):,.2f}")

    weights = portfolio.get("weights_pct", {})
    if weights:
        st.markdown("### Position weights (% of equity)")
        st.dataframe(
            [{"symbol": s, "weight_%": w} for s, w in weights.items()],
            use_container_width=True,
        )
