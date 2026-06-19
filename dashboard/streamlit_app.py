"""Streamlit control room for Mesa Proprietária com IA.

Run with:
    streamlit run dashboard/streamlit_app.py

Shows the safety posture plus memos and signals produced by the pipeline. If no
artifacts exist yet, it can run the full mock cycle on demand (paper only).

Reads artifacts written by ``app.pipeline.TradingDeskPipeline.persist_artifacts``
(./artifacts/memos.jsonl, ./artifacts/signals.jsonl).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Make the project importable when launched via `streamlit run`.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import streamlit as st  # noqa: E402

from dashboard.pages import memos as memos_page  # noqa: E402
from dashboard.pages import orders as orders_page  # noqa: E402
from dashboard.pages import overview as overview_page  # noqa: E402
from dashboard.pages import risk as risk_page  # noqa: E402
from dashboard.pages import signals as signals_page  # noqa: E402

ARTIFACTS = Path("./artifacts")


def _load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def _run_pipeline() -> None:
    from app.pipeline import TradingDeskPipeline
    from data.universe import SYMBOLS

    pipeline = TradingDeskPipeline()
    pipeline.run(SYMBOLS)
    pipeline.persist_artifacts(str(ARTIFACTS))


def main() -> None:
    st.set_page_config(page_title="Mesa Proprietária com IA", layout="wide")
    st.title("Mesa Proprietária com IA — Control Room")
    st.caption("Research / paper-trading desk · owner capital only · **no live trading**")

    with st.sidebar:
        st.header("Controls")
        if st.button("Run full mock cycle (paper)"):
            with st.spinner("Running data → agents → memo → signal → backtest → risk → paper…"):
                _run_pipeline()
            st.success("Cycle complete. Artifacts refreshed.")
        page = st.radio("View", ["Overview", "Memos", "Signals", "Risk", "Portfolio"])

    memos = _load_jsonl(ARTIFACTS / "memos.jsonl")
    signals = _load_jsonl(ARTIFACTS / "signals.jsonl")
    portfolio_path = ARTIFACTS / "portfolio.json"
    portfolio = json.loads(portfolio_path.read_text()) if portfolio_path.exists() else None

    if page == "Overview":
        overview_page.render(memos, signals)
    elif page == "Memos":
        memos_page.render(memos)
    elif page == "Signals":
        signals_page.render(signals)
    elif page == "Risk":
        risk_page.render(signals)
    else:
        orders_page.render(portfolio)


if __name__ == "__main__":
    main()
