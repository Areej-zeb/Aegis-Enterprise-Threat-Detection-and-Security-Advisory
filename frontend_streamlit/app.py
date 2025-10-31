import json
import time
from collections import Counter
from datetime import datetime, timedelta

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import requests
import streamlit as st

API_BASE = "http://127.0.0.1:8000"

st.set_page_config(page_title="Aegis IDS Dashboard", layout="wide", page_icon="🛡️")

# Custom CSS for better styling
st.markdown(
    """
    <style>
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        border-radius: 10px;
        color: white;
        text-align: center;
    }
    .alert-high {
        background-color: #ff4444;
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-weight: bold;
    }
    .alert-medium {
        background-color: #ffaa00;
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-weight: bold;
    }
    .alert-low {
        background-color: #00C851;
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-weight: bold;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("🛡️ Aegis IDS — Real-Time Threat Detection Dashboard")


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


def filter_alerts(df, severity_filter, attack_filter, protocol_filter, confidence_threshold):
    """Apply filters to alert dataframe."""
    if df.empty:
        return df
    
    filtered_df = df.copy()
    
    # Apply filters
    if "severity" in filtered_df.columns and severity_filter:
        filtered_df = filtered_df[filtered_df["severity"].isin(severity_filter)]
    
    if "label" in filtered_df.columns and attack_filter:
        filtered_df = filtered_df[filtered_df["label"].isin(attack_filter)]
    
    if "proto" in filtered_df.columns and protocol_filter:
        filtered_df = filtered_df[filtered_df["proto"].isin(protocol_filter)]
    
    if "score" in filtered_df.columns:
        filtered_df = filtered_df[filtered_df["score"] >= confidence_threshold]
    
    return filtered_df


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
        refresh_interval = 5
else:
    st.sidebar.error("🔴 IDS Offline")
    refresh_interval = 10

st.sidebar.markdown(f"**Mode:** `{mode}`")
st.sidebar.markdown(f"**Alerts Loaded:** `{health.get('alerts_loaded', 0)}`")
st.sidebar.markdown(f"**API:** `{API_BASE}`")
st.sidebar.markdown("---")

# Controls
st.sidebar.subheader("🎛️ Controls")
auto_refresh = st.sidebar.checkbox("Auto-refresh", value=True)
max_alerts = st.sidebar.slider("Max Alerts to Display", 10, 200, 100)

# Filters
st.sidebar.markdown("---")
st.sidebar.subheader("🔍 Filters")

# Severity filter
severity_filter = st.sidebar.multiselect(
    "Severity Level",
    options=["high", "medium", "low"],
    default=["high", "medium", "low"]
)

# Attack type filter
attack_filter = st.sidebar.multiselect(
    "Attack Type",
    options=["DDoS_SYN", "DDoS_UDP", "BRUTE_FTP", "SCAN_PORT", "MITM_ARP", "BENIGN"],
    default=["DDoS_SYN", "DDoS_UDP", "BRUTE_FTP", "SCAN_PORT", "MITM_ARP", "BENIGN"]
)

# Protocol filter
protocol_filter = st.sidebar.multiselect(
    "Protocol",
    options=["TCP", "UDP", "ICMP"],
    default=["TCP", "UDP", "ICMP"]
)

# Confidence threshold
confidence_threshold = st.sidebar.slider(
    "Min Confidence Score",
    min_value=0.0,
    max_value=1.0,
    value=0.0,
    step=0.05
)

st.sidebar.markdown("---")
st.sidebar.info(f"⏱️ Refresh: **{refresh_interval}s**")

# Initialize session state for alert log
if "alert_log" not in st.session_state:
    st.session_state.alert_log = []
if "last_update" not in st.session_state:
    st.session_state.last_update = datetime.now()

# ---------------------------------------------------------------------
# Tabs
# ---------------------------------------------------------------------
tab1, tab2, tab3, tab4, tab5 = st.tabs(
    ["📊 Overview", " Live Alerts", "🧠 Explainability", "📈 Analytics", "🛡️ Threat Intel"]
)

# ---------------------------------------------------------------------
# Tab 1 — Overview Dashboard
# ---------------------------------------------------------------------
with tab1:
    st.subheader("📊 Security Overview")

    # Fetch current alerts for statistics
    current_alerts = get_alerts()
    if current_alerts:
        st.session_state.alert_log.extend(current_alerts)
        st.session_state.alert_log = st.session_state.alert_log[-max_alerts:]

    if st.session_state.alert_log:
        df = pd.DataFrame(st.session_state.alert_log)

        # Top metrics row
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            total_alerts = len(st.session_state.alert_log)
            st.metric("Total Alerts", total_alerts, delta=len(current_alerts))

        with col2:
            high_severity = len(df[df["severity"] == "high"]) if "severity" in df.columns else 0
            st.metric("🔴 High Severity", high_severity)

        with col3:
            medium_severity = len(df[df["severity"] == "medium"]) if "severity" in df.columns else 0
            st.metric("� Medium Severity", medium_severity)

        with col4:
            avg_score = df["score"].mean() if "score" in df.columns else 0
            st.metric("Avg Confidence", f"{avg_score:.2f}")

        st.markdown("---")

        # Charts row
        col1, col2 = st.columns(2)

        with col1:
            # Attack type distribution
            if "label" in df.columns:
                st.subheader("🎯 Attack Type Distribution")
                label_counts = df["label"].value_counts()
                fig = px.pie(
                    values=label_counts.values,
                    names=label_counts.index,
                    title="Detected Threat Categories",
                    color_discrete_sequence=px.colors.qualitative.Set3,
                )
                st.plotly_chart(fig, use_container_width=True)

        with col2:
            # Severity breakdown
            if "severity" in df.columns:
                st.subheader("⚠️ Severity Distribution")
                severity_counts = df["severity"].value_counts()
                colors = {"high": "#ff4444", "medium": "#ffaa00", "low": "#00C851"}
                fig = go.Figure(
                    data=[
                        go.Bar(
                            x=severity_counts.index,
                            y=severity_counts.values,
                            marker_color=[
                                colors.get(s, "#888") for s in severity_counts.index
                            ],
                        )
                    ]
                )
                fig.update_layout(
                    title="Alert Severity Breakdown",
                    xaxis_title="Severity Level",
                    yaxis_title="Count",
                    showlegend=False,
                )
                st.plotly_chart(fig, use_container_width=True)

        # Protocol distribution
        if "proto" in df.columns:
            st.subheader("🌐 Protocol Distribution")
            proto_counts = df["proto"].value_counts()
            col1, col2, col3 = st.columns(3)
            for idx, (proto, count) in enumerate(proto_counts.items()):
                with [col1, col2, col3][idx % 3]:
                    st.metric(f"{proto} Traffic", count)

    else:
        st.info("Waiting for alerts... Check that the backend is running in demo mode.")

# ---------------------------------------------------------------------
# Tab 2 — Live Alerts
# ---------------------------------------------------------------------
with tab2:
    st.subheader("📡 Live Alerts Feed")

    # Create Streamlit placeholder for the table
    table_placeholder = st.empty()
    stats_placeholder = st.empty()

    # Update loop
    iteration = 0
    while auto_refresh:
        iteration += 1

        # Get the new alert(s)
        new_alerts = get_alerts()

        # If we got at least one, append to log
        if new_alerts:
            st.session_state.alert_log.extend(new_alerts)
            st.session_state.alert_log = st.session_state.alert_log[-max_alerts:]
            st.session_state.last_update = datetime.now()

        if st.session_state.alert_log:
            # Convert to DataFrame for display
            df = pd.DataFrame(st.session_state.alert_log)
            if "timestamp" in df.columns:
                df["timestamp"] = pd.to_datetime(df["timestamp"])
                df = df.sort_values(by="timestamp", ascending=False)

            # Show statistics
            with stats_placeholder.container():
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("Alerts in Feed", len(df))
                with col2:
                    # Make datetime timezone-aware for comparison
                    now_utc = pd.Timestamp.now(tz='UTC')
                    five_min_ago = now_utc - timedelta(minutes=5)
                    recent = len(
                        df[
                            df["timestamp"] > five_min_ago
                        ]
                    )
                    st.metric("Last 5 min", recent)
                with col3:
                    st.metric("Last Update", st.session_state.last_update.strftime("%H:%M:%S"))

            # Display columns
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

            # Color code severity with better visibility
            def highlight_severity(row):
                if "severity" in row:
                    if row["severity"] == "high":
                        return ["background-color: #ffcccc; color: #8b0000; font-weight: bold"] * len(row)
                    elif row["severity"] == "medium":
                        return ["background-color: #ffe4b3; color: #cc6600; font-weight: bold"] * len(row)
                    elif row["severity"] == "low":
                        return ["background-color: #d4edda; color: #155724"] * len(row)
                return [""] * len(row)

            # Show styled table
            styled_df = df[cols].style.apply(highlight_severity, axis=1)
            table_placeholder.dataframe(
                styled_df,
                use_container_width=True,
                height=450,
            )
        else:
            table_placeholder.warning("No alerts received yet. Waiting for data...")

        time.sleep(refresh_interval)

        # Break after one iteration if auto-refresh is off
        if not auto_refresh:
            break

# ---------------------------------------------------------------------
# Tab 3 — Explainability
# ---------------------------------------------------------------------
with tab3:
    st.subheader("🧠 SHAP Explainability (Top Features)")
    shap_data = load_shap()
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        if shap_data:
            st.markdown("### 📊 Feature Importance")
            feats = shap_data.get("top_features", [])
            if feats:
                df_feats = pd.DataFrame(feats)
                fig = px.bar(
                    df_feats,
                    x="contrib",
                    y="name",
                    orientation="h",
                    title="Top Contributing Features",
                    labels={"contrib": "SHAP Value", "name": "Feature"},
                    color="contrib",
                    color_continuous_scale="Viridis",
                )
                fig.update_layout(yaxis={"categoryorder": "total ascending"})
                st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No SHAP data available.")
    
    with col2:
        if shap_data:
            st.markdown("### 🔍 Explanation Details")
            st.json(shap_data)
            
            st.markdown("### ℹ️ Feature Descriptions")
            st.markdown("""
            - **pkt_rate**: Packets per second (high values suggest flooding attacks)
            - **syn_ratio**: Ratio of SYN packets (elevated in SYN flood attacks)
            - **byte_rate**: Bytes per second (indicates data transfer volume)
            - **flow_duration**: Connection duration (very short or very long can be suspicious)
            - **avg_pkt_size**: Average packet size (abnormal sizes can indicate attacks)
            """)

# ---------------------------------------------------------------------
# Tab 4 — Analytics
# ---------------------------------------------------------------------
with tab4:
    st.subheader("📈 Advanced Analytics")
    
    if st.session_state.alert_log:
        df = pd.DataFrame(st.session_state.alert_log)
        
        # Timeline chart
        if "timestamp" in df.columns and "label" in df.columns:
            st.markdown("### 📅 Alert Timeline")
            df_timeline = df.copy()
            df_timeline["timestamp"] = pd.to_datetime(df_timeline["timestamp"])
            df_timeline["hour"] = df_timeline["timestamp"].dt.floor("T")  # Per minute
            
            timeline_counts = (
                df_timeline.groupby(["hour", "label"])
                .size()
                .reset_index(name="count")
            )
            
            fig = px.line(
                timeline_counts,
                x="hour",
                y="count",
                color="label",
                title="Alerts Over Time (by Type)",
                labels={"hour": "Time", "count": "Alert Count", "label": "Attack Type"},
            )
            st.plotly_chart(fig, use_container_width=True)
        
        # Top source IPs
        if "src_ip" in df.columns:
            st.markdown("### 🌍 Top Source IPs")
            top_ips = df["src_ip"].value_counts().head(10)
            col1, col2 = st.columns([2, 1])
            
            with col1:
                fig = px.bar(
                    x=top_ips.values,
                    y=top_ips.index,
                    orientation="h",
                    title="Most Active Source IPs",
                    labels={"x": "Alert Count", "y": "IP Address"},
                )
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                st.markdown("#### 📋 IP Details")
                for ip, count in top_ips.items():
                    threat_level = "�" if count > 5 else "🟡" if count > 2 else "🟢"
                    st.markdown(f"{threat_level} `{ip}`: **{count}** alerts")
        
        # Score distribution
        if "score" in df.columns:
            st.markdown("### 🎯 Confidence Score Distribution")
            fig = px.histogram(
                df,
                x="score",
                nbins=20,
                title="Distribution of Alert Confidence Scores",
                labels={"score": "Confidence Score", "count": "Frequency"},
                color_discrete_sequence=["#667eea"],
            )
            fig.add_vline(
                x=0.75, line_dash="dash", line_color="red", annotation_text="Threshold"
            )
            st.plotly_chart(fig, use_container_width=True)
        
        # Metrics report
        st.markdown("### 📘 Model Performance Metrics")
        st.markdown(load_metrics())
        
    else:
        st.info("No analytics data available yet. Alerts will appear here as they are detected.")
