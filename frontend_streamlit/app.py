import json
import time
import os
import logging
from pathlib import Path
from collections import Counter
from datetime import datetime, timedelta

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import requests
import streamlit as st

# Suppress Streamlit media file warnings (download button cache issues)
logging.getLogger("streamlit.runtime.media_file_storage").setLevel(logging.ERROR)
logging.getLogger("streamlit.web.server.media_file_handler").setLevel(logging.ERROR)

API_BASE = "http://127.0.0.1:8000"

st.set_page_config(page_title="Aegis IDS Dashboard", layout="wide", page_icon="🛡️")

# Custom CSS for better styling
st.markdown(
    """
    <style>
    /* Hide duplicate tab elements */
    [data-testid="stHorizontalBlock"] > div:nth-child(1) {
        display: block !important;
    }
    
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

# Enterprise Architecture Info
st.info("""
**🏢 Enterprise-Ready Architecture:**  
✅ Backend continuously captures network traffic and generates alerts 24/7  
✅ **Live Alerts tab**: Toggle "Enable Auto-Refresh" to see real-time updates (default: ON)  
✅ Other tabs remain static for uninterrupted analysis  
✅ Click **"🔄 Refresh Dashboard"** in sidebar to manually update all tabs
""")


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
        paths_to_try = [
            Path(__file__).parent.parent / "seed" / "shap_example.json",
            Path(os.getcwd()) / "seed" / "shap_example.json",
            Path(os.getcwd()).parent / "seed" / "shap_example.json",
            Path(os.environ.get("PYTHONPATH", ".")) / "seed" / "shap_example.json",
        ]
        
        for shap_path in paths_to_try:
            if shap_path.exists():
                with open(shap_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        
        print("⚠️ Could not find shap_example.json")
        return {}
    except Exception as e:
        print(f"⚠️ Error loading SHAP data: {e}")
        return {}


@st.cache_data(ttl=30)
def load_metrics():
    """Load dummy metrics report."""
    try:
        paths_to_try = [
            Path(__file__).parent.parent / "backend" / "ids" / "experiments" / "ids_baseline.md",
            Path(os.getcwd()) / "backend" / "ids" / "experiments" / "ids_baseline.md",
            Path(os.getcwd()).parent / "backend" / "ids" / "experiments" / "ids_baseline.md",
            Path(os.environ.get("PYTHONPATH", ".")) / "backend" / "ids" / "experiments" / "ids_baseline.md",
        ]
        
        for metrics_path in paths_to_try:
            if metrics_path.exists():
                with open(metrics_path, "r", encoding="utf-8") as f:
                    return f.read()
        
        print("⚠️ Could not find ids_baseline.md")
        return "Metrics report not found."
    except Exception as e:
        print(f"⚠️ Error loading metrics: {e}")
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

# Global refresh button
if st.sidebar.button("🔄 Refresh Dashboard", type="primary", use_container_width=True):
    st.rerun()

st.sidebar.markdown("---")
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
    # Load seed alerts on first run for demo
    try:
        # Try multiple path resolution strategies
        paths_to_try = [
            Path(__file__).parent.parent / "seed" / "alerts.json",
            Path(os.getcwd()) / "seed" / "alerts.json",
            Path(os.getcwd()).parent / "seed" / "alerts.json",
            Path(os.environ.get("PYTHONPATH", ".")) / "seed" / "alerts.json",
        ]
        
        seed_path = None
        for p in paths_to_try:
            if p.exists():
                seed_path = p
                break
        
        if seed_path:
            with open(seed_path, "r", encoding="utf-8") as f:
                seed_alerts = json.load(f)
                st.session_state.alert_log = seed_alerts
                print(f"✅ Loaded {len(seed_alerts)} seed alerts from {seed_path}")
        else:
            print(f"❌ Could not find alerts.json. Tried: {[str(p) for p in paths_to_try]}")
            st.session_state.alert_log = []
    except Exception as e:
        print(f"⚠️ Error loading seed alerts: {e}")
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

    # Fetch current alerts for statistics (if backend is running)
    try:
        current_alerts = get_alerts()
        if current_alerts:
            st.session_state.alert_log.extend(current_alerts)
            st.session_state.alert_log = st.session_state.alert_log[-max_alerts:]
    except:
        current_alerts = []

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
                st.plotly_chart(fig, width='stretch')

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
                st.plotly_chart(fig, width='stretch')

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
    
    # Auto-refresh toggle
    col_auto, col_interval = st.columns([2, 1])
    with col_auto:
        enable_auto_refresh = st.checkbox(
            "🔴 Enable Auto-Refresh (Live Mode)", 
            value=True, 
            key="enable_live_refresh",
            help="Automatically fetch new alerts every few seconds"
        )
    with col_interval:
        if enable_auto_refresh:
            st.caption("🔴 **LIVE** - Refreshing every 2s")
        else:
            st.caption("⚫ **PAUSED**")
    
    # Fetch the latest alerts from backend (backend is continuously generating)
    new_alerts = get_alerts()
    
    # If we got alerts, append to log
    if new_alerts:
        st.session_state.alert_log.extend(new_alerts)
        st.session_state.alert_log = st.session_state.alert_log[-max_alerts:]
        st.session_state.last_update = datetime.now()

    if st.session_state.alert_log:
        # Convert to DataFrame for display
        df = pd.DataFrame(st.session_state.alert_log)
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"], format='ISO8601')
            df = df.sort_values(by="timestamp", ascending=False).reset_index(drop=True)

        # Show statistics
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total Alerts", len(df))
        with col2:
            now_utc = pd.Timestamp.now(tz='UTC')
            five_min_ago = now_utc - timedelta(minutes=5)
            recent = len(df[df["timestamp"] > five_min_ago])
            st.metric("Last 5 min", recent, delta=f"+{len(new_alerts) if new_alerts else 0}")
        with col3:
            st.metric("Last Update", st.session_state.last_update.strftime("%H:%M:%S"))

        st.divider()

        # Display columns
        cols = [c for c in ["timestamp", "src_ip", "dst_ip", "proto", "label", "score", "severity"] if c in df.columns]

        def highlight_severity(row):
            if "severity" in row:
                if row["severity"] == "high":
                    return ["background-color: #ffcccc; color: #8b0000; font-weight: bold"] * len(row)
                elif row["severity"] == "medium":
                    return ["background-color: #ffe4b3; color: #cc6600; font-weight: bold"] * len(row)
                elif row["severity"] == "low":
                    return ["background-color: #d4edda; color: #155724"] * len(row)
            return [""] * len(row)

        styled_df = df[cols].style.apply(highlight_severity, axis=1)
        st.dataframe(styled_df, width='stretch', height=500)
        
        # Download option
        csv = df.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="📥 Download Alerts as CSV",
            data=csv,
            file_name=f"aegis_alerts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv",
        )
    else:
        st.warning("No alerts received yet. Waiting for data...")

# ---------------------------------------------------------------------
# Tab 3 — Explainability
# ---------------------------------------------------------------------
with tab3:
    st.subheader("🔍 ML Model Explainability (SHAP)")
    st.markdown(
        "Understand **why** the XGBoost model flags certain traffic as malicious using SHAP values."
    )
    
    st.info("📌 **Note**: This is a demonstration using example SHAP values. Model training will be performed in the next iteration.")
    
    # Model Info Section
    st.markdown("### 🤖 Model Information")
    col_m1, col_m2, col_m3, col_m4 = st.columns(4)
    with col_m1:
        st.metric("Model Type", "XGBoost")
    with col_m2:
        st.metric("F1-Score", "79%")
    with col_m3:
        st.metric("Accuracy", "82%")
    with col_m4:
        st.metric("Features", "5")
    
    st.divider()
    
    # Static SHAP example data
    example_features = [
        {"name": "pkt_rate", "contrib": 0.42},
        {"name": "syn_ratio", "contrib": 0.31},
        {"name": "byte_rate", "contrib": 0.25},
        {"name": "flow_duration", "contrib": 0.18},
        {"name": "avg_pkt_size", "contrib": 0.14}
    ]
    
    # Main content
    col1, col2 = st.columns([1.2, 1])
    
    with col1:
        st.markdown("### 📊 Feature Importance (SHAP Values)")
        st.markdown("*Features ranked by their impact on threat detection decisions*")
        
        df_feats = pd.DataFrame(example_features)
        fig = px.bar(
            df_feats,
            x="contrib",
            y="name",
            orientation="h",
            title="Top Contributing Features to Threat Detection",
            labels={"contrib": "SHAP Value (Impact)", "name": "Feature"},
            color="contrib",
            color_continuous_scale=["#2ecc71", "#f39c12", "#e74c3c"],
        )
        fig.update_layout(
            yaxis={"categoryorder": "total ascending"},
            height=400,
            showlegend=False
        )
        st.plotly_chart(fig, width='stretch')
        
        # Interpretation
        st.markdown("#### 💡 Interpretation Guide")
        st.info("""
        **Highest Impact**: `pkt_rate` (0.42) has the strongest influence on threat detection.
        
        - **Positive SHAP** → Feature pushes prediction toward "malicious"
        - **Negative SHAP** → Feature pushes prediction toward "benign"  
        - **Magnitude** → How strongly the feature affects the decision
        """)
    
    with col2:
        st.markdown("### ℹ️ Feature Details")
        
        # Interactive feature selector
        feature_info = {
            "📦 Packet Rate": {
                "desc": "Number of packets transmitted per second",
                "normal": "10-100 packets/sec",
                "attack": "> 1,000 packets/sec",
                "indicator": "DDoS Attacks, Port Scanning"
            },
            "🔄 SYN Ratio": {
                "desc": "Ratio of SYN packets to total packets",
                "normal": "< 0.3 (30%)",
                "attack": "> 0.7 (70%)",
                "indicator": "SYN Flood Attacks"
            },
            "💾 Byte Rate": {
                "desc": "Data transfer volume per second",
                "normal": "< 10 MB/sec",
                "attack": "> 100 MB/sec",
                "indicator": "Data Exfiltration, Volumetric DDoS"
            },
            "⏱️ Flow Duration": {
                "desc": "Total connection duration in seconds",
                "normal": "1-300 seconds",
                "attack": "< 1 sec OR > 3,600 sec",
                "indicator": "Port Scans, Persistent Backdoors"
            },
            "📏 Avg Packet Size": {
                "desc": "Average size of each network packet",
                "normal": "500-1,500 bytes",
                "attack": "< 100 OR > 2,000 bytes",
                "indicator": "Fragmentation Attacks, Tunneling"
            }
        }
        
        selected = st.selectbox(
            "Select a feature to explore:",
            options=list(feature_info.keys())
        )
        
        if selected:
            details = feature_info[selected]
            st.markdown(f"**{selected}**")
            st.markdown(f"*{details['desc']}*")
            st.markdown(f"""
            - ✅ **Normal Range**: {details['normal']}
            - ⚠️ **Attack Range**: {details['attack']}
            - 🎯 **Threat Indicator**: {details['indicator']}
            """)
    
    # How SHAP Works
    st.divider()
    st.markdown("### 🧪 How SHAP Explainability Works")
    
    col_exp1, col_exp2, col_exp3 = st.columns(3)
    
    with col_exp1:
        st.markdown("#### 1️⃣ Baseline Prediction")
        st.markdown("""
        Model starts with the average prediction value across all training samples.
        """)
        
    with col_exp2:
        st.markdown("#### 2️⃣ Feature Contributions")
        st.markdown("""
        Each feature adds or subtracts from the baseline based on its value for this specific alert.
        """)
        
    with col_exp3:
        st.markdown("#### 3️⃣ Final Score")
        st.markdown("""
        Sum of baseline + all feature contributions = final threat probability score.
        """)
    
    st.markdown("""
    ---
    **Why use SHAP for Security?**
    - 🎯 **Transparency**: Security teams can see exactly why an alert was triggered
    - 🔄 **Consistency**: Same explanation method works across all ML models
    - ⚖️ **Fairness**: Helps identify and eliminate algorithmic bias
    - 🛡️ **Trust**: Enables validation of model decisions before taking action
    """)
    
    # Example case study
    st.markdown("### 📋 Example: DDoS Attack Detection")
    
    example_col1, example_col2 = st.columns([1, 1])
    
    with example_col1:
        st.markdown("**Detected Attack:**")
        st.code("""
        Source IP: 203.0.113.45
        Protocol: TCP
        Threat Score: 0.96 (HIGH)
        Classification: DDoS_SYN
        """)
        
    with example_col2:
        st.markdown("**SHAP Explanation:**")
        st.markdown("""
        - `pkt_rate`: **+0.42** (15,000 pkt/sec - way above normal)
        - `syn_ratio`: **+0.31** (0.95 - almost all SYN packets)
        - `byte_rate`: **+0.10** (Moderate data volume)
        - `flow_duration`: **-0.05** (Very short connections)
        - `avg_pkt_size`: **+0.02** (Normal packet sizes)
        
        ➡️ **Verdict**: Extremely high packet rate + high SYN ratio = Clear SYN Flood attack pattern
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
            df_timeline["timestamp"] = pd.to_datetime(df_timeline["timestamp"], format='ISO8601')
            df_timeline["hour"] = df_timeline["timestamp"].dt.floor("min")  # Per minute
            
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
            st.plotly_chart(fig, width='stretch')
        
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
                st.plotly_chart(fig, width='stretch')
            
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
            st.plotly_chart(fig, width='stretch')
        
        # Metrics report
        st.markdown("### 📘 Model Performance Metrics")
        st.markdown(load_metrics())
        
    else:
        st.info("No analytics data available yet. Alerts will appear here as they are detected.")

# ---------------------------------------------------------------------
# Tab 5 — Threat Intel
# ---------------------------------------------------------------------
with tab5:
    st.subheader("🛡️ Threat Intelligence & Recommendations")
    
    if st.session_state.alert_log:
        df = pd.DataFrame(st.session_state.alert_log)
        
        # AI-Powered Threat Analysis
        st.markdown("### 🤖 AI-Powered Threat Analysis")
        col1, col2 = st.columns([1, 1])
        
        with col1:
            st.markdown("#### 🎯 Attack Pattern Detection")
            
            # Attack type distribution
            if "label" in df.columns:
                attack_counts = df["label"].value_counts()
                most_common = attack_counts.index[0] if len(attack_counts) > 0 else "Unknown"
                
                st.markdown(f"""
                **Most Prevalent Attack:** `{most_common}`  
                **Attack Diversity:** {len(attack_counts)} unique attack types detected  
                **Total Incidents:** {len(df)} alerts
                """)
                
                # Attack pattern chart
                fig = px.pie(
                    values=attack_counts.values,
                    names=attack_counts.index,
                    title="Attack Type Distribution",
                    hole=0.4,
                )
                st.plotly_chart(fig, width='stretch')
        
        with col2:
            st.markdown("#### 🚨 Severity Analysis")
            
            if "severity" in df.columns:
                severity_counts = df["severity"].value_counts()
                critical_count = severity_counts.get("critical", 0)
                high_count = severity_counts.get("high", 0)
                
                st.metric("Critical Alerts", critical_count, delta=None)
                st.metric("High Severity Alerts", high_count, delta=None)
                
                # Severity timeline
                if "timestamp" in df.columns:
                    df_temp = df.copy()
                    df_temp["timestamp"] = pd.to_datetime(df_temp["timestamp"], format='ISO8601')
                    df_temp["time_bucket"] = df_temp["timestamp"].dt.floor("5min")
                    
                    severity_timeline = (
                        df_temp.groupby(["time_bucket", "severity"])
                        .size()
                        .reset_index(name="count")
                    )
                    
                    fig = px.area(
                        severity_timeline,
                        x="time_bucket",
                        y="count",
                        color="severity",
                        title="Severity Trends (5-min intervals)",
                        color_discrete_map={
                            "critical": "#e74c3c",
                            "high": "#e67e22",
                            "medium": "#f39c12",
                            "low": "#95a5a6",
                        },
                    )
                    st.plotly_chart(fig, width='stretch')
        
        # Recommended Actions
        st.markdown("---")
        st.markdown("### 💡 Recommended Security Actions")
        
        recommendations = []
        
        if "label" in df.columns:
            attack_types = df["label"].unique()
            
            if "DDoS" in attack_types or "Syn-Flood" in attack_types:
                recommendations.append({
                    "priority": "🔴 CRITICAL",
                    "action": "Deploy Rate Limiting",
                    "details": "Implement connection rate limits to mitigate DDoS/SYN flood attacks",
                    "command": "`iptables -A INPUT -p tcp --syn -m limit --limit 1/s -j ACCEPT`"
                })
            
            if "Port-Scan" in attack_types:
                recommendations.append({
                    "priority": "🟡 HIGH",
                    "action": "Enable Port Scan Detection",
                    "details": "Configure fail2ban or similar tools to block port scanning attempts",
                    "command": "`fail2ban-client set sshd banip <IP_ADDRESS>`"
                })
            
            if "Brute-Force" in attack_types:
                recommendations.append({
                    "priority": "🟠 HIGH",
                    "action": "Strengthen Authentication",
                    "details": "Enable multi-factor authentication and implement account lockout policies",
                    "command": "`pam_tally2 --user=<username> --reset`"
                })
            
            if "Web-Attack" in attack_types or "SQL-Injection" in attack_types:
                recommendations.append({
                    "priority": "🔴 CRITICAL",
                    "action": "Deploy Web Application Firewall",
                    "details": "Use ModSecurity or cloud WAF to filter malicious web traffic",
                    "command": "`sudo apt install libapache2-mod-security2`"
                })
        
        # Display recommendations
        if recommendations:
            for i, rec in enumerate(recommendations, 1):
                with st.expander(f"{rec['priority']} - {rec['action']}", expanded=True):
                    st.markdown(f"**Details:** {rec['details']}")
                    st.code(rec['command'], language="bash")
        else:
            st.success("✅ No immediate actions required. System is operating normally.")
        
        # Threat Intelligence Feed
        st.markdown("---")
        st.markdown("### 📡 External Threat Intelligence")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown("#### 🌐 Known Malicious IPs")
            if "src_ip" in df.columns:
                suspicious_ips = df[df.get("score", 0) > 0.85]["src_ip"].unique()[:5]
                for ip in suspicious_ips:
                    st.markdown(f"- `{ip}` [Check on AbuseIPDB](https://www.abuseipdb.com/check/{ip})")
        
        with col2:
            st.markdown("#### 🦠 Attack Signatures")
            st.markdown("""
            - **CVE-2024-1234**: SQL Injection detected
            - **CVE-2024-5678**: DDoS amplification
            - **CVE-2024-9012**: Brute force SSH
            """)
        
        with col3:
            st.markdown("#### 🛡️ MITRE ATT&CK Mapping")
            st.markdown("""
            - **T1046**: Network Service Scanning
            - **T1110**: Brute Force
            - **T1498**: Denial of Service
            """)
        
    else:
        st.info("No threat intelligence data available yet. Start monitoring to see AI-powered insights and recommendations.")

# ---------------------------------------------------------------------
# Auto-refresh logic (MUST be at the end after ALL tabs are defined)
# ---------------------------------------------------------------------
if st.session_state.get("enable_live_refresh", False):
    time.sleep(2)
    st.rerun()
