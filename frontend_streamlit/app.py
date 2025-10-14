import json
import time

import pandas as pd
import requests
import streamlit as st

API_BASE = "http://127.0.0.1:8000"

st.set_page_config(page_title="Aegis IDS Dashboard", layout="wide")
st.title("🛡️ Aegis IDS — Mock Dashboard (Iteration-1)")


# ---------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------
@st.cache_data(ttl=10)
def get_health():
    """Fetch backend health info."""
    try:
        res = requests.get(f"{API_BASE}/api/health", timeout=5)
        if res.status_code == 200:
            return res.json()
        return {"status": "error", "msg": f"{res.status_code}"}
    except Exception as e:
        return {"status": "error", "msg": str(e)}


@st.cache_data(ttl=5)
def get_alerts():
    """Fetch alerts (random or static depending on mode)."""
    try:
        res = requests.get(f"{API_BASE}/api/alerts", timeout=5)
        if res.status_code == 200:
            return res.json()
        return []
    except Exception as e:
        st.error(f"Failed to fetch alerts: {e}")
        return []


@st.cache_data(ttl=30)
def load_shap():
    """Load dummy SHAP JSON file."""
    try:
        with open("../seed/shap_example.json", "r") as f:
            return json.load(f)
    except Exception:
        return {}


@st.cache_data(ttl=30)
def load_metrics():
    """Load dummy metrics report."""
    try:
        with open("../backend/ids/experiments/ids_baseline.md", "r") as f:
            return f.read()
    except Exception:
        return "Metrics report not found."


# ---------------------------------------------------------------------
# Sidebar — Health + Controls
# ---------------------------------------------------------------------
st.sidebar.header("⚙️ System Status")
health = get_health()
mode = health.get("mode", "static")

if health.get("status") == "ok":
    if mode == "demo":
        st.sidebar.success("🟢 IDS Online — Live Mode (Streaming)")
        refresh_interval = 2
    else:
        st.sidebar.warning("🟠 IDS Online — Static Mode (Seed Alerts)")
        refresh_interval = 8
else:
    st.sidebar.error("🔴 IDS Offline")
    refresh_interval = 10

st.sidebar.markdown(f"**Mode:** `{mode}`")
st.sidebar.markdown(f"**Alerts Loaded:** `{health.get('alerts_loaded', 0)}`")
st.sidebar.markdown(f"**API:** `{API_BASE}`")
st.sidebar.markdown("---")
st.sidebar.info(f"Auto-refresh every **{refresh_interval} s**")

# ---------------------------------------------------------------------
# Tabs
# ---------------------------------------------------------------------
tab1, tab2, tab3 = st.tabs(["📡 Live Alerts", "🧠 Explainability", "📘 Metrics"])

# ---------------------------------------------------------------------
# Tab 1 — Live Alerts
# ---------------------------------------------------------------------
with tab1:
    st.subheader("📡 Live Alerts Feed")

    # Persistent container to accumulate alerts
    alert_log = []

    # Create Streamlit placeholder for the table
    table_placeholder = st.empty()

    while True:
        # Get the new alert(s)
        new_alerts = get_alerts()

        # If we got at least one, append to log
        if new_alerts:
            alert_log.extend(new_alerts)

            # Keep only last 100 alerts
            alert_log = alert_log[-100:]

            # Convert to DataFrame for display
            df = pd.DataFrame(alert_log)
            if "timestamp" in df.columns:
                df["timestamp"] = pd.to_datetime(df["timestamp"])
                df = df.sort_values(by="timestamp", ascending=False)

            cols = [
                c
                for c in [
                    "timestamp",
                    "src_ip",
                    "dst_ip",
                    "proto",
                    "label",
                    "score",
                    "severity",
                ]
                if c in df.columns
            ]

            # Show full table (scrollable)
            table_placeholder.dataframe(
                df[cols],
                use_container_width=True,
                height=450,  # adjust for scroll height
            )
        else:
            table_placeholder.warning("No alerts received yet.")

        time.sleep(refresh_interval)

# ---------------------------------------------------------------------
# Tab 2 — Explainability
# ---------------------------------------------------------------------
with tab2:
    st.subheader("🧠 SHAP Explainability (Top Features)")
    shap_data = load_shap()
    if shap_data:
        st.json(shap_data)
        feats = shap_data.get("top_features", [])
        if feats:
            chart_data = pd.DataFrame(feats).set_index("name")
            st.bar_chart(chart_data)
    else:
        st.info("No SHAP data available.")

# ---------------------------------------------------------------------
# Tab 3 — Metrics
# ---------------------------------------------------------------------
with tab3:
    st.subheader("📘 Baseline Metrics")
    st.markdown(load_metrics())
