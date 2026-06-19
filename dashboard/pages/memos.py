"""Memos dashboard page."""

from __future__ import annotations

import streamlit as st


def render(memos: list[dict]) -> None:
    st.subheader("Investment Memos")
    if not memos:
        st.info("No memos yet. Run the full mock cycle from the sidebar.")
        return

    table = [
        {
            "symbol": m.get("symbol"),
            "status": m.get("status"),
            "direction": m.get("direction"),
            "confidence": m.get("confidence_score"),
            "horizon": m.get("time_horizon"),
            "model": m.get("model_version"),
            "prompt": m.get("prompt_version"),
        }
        for m in memos
    ]
    st.dataframe(table, use_container_width=True)

    st.markdown("### Memo detail")
    symbols = [m.get("symbol") for m in memos]
    chosen = st.selectbox("Symbol", symbols)
    memo = next((m for m in memos if m.get("symbol") == chosen), None)
    if memo is None:
        return
    st.write(f"**Thesis:** {memo.get('thesis')}")
    st.write(f"**Catalyst:** {memo.get('catalyst')}")
    st.write(f"**Entry logic:** {memo.get('entry_logic')}")
    st.write(f"**Risk summary:** {memo.get('risk_summary')}")
    st.warning(f"**Skeptic view (mandatory):** {memo.get('skeptic_view')}")
    st.write(f"**Data sources:** {', '.join(memo.get('data_sources', []))}")
