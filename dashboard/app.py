# TerraSignal Streamlit dashboard (optional — React dashboard is primary)
# Run: streamlit run dashboard/app.py

import streamlit as st
from pathlib import Path
import json

st.set_page_config(page_title="TerraSignal", page_icon="🛰️", layout="wide")

st.title("🛰️ TerraSignal — Live Monitor")

reports_dir = Path("data/reports")
if not reports_dir.exists():
    reports_dir.mkdir(parents=True, exist_ok=True)

reports = sorted(reports_dir.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)

if not reports:
    st.info("No reports yet. Run `python main.py demo` or `python main.py run --once` to generate intel.")
    st.stop()

# Latest report
with open(reports[0]) as f:
    r = json.load(f)
st.subheader(r.get("headline", "Report"))
col1, col2, col3 = st.columns(3)
col1.metric("Confidence", "%.0f%%" % (r.get("confidence", 0) * 100))
col2.metric("Region", r.get("region", "—"))
col3.metric("Severity", r.get("severity", "—"))
st.markdown(r.get("market_implication", ""))
st.markdown(r.get("summary", ""))

st.divider()
st.subheader("Signal History")
for path in reports[:20]:
    with open(path) as f:
        row = json.load(f)
    with st.expander(row.get("headline", path.name)[:60]):
        st.json(row)
